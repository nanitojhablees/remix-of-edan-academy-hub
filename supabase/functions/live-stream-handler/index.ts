import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Server } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create Supabase client with service key for internal use
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upgrade to WebSocket connection
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    // Initialize Socket.IO server
    const io = new Server(socket, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Authentication middleware
    io.use(async (socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      try {
        // Verify JWT token
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data?.user) {
          return next(new Error("Authentication error: Invalid token"));
        }
        
        // Attach user to socket
        (socket as any).user = data.user;
        next();
      } catch (err) {
        next(new Error("Authentication error: " + err.message));
      }
    });

    // Connection handler
    io.on("connection", async (socket: any) => {
      console.log(`User ${socket.user.id} connected`);
      
      // Join room handler
      socket.on("join_room", async (data: { roomId: string; courseId: string; moduleId: string }) => {
        const { roomId, courseId, moduleId } = data;
        
        // Verify user has access to this course
        const { data: enrollment, error } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', socket.user.id)
          .eq('course_id', courseId)
          .single();
          
        if (error && !enrollment) {
          // Check if user is instructor or admin
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', socket.user.id)
            .in('role', ['instructor', 'admin'])
            .single();
            
          if (!roleData) {
            socket.emit("error", { message: "No tienes acceso a esta sala" });
            return;
          }
        }
        
        // Join the room
        socket.join(roomId);
        
        // Notify others in the room
        socket.to(roomId).emit("user_joined", {
          userId: socket.user.id,
          userName: `${socket.user.user_metadata?.first_name || ''} ${socket.user.user_metadata?.last_name || ''}`.trim() || socket.user.email
        });
        
        // Get current users in room
        const socketsInRoom = await io.in(roomId).fetchSockets();
        const usersInRoom = socketsInRoom.map(s => ({
          userId: (s as any).user.id,
          userName: `${(s as any).user.user_metadata?.first_name || ''} ${(s as any).user.user_metadata?.last_name || ''}`.trim() || (s as any).user.email
        }));
        
        socket.emit("room_users", usersInRoom);
      });
      
      // Leave room handler
      socket.on("leave_room", (roomId: string) => {
        socket.leave(roomId);
        socket.to(roomId).emit("user_left", {
          userId: socket.user.id
        });
      });
      
      // Stream data handler (for instructor to send video/stream data)
      socket.on("stream_data", (data: { roomId: string; streamData: any }) => {
        const { roomId, streamData } = data;
        socket.to(roomId).emit("stream_update", {
          userId: socket.user.id,
          streamData
        });
      });
      
      // Chat message handler
      socket.on("chat_message", async (data: { roomId: string; message: string; courseId: string }) => {
        const { roomId, message, courseId } = data;
        
        if (!message.trim()) return;
        
        // Save message to database
        const { data: savedMessage, error } = await supabase
          .from('live_session_messages')
          .insert({
            room_id: roomId,
            user_id: socket.user.id,
            message: message.trim(),
            course_id: courseId
          })
          .select(`
            *,
            profile:profiles(first_name, last_name, avatar_url)
          `)
          .single();
          
        if (error) {
          console.error('Error saving message:', error);
          socket.emit("error", { message: "Error al enviar el mensaje" });
          return;
        }
        
        // Broadcast message to room
        socket.to(roomId).emit("new_message", savedMessage);
        socket.emit("message_sent", savedMessage);
      });
      
      // Disconnect handler
      socket.on("disconnect", () => {
        console.log(`User ${socket.user.id} disconnected`);
        // Notify rooms that user left
        socket.rooms.forEach((roomId: string) => {
          if (roomId !== socket.id) {
            socket.to(roomId).emit("user_left", {
              userId: socket.user.id
            });
          }
        });
      });
    });

    return response;
    
  } catch (error) {
    console.error('Error in live-stream-handler:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});