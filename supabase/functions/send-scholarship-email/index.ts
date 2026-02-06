import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ScholarshipEmailRequest {
  userId: string;
  userEmail: string;
  userName: string;
  scholarshipName: string;
  startsAt: string;
  expiresAt: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-scholarship-email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email type is enabled
    const { data: emailSettings } = await supabase
      .from("email_settings")
      .select("enabled, subject, sender_email, sender_name")
      .eq("email_type", "scholarship_granted")
      .single();

    if (!emailSettings?.enabled) {
      console.log("Scholarship email notifications are disabled");
      return new Response(
        JSON.stringify({ message: "Email notifications disabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const {
      userId,
      userEmail,
      userName,
      scholarshipName,
      startsAt,
      expiresAt,
    }: ScholarshipEmailRequest = await req.json();

    console.log(`Sending scholarship email to ${userEmail} for scholarship ${scholarshipName}`);

    const startDate = new Date(startsAt).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const endDate = new Date(expiresAt).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const senderEmail = emailSettings.sender_email || "onboarding@resend.dev";
    const senderName = emailSettings.sender_name || "EDAN";
    const subject = emailSettings.subject || "¡Felicitaciones! Has recibido una beca EDAN";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Beca Otorgada</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1a365d 0%, #2d4a7c 100%); padding: 40px 30px; text-align: center;">
            <div style="width: 80px; height: 80px; background-color: #fbbf24; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 40px;">🎓</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">¡Felicitaciones!</h1>
            <p style="color: #e2e8f0; margin: 10px 0 0; font-size: 16px;">Has recibido una beca EDAN</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="color: #1a202c; font-size: 16px; margin: 0 0 20px; line-height: 1.6;">
              Hola <strong>${userName}</strong>,
            </p>
            
            <p style="color: #4a5568; font-size: 16px; margin: 0 0 30px; line-height: 1.6;">
              Nos complace informarte que has sido beneficiario de una beca en la plataforma EDAN. 
              Esta es una gran oportunidad para continuar tu formación profesional.
            </p>

            <!-- Scholarship Details Box -->
            <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
              <h2 style="color: #166534; margin: 0 0 16px; font-size: 18px; font-weight: 600;">Detalles de tu Beca</h2>
              
              <div style="margin-bottom: 12px;">
                <span style="color: #4b5563; font-size: 14px;">Nombre de la Beca:</span>
                <p style="color: #1a202c; font-size: 16px; font-weight: 600; margin: 4px 0 0;">${scholarshipName}</p>
              </div>
              
              <div style="margin-bottom: 12px;">
                <span style="color: #4b5563; font-size: 14px;">Fecha de Inicio:</span>
                <p style="color: #1a202c; font-size: 16px; font-weight: 600; margin: 4px 0 0;">${startDate}</p>
              </div>
              
              <div>
                <span style="color: #4b5563; font-size: 14px;">Vigencia hasta:</span>
                <p style="color: #1a202c; font-size: 16px; font-weight: 600; margin: 4px 0 0;">${endDate}</p>
              </div>
            </div>

            <p style="color: #4a5568; font-size: 16px; margin: 0 0 30px; line-height: 1.6;">
              Tu membresía ya está activa. Puedes acceder a todos los cursos y recursos 
              disponibles en la plataforma durante el período de tu beca.
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="https://edan-hub.lovable.app/dashboard" 
                 style="display: inline-block; background: linear-gradient(135deg, #1a365d 0%, #2d4a7c 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Ir a la Plataforma
              </a>
            </div>

            <p style="color: #718096; font-size: 14px; margin: 0; line-height: 1.6; text-align: center;">
              Si tienes alguna pregunta, no dudes en contactarnos.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f7fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #a0aec0; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} EDAN - Todos los derechos reservados
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { error: emailError } = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: [userEmail],
      subject: subject,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      
      // Log the failed email
      await supabase.from("email_logs").insert({
        user_id: userId,
        email_type: "scholarship_granted",
        recipient_email: userEmail,
        recipient_name: userName,
        status: "failed",
        error_message: emailError.message,
      });

      throw emailError;
    }

    console.log("Scholarship email sent successfully");

    // Log the successful email
    await supabase.from("email_logs").insert({
      user_id: userId,
      email_type: "scholarship_granted",
      recipient_email: userEmail,
      recipient_name: userName,
      status: "sent",
    });

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-scholarship-email:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
