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

interface SuspensionEmailRequest {
  userId: string;
  userName: string;
  reason?: string;
}

const EMAIL_TYPE = "suspension";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { userId, userName, reason }: SuspensionEmailRequest = await req.json();

    if (!userId || !userName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, userName" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData?.user?.email) {
      return new Response(
        JSON.stringify({ error: "Could not retrieve user email" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const userEmail = userData.user.email;

    // Check if email type is enabled
    const { data: settings } = await supabaseAdmin
      .from("email_settings")
      .select("enabled, subject, sender_name, sender_email")
      .eq("email_type", EMAIL_TYPE)
      .single();

    if (!settings?.enabled) {
      console.log(`Email type ${EMAIL_TYPE} is disabled, skipping`);
      await supabaseAdmin.from("email_logs").insert({
        email_type: EMAIL_TYPE,
        recipient_email: userEmail,
        recipient_name: userName,
        user_id: userId,
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
          <h2 style="color: #e74c3c; margin-top: 0;">Cuenta Suspendida</h2>
          
          <p>Hola <strong>${userName}</strong>,</p>
          
          <p>Te informamos que tu cuenta en EDAN ha sido <strong>suspendida temporalmente</strong>.</p>
          
          ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
          
          <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>¿Qué significa esto?</strong><br>
              Durante la suspensión no podrás acceder a los cursos ni al contenido de la plataforma.
            </p>
          </div>
          
          <p>Si crees que esto es un error o deseas más información, por favor contacta a nuestro equipo de soporte escribiendo a soporte@edan.com</p>
          
          <p style="margin-top: 30px;">
            Atentamente,<br>
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
        to: [userEmail],
        subject: settings.subject,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      await supabaseAdmin.from("email_logs").insert({
        email_type: EMAIL_TYPE,
        recipient_email: userEmail,
        recipient_name: userName,
        user_id: userId,
        status: "error",
        error_message: emailData.message || "Failed to send email",
      });
      throw new Error(emailData.message || "Failed to send email");
    }

    await supabaseAdmin.from("email_logs").insert({
      email_type: EMAIL_TYPE,
      recipient_email: userEmail,
      recipient_name: userName,
      user_id: userId,
      status: "sent",
    });

    console.log("Suspension email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-suspension-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
