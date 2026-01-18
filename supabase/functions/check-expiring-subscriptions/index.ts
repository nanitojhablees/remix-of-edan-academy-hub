import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NOTIFICATION_DAYS = [7, 3, 1]; // Days before expiration to notify
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Helper to send expiring notification email
async function sendExpiringEmail(
  supabase: any,
  userId: string,
  userName: string,
  daysRemaining: number,
  expiresAt: string,
  planName: string
): Promise<void> {
  try {
    // Get user email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData?.user?.email) {
      console.error("Could not get user email for expiring notification:", userError);
      return;
    }

    const userEmail = userData.user.email;
    const expiresDate = new Date(expiresAt);

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
          <h2 style="color: #f39c12; margin-top: 0;">⏰ Tu suscripción está por vencer</h2>
          
          <p>Hola <strong>${userName}</strong>,</p>
          
          <p>Te recordamos que tu suscripción <strong>${planName}</strong> vence en <strong>${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}</strong>.</p>
          
          <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>Fecha de vencimiento:</strong><br>
              ${expiresDate.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          
          <p>No pierdas acceso a:</p>
          <ul>
            <li>Todos los cursos y niveles de certificación</li>
            <li>Tus certificados digitales</li>
            <li>El soporte de instructores expertos</li>
            <li>La comunidad exclusiva de profesionales</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://edan-hub.lovable.app/payment" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Renovar Ahora</a>
          </div>
          
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

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "EDAN <onboarding@resend.dev>",
        to: [userEmail],
        subject: `⏰ Tu suscripción vence en ${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'} - EDAN`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error sending expiring email:", errorData);
    } else {
      console.log(`Expiring notification email sent to ${userEmail}`);
    }
  } catch (error) {
    console.error("Error in sendExpiringEmail:", error);
  }
}

// Helper to send expired notification email
async function sendExpiredEmail(
  supabase: any,
  userId: string,
  userName: string
): Promise<void> {
  try {
    // Get user email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData?.user?.email) {
      console.error("Could not get user email for expired notification:", userError);
      return;
    }

    const userEmail = userData.user.email;

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
          <h2 style="color: #e74c3c; margin-top: 0;">❌ Tu suscripción ha expirado</h2>
          
          <p>Hola <strong>${userName}</strong>,</p>
          
          <p>Te informamos que tu suscripción en EDAN ha <strong>expirado</strong>.</p>
          
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #721c24;">
              <strong>¿Qué significa esto?</strong><br>
              Ya no tienes acceso a los cursos ni al contenido de la plataforma hasta que renueves tu membresía.
            </p>
          </div>
          
          <p>Renueva ahora y recupera acceso a:</p>
          <ul>
            <li>Los 4 niveles de certificación EDAN</li>
            <li>Más de 50 lecciones de contenido exclusivo</li>
            <li>Certificados digitales verificables</li>
            <li>Comunidad de profesionales en emergencias</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://edan-hub.lovable.app/payment" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Renovar Membresía</a>
          </div>
          
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

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "EDAN <onboarding@resend.dev>",
        to: [userEmail],
        subject: "❌ Tu suscripción ha expirado - EDAN",
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error sending expired email:", errorData);
    } else {
      console.log(`Expired notification email sent to ${userEmail}`);
    }
  } catch (error) {
    console.error("Error in sendExpiredEmail:", error);
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting subscription expiration check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const results = {
      checked: 0,
      notified: 0,
      errors: [] as string[],
    };

    // Check for each notification threshold
    for (const days of NOTIFICATION_DAYS) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + days);
      
      // Get start and end of target day
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      console.log(`Checking subscriptions expiring in ${days} days (${startOfDay.toISOString()} - ${endOfDay.toISOString()})`);

      // Fetch active subscriptions expiring on target date
      const { data: subscriptions, error: subError } = await supabase
        .from("subscriptions")
        .select(`
          id,
          user_id,
          expires_at,
          plan:payment_plans(name)
        `)
        .eq("status", "active")
        .gte("expires_at", startOfDay.toISOString())
        .lte("expires_at", endOfDay.toISOString());

      if (subError) {
        console.error("Error fetching subscriptions:", subError);
        results.errors.push(`Error fetching subscriptions for ${days} days: ${subError.message}`);
        continue;
      }

      results.checked += subscriptions?.length || 0;
      console.log(`Found ${subscriptions?.length || 0} subscriptions expiring in ${days} days`);

      if (!subscriptions || subscriptions.length === 0) continue;

      // Process each subscription
      for (const sub of subscriptions) {
        try {
          // Check if notification already exists for this subscription and day threshold
          const notificationKey = `sub_expiring_${sub.id}_${days}d`;
          
          const { data: existingNotification } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", sub.user_id)
            .eq("type", "subscription_expiring")
            .ilike("message", `%${days} día%`)
            .gte("created_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
            .maybeSingle();

          if (existingNotification) {
            console.log(`Notification already sent for subscription ${sub.id} (${days} days)`);
            continue;
          }

          // Get user profile for personalization
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("user_id", sub.user_id)
            .single();

          const expiresDate = new Date(sub.expires_at!);
          const planName = (sub.plan as any)?.name || "tu suscripción";
          const userName = profile ? `${profile.first_name} ${profile.last_name}` : "";
          
          // Create notification
          const { error: notifError } = await supabase
            .from("notifications")
            .insert({
              user_id: sub.user_id,
              title: days === 1 ? "⚠️ Tu suscripción vence mañana" : `📅 Tu suscripción vence en ${days} días`,
              message: `Hola ${profile?.first_name || ""}! ${planName} vence el ${expiresDate.toLocaleDateString("es-ES", { 
                weekday: "long", 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              })}. Renueva ahora para no perder acceso a tus cursos.`,
              type: "subscription_expiring",
              link: "/payment",
            });

          if (notifError) {
            console.error(`Error creating notification for user ${sub.user_id}:`, notifError);
            results.errors.push(`Failed to notify user ${sub.user_id}: ${notifError.message}`);
          } else {
            results.notified++;
            console.log(`Notification sent for subscription ${sub.id} (${days} days before expiration)`);
            
            // Also send email notification
            await sendExpiringEmail(
              supabase,
              sub.user_id,
              userName,
              days,
              sub.expires_at!,
              planName
            );
          }
        } catch (err) {
          console.error(`Error processing subscription ${sub.id}:`, err);
          results.errors.push(`Error processing subscription ${sub.id}: ${err}`);
        }
      }
    }

    // Also check for expired subscriptions and update their status
    console.log("Checking for newly expired subscriptions...");
    
    const { data: expiredSubs, error: expiredError } = await supabase
      .from("subscriptions")
      .select("id, user_id")
      .eq("status", "active")
      .lt("expires_at", now.toISOString());

    if (expiredError) {
      console.error("Error fetching expired subscriptions:", expiredError);
      results.errors.push(`Error fetching expired: ${expiredError.message}`);
    } else if (expiredSubs && expiredSubs.length > 0) {
      console.log(`Found ${expiredSubs.length} expired subscriptions to update`);
      
      for (const expired of expiredSubs) {
        // Get user profile for email
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", expired.user_id)
          .single();
        
        const userName = profile ? `${profile.first_name} ${profile.last_name}` : "";

        // Update subscription status
        await supabase
          .from("subscriptions")
          .update({ status: "expired" })
          .eq("id", expired.id);

        // Update profile membership status
        await supabase
          .from("profiles")
          .update({ membership_status: "expired" })
          .eq("user_id", expired.user_id);

        // Send expiration notification (in-app)
        await supabase
          .from("notifications")
          .insert({
            user_id: expired.user_id,
            title: "❌ Tu suscripción ha expirado",
            message: "Tu suscripción ha vencido. Renueva ahora para continuar accediendo a todos los cursos y contenido exclusivo.",
            type: "subscription_expired",
            link: "/payment",
          });
        
        // Send expiration email
        await sendExpiredEmail(supabase, expired.user_id, userName);
      }
      
      console.log(`Updated ${expiredSubs.length} expired subscriptions`);
    }

    console.log("Subscription check completed:", results);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscription check completed",
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Fatal error in check-expiring-subscriptions:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
