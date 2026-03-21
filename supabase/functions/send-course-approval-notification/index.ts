// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CourseApprovalNotificationRequest {
  courseId: string;
  instructorEmail: string;
  instructorName: string;
  courseTitle: string;
  action: 'approved' | 'rejected';
  rejectionReason?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseId, instructorEmail, instructorName, courseTitle, action, rejectionReason }: CourseApprovalNotificationRequest = await req.json();

    if (!instructorEmail || !instructorName || !courseTitle || !action) {
      throw new Error("Faltan campos requeridos: instructorEmail, instructorName, courseTitle, action");
    }

    if (RESEND_API_KEY) {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Determinar el asunto y contenido del correo según la acción
      let subject = "";
      let emailHtml = "";

      if (action === 'approved') {
        subject = "🎉 ¡Tu curso ha sido aprobado!";
        
        emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">EDAN</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
              <h2 style="color: #2ecc71; margin-top: 0;">¡Felicidades! Tu curso ha sido aprobado</h2>
              <p>Hola <strong>${instructorName}</strong>,</p>
              <p>Estamos encantados de informarte que tu curso <strong>"${courseTitle}"</strong> ha sido <strong>APROBADO</strong> por nuestro equipo de administración.</p>
              <p>El curso ahora está publicado y disponible para que los estudiantes se inscriban y comiencen a aprender.</p>
              <p style="margin-top: 30px;">
                Accede a tu panel de instructor para ver tu curso publicado:<br>
                <a href="${Deno.env.get('APP_URL')}/dashboard/instructor-courses" style="color: #3b82f6; text-decoration: none;">Ir al panel de instructor</a>
              </p>
              <p style="margin-top: 30px;">
                Atentamente,<br>
                <strong>El equipo de EDAN</strong>
              </p>
            </div>
          </body>
          </html>
        `;
      } else if (action === 'rejected') {
        subject = "🔄 Actualización sobre tu curso";
        
        emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">EDAN</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0; border-top: none;">
              <h2 style="color: #e74c3c; margin-top: 0;">Actualización sobre tu curso</h2>
              <p>Hola <strong>${instructorName}</strong>,</p>
              <p>Lamentamos informarte que tu curso <strong>"${courseTitle}"</strong> ha sido <strong>RECHAZADO</strong> por nuestro equipo de administración.</p>
              ${
                rejectionReason 
                  ? `<p>Razón del rechazo: <em>"${rejectionReason}"</em></p>`
                  : ''
              }
              <p>Puedes editar tu curso y volver a enviarlo para revisión cuando esté listo.</p>
              <p style="margin-top: 30px;">
                Accede a tu panel de instructor para editar tu curso:<br>
                <a href="${Deno.env.get('APP_URL')}/dashboard/instructor-courses" style="color: #3b82f6; text-decoration: none;">Ir al panel de instructor</a>
              </p>
              <p style="margin-top: 30px;">
                Atentamente,<br>
                <strong>El equipo de EDAN</strong>
              </p>
            </div>
          </body>
          </html>
        `;
      } else {
        throw new Error("La acción debe ser 'approved' o 'rejected'");
      }

      // Enviar correo usando Resend
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "EDAN <no-reply@edan.com>",
          to: [instructorEmail],
          subject: subject,
          html: emailHtml,
        }),
      });

      const emailData = await emailResponse.json();

      if (!emailResponse.ok) {
        console.error("Error al enviar el correo:", emailData);
        throw new Error(`Error al enviar el correo: ${JSON.stringify(emailData)}`);
      }

      // Registrar en la tabla de logs
      await supabaseAdmin.from("email_logs").insert({
        email_type: `course_${action}_notification`,
        recipient_email: instructorEmail,
        recipient_name: instructorName,
        status: "sent",
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error en send-course-approval-notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
