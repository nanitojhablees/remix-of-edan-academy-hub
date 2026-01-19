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

interface WelcomeEmailRequest {
  email: string;
  userName: string;
}

const EMAIL_TYPE = "welcome";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { email, userName }: WelcomeEmailRequest = await req.json();

    if (!email || !userName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, userName" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if email type is enabled
    const { data: settings } = await supabaseAdmin
      .from("email_settings")
      .select("enabled, subject, sender_name, sender_email")
      .eq("email_type", EMAIL_TYPE)
      .single();

    if (!settings?.enabled) {
      console.log(`Email type ${EMAIL_TYPE} is disabled, skipping`);
      
      // Log skipped email
      await supabaseAdmin.from("email_logs").insert({
        email_type: EMAIL_TYPE,
        recipient_email: email,
        recipient_name: userName,
        status: "skipped",
        error_message: "Email type disabled",
      });

      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "Email type disabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

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
          <h2 style="color: #2ecc71; margin-top: 0;">¡Bienvenido a EDAN! 🎉</h2>
          
          <p>Hola <strong>${userName}</strong>,</p>
          
          <p>¡Nos alegra mucho que te hayas unido a nuestra comunidad de aprendizaje!</p>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1a1a2e;">Próximos pasos:</h3>
            <ol style="margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 10px;">Activa tu membresía para acceder a todos los cursos</li>
              <li style="margin-bottom: 10px;">Explora nuestro catálogo de cursos por nivel</li>
              <li style="margin-bottom: 10px;">Comienza tu viaje de aprendizaje</li>
            </ol>
          </div>
          
          <p>Si tienes alguna pregunta, no dudes en contactar a nuestro equipo de soporte en <strong>soporte@edan.com</strong></p>
          
          <p style="margin-top: 30px;">
            ¡Bienvenido al futuro del aprendizaje!<br>
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
        from: `${settings.sender_name} <${settings.sender_email}>`,
        to: [email],
        subject: settings.subject,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      // Log error
      await supabaseAdmin.from("email_logs").insert({
        email_type: EMAIL_TYPE,
        recipient_email: email,
        recipient_name: userName,
        status: "error",
        error_message: emailData.message || "Failed to send email",
      });
      throw new Error(emailData.message || "Failed to send email");
    }

    // Log success
    await supabaseAdmin.from("email_logs").insert({
      email_type: EMAIL_TYPE,
      recipient_email: email,
      recipient_name: userName,
      status: "sent",
    });

    console.log("Welcome email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
