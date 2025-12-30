// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const testUsers = [
      {
        email: "admin@edan-test.com",
        password: "Admin123!",
        role: "admin",
        first_name: "Admin",
        last_name: "EDAN",
        profession: "Administrador de Plataforma",
        country: "México",
      },
      {
        email: "instructor@edan-test.com",
        password: "Instructor123!",
        role: "instructor",
        first_name: "María",
        last_name: "García",
        profession: "Instructora de Capacitación",
        country: "España",
      },
      {
        email: "estudiante@edan-test.com",
        password: "Estudiante123!",
        role: "estudiante",
        first_name: "Carlos",
        last_name: "López",
        profession: "Estudiante",
        country: "Colombia",
      },
    ];

    const createdUsers = [];

    for (const user of testUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === user.email);

      if (existingUser) {
        createdUsers.push({
          email: user.email,
          role: user.role,
          status: "already_exists",
        });
        continue;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          first_name: user.first_name,
          last_name: user.last_name,
          country: user.country,
          profession: user.profession,
        },
      });

      if (authError) {
        console.error(`Error creating user ${user.email}:`, authError);
        createdUsers.push({
          email: user.email,
          role: user.role,
          status: "error",
          error: authError.message,
        });
        continue;
      }

      const userId = authData.user.id;

      // Update profile with membership_status active
      await supabaseAdmin
        .from("profiles")
        .update({ membership_status: "active" })
        .eq("user_id", userId);

      // Insert role
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert({
          user_id: userId,
          role: user.role,
        }, { onConflict: "user_id" });

      if (roleError) {
        console.error(`Error setting role for ${user.email}:`, roleError);
      }

      // Initialize user points
      await supabaseAdmin
        .from("user_points")
        .upsert({
          user_id: userId,
          total_points: user.role === "admin" ? 1000 : user.role === "instructor" ? 500 : 100,
          current_level: user.role === "admin" ? 5 : user.role === "instructor" ? 3 : 1,
        }, { onConflict: "user_id" });

      createdUsers.push({
        email: user.email,
        password: user.password,
        role: user.role,
        status: "created",
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test users processed",
        users: createdUsers,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
