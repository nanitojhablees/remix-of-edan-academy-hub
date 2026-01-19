import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EMAIL_TYPE = "payment_confirmation";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { userId, userName, planName, amount, currency, expiresAt } = await req.json();
    if (!userId || !userName) return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (!userData?.user?.email) return new Response(JSON.stringify({ error: "Could not retrieve user email" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    const userEmail = userData.user.email;

    const { data: settings } = await supabaseAdmin.from("email_settings").select("enabled, subject, sender_name, sender_email").eq("email_type", EMAIL_TYPE).single();
    if (!settings?.enabled) {
      await supabaseAdmin.from("email_logs").insert({ email_type: EMAIL_TYPE, recipient_email: userEmail, recipient_name: userName, user_id: userId, status: "skipped", error_message: "Email type disabled" });
      return new Response(JSON.stringify({ success: true, skipped: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const formattedDate = new Date(expiresAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;"><h1 style="color: #ffffff; margin: 0;">EDAN</h1></div><div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0;"><h2 style="color: #2ecc71;">¡Pago Confirmado! ✅</h2><p>Hola <strong>${userName}</strong>,</p><p>Tu pago ha sido procesado exitosamente.</p><div style="background: #f8f9fa; padding: 20px; margin: 20px 0;"><p><strong>Plan:</strong> ${planName}</p><p><strong>Monto:</strong> $${amount} ${currency}</p><p><strong>Válido hasta:</strong> ${formattedDate}</p></div><p><strong>El equipo de EDAN</strong></p></div></body></html>`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: `${settings.sender_name} <${settings.sender_email}>`, to: [userEmail], subject: settings.subject, html: emailHtml }),
    });

    const emailData = await emailResponse.json();
    await supabaseAdmin.from("email_logs").insert({ email_type: EMAIL_TYPE, recipient_email: userEmail, recipient_name: userName, user_id: userId, status: emailResponse.ok ? "sent" : "error", error_message: emailResponse.ok ? null : emailData.message });

    if (!emailResponse.ok) throw new Error(emailData.message);
    return new Response(JSON.stringify({ success: true, data: emailData }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
