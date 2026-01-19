import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EMAIL_TYPE = "expired_notification";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { userId, userName } = await req.json();
    if (!userId || !userName) return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (!userData?.user?.email) return new Response(JSON.stringify({ error: "Could not retrieve user email" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    const userEmail = userData.user.email;

    const { data: settings } = await supabaseAdmin.from("email_settings").select("enabled, subject, sender_name, sender_email").eq("email_type", EMAIL_TYPE).single();
    if (!settings?.enabled) {
      await supabaseAdmin.from("email_logs").insert({ email_type: EMAIL_TYPE, recipient_email: userEmail, recipient_name: userName, user_id: userId, status: "skipped", error_message: "Email type disabled" });
      return new Response(JSON.stringify({ success: true, skipped: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const emailHtml = `<!DOCTYPE html><html><body style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 30px; text-align: center;"><h1 style="color: #fff;">EDAN</h1></div><div style="padding: 30px; background: #fff; border: 1px solid #e0e0e0;"><h2 style="color: #e74c3c;">Tu suscripción ha expirado 😢</h2><p>Hola <strong>${userName}</strong>,</p><p>Tu suscripción a EDAN ha llegado a su fin. Tu progreso está guardado.</p><p><strong>El equipo de EDAN</strong></p></div></body></html>`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: `${settings.sender_name} <${settings.sender_email}>`, to: [userEmail], subject: settings.subject, html: emailHtml }),
    });

    const emailData = await emailResponse.json();
    await supabaseAdmin.from("email_logs").insert({ email_type: EMAIL_TYPE, recipient_email: userEmail, recipient_name: userName, user_id: userId, status: emailResponse.ok ? "sent" : "error", error_message: emailResponse.ok ? null : emailData.message });

    if (!emailResponse.ok) throw new Error(emailData.message);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};
serve(handler);
