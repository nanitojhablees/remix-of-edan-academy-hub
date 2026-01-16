import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RenewalEmailRequest {
  userId: string;
  userName: string;
  newExpiresAt: string;
  months: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, userName, newExpiresAt, months }: RenewalEmailRequest = await req.json();

    if (!userId || !userName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !userData?.user?.email) {
      console.error("Failed to get user email:", userError);
      return new Response(
        JSON.stringify({ error: "Could not retrieve user email" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userEmail = userData.user.email;
    const formattedDate = new Date(newExpiresAt).toLocaleDateString('es-ES', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">EDAN</h1>
          <p style="color: #a0a0a0; margin: 10px 0 0 0;">Plataforma de Educación</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #2ecc71; margin-top: 0;">¡Suscripción Renovada! 🔄</h2>
          
          <p>Hola <strong>${userName}</strong>,</p>
          
          <p>Tu suscripción a EDAN ha sido renovada exitosamente por <strong>${months} ${months === 1 ? 'mes' : 'meses'}</strong> adicionales.</p>
          
          <div style="background: #d4edda; border: 1px solid #28a745; border-radius: 5px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #155724; font-size: 18px;">
              <strong>Nueva fecha de vencimiento:</strong><br>
              <span style="font-size: 24px;">${formattedDate}</span>
            </p>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1a1a2e;">Sigue disfrutando de:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Acceso ilimitado a todos los cursos</li>
              <li>Certificados digitales verificables</li>
              <li>Soporte prioritario de instructores</li>
              <li>Actualizaciones de contenido</li>
            </ul>
          </div>
          
          <p style="margin-top: 30px;">
            ¡Gracias por seguir aprendiendo con nosotros!<br>
            <strong>El equipo de EDAN</strong>
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">Este es un mensaje automático, por favor no respondas directamente.</p>
          <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} EDAN. Todos los derechos reservados.</p>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "EDAN <onboarding@resend.dev>",
        to: [userEmail],
        subject: "✅ Tu suscripción EDAN ha sido renovada",
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Renewal email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-renewal-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
