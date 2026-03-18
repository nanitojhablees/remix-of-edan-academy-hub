import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMAIL_TYPE = "welcome";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, firstName, lastName, role, country, profession } = await req.json();

    if (!email || !password || !firstName || !lastName || !role) {
      throw new Error("Missing required fields");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      throw new Error("El usuario ya existe");
    }

    // 2. Create auth user with confirmed email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        country: country || null,
        profession: profession || null,
        needs_password_reset: true,
      },
    });

    if (authError) throw authError;

    const userId = authData.user.id;
    const initialStatus = role === "admin" ? "active" : "pending";

    // 3. Update profile status based on role
    await supabaseAdmin
      .from("profiles")
      .update({ membership_status: initialStatus })
      .eq("user_id", userId);

    // 4. Update the role (The trigger defaults to 'estudiante', we overwrite if needed)
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role }, { onConflict: "user_id" });

    // 5. Send Email with Credentials
    if (RESEND_API_KEY) {
      const { data: settings } = await supabaseAdmin
        .from("email_settings")
        .select("enabled, subject, sender_name, sender_email")
        .eq("email_type", EMAIL_TYPE)
        .single();
        
      const senderName = settings?.sender_name || "EDAN";
      const senderEmail = settings?.sender_email || "no-reply@edan.com";
      const subject = "Tus credenciales de acceso a EDAN";
      
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
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
            <h2 style="color: #2ecc71; margin-top: 0;">¡Bienvenido a EDAN, ${firstName}! 🎉</h2>
            <p>Un administrador ha creado una cuenta para ti. Aquí están tus credenciales de acceso temporal:</p>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">Correo: <span style="font-weight: normal; color: #555;">${email}</span></p>
              <p style="margin: 10px 0 0 0; font-weight: bold;">Contraseña temporal: <span style="font-weight: normal; color: #555;">${password}</span></p>
            </div>
            ${initialStatus === 'pending' ? '<p><strong>Importante:</strong> Tu cuenta se encuentra en estado <em>Pendiente</em>. Un administrador debe aprobarla antes de que puedas acceder.</p>' : ''}
            <p>Una vez que accedas por primera vez, se te pedirá cambiar esta contraseña por seguridad.</p>
          </div>
        </body>
        </html>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: \`\${senderName} <\${senderEmail}>\`,
          to: [email],
          subject: subject,
          html: emailHtml,
        }),
      });
      
      await supabaseAdmin.from("email_logs").insert({
        email_type: "manual_creation_credentials",
        recipient_email: email,
        recipient_name: firstName,
        status: "sent",
      });
    }

    return new Response(JSON.stringify({ success: true, user: authData.user }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
