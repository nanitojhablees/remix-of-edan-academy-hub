import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NOTIFICATION_DAYS = [7, 3, 1]; // Days before expiration to notify

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
            .select("first_name")
            .eq("user_id", sub.user_id)
            .single();

          const expiresDate = new Date(sub.expires_at!);
          const planName = (sub.plan as any)?.name || "tu suscripción";
          
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

        // Send expiration notification
        await supabase
          .from("notifications")
          .insert({
            user_id: expired.user_id,
            title: "❌ Tu suscripción ha expirado",
            message: "Tu suscripción ha vencido. Renueva ahora para continuar accediendo a todos los cursos y contenido exclusivo.",
            type: "subscription_expired",
            link: "/payment",
          });
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
