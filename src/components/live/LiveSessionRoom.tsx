import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCourseLiveSessions } from "@/hooks/useLiveSessions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Users, 
  MessageCircle, 
  Video, 
  ExternalLink, 
  User, 
  Bot 
} from "lucide-react";
import { format, isPast, isFuture } from "date-fns";
import { es } from "date-fns/locale";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";

interface LiveStreamMessage {
  id: string;
  room_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profile?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

interface RoomUser {
  userId: string;
  userName: string;
}

export function LiveSessionRoom({ courseId, sessionId }: { courseId: string; sessionId: string }) {
  const { user, session } = useAuth();
  const { data: sessions } = useCourseLiveSessions(courseId);
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<LiveStreamMessage[]>([]);
  const [message, setMessage] = useState("");
  const [usersInRoom, setUsersInRoom] = useState<RoomUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [streamData, setStreamData] = useState<any>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentSession = sessions?.find(s => s.id === sessionId);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (!user || !session?.access_token || !currentSession) return;
    
    // Connect to WebSocket server
    const socket = io(import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:3000", {
      transports: ["websocket"],
      auth: {
        token: session.access_token
      }
    });
    
    socketRef.current = socket;
    
    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      setIsConnected(true);
      toast({
        title: "Conectado",
        description: "Conectado al streaming en vivo"
      });
      
      // Join the room
      socket.emit("join_room", {
        roomId: currentSession.id,
        courseId: courseId,
        moduleId: currentSession.module_id
      });
    });
    
    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar al streaming en vivo",
        variant: "destructive"
      });
    });
    
    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setIsConnected(false);
      toast({
        title: "Desconectado",
        description: "Desconectado del streaming en vivo"
      });
    });
    
    // Room events
    socket.on("user_joined", (data) => {
      toast({
        title: "Usuario conectado",
        description: `${data.userName} se ha unido a la sala`
      });
    });
    
    socket.on("user_left", (data) => {
      toast({
        title: "Usuario desconectado",
        description: "Un usuario ha dejado la sala"
      });
    });
    
    socket.on("room_users", (users: RoomUser[]) => {
      setUsersInRoom(users);
    });
    
    socket.on("stream_update", (data) => {
      console.log("Stream data received:", data);
      setStreamData(data.streamData);
    });
    
    // Chat events
    socket.on("new_message", (message: LiveStreamMessage) => {
      setMessages(prev => [...prev, message]);
    });
    
    socket.on("message_sent", (message: LiveStreamMessage) => {
      // Message was sent successfully, it will also come through new_message
    });
    
    socket.on("error", (error: { message: string }) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    });
    
    return () => {
      if (socket) {
        socket.emit("leave_room", currentSession.id);
        socket.disconnect();
      }
    };
  }, [user, session, currentSession, courseId, toast]);
  
  const sendMessage = () => {
    if (!socketRef.current || !isConnected || !message.trim()) return;
    
    socketRef.current.emit("chat_message", {
      roomId: currentSession?.id,
      message: message.trim(),
      courseId: courseId
    });
    
    setMessage("");
  };
  
  const sendStreamData = (streamData: any) => {
    if (!socketRef.current || !isConnected) return;
    
    socketRef.current.emit("stream_data", {
      roomId: currentSession?.id,
      streamData
    });
  };
  
  if (!currentSession) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Sesión no encontrada</p>
        </div>
      </div>
    );
  }
  
  const sessionDate = new Date(currentSession.start_time);
  const endWindow = new Date(sessionDate.getTime() + 3 * 60 * 60 * 1000);
  const isCurrentlyLive = isPast(sessionDate) && isFuture(endWindow);
  const isOver = isPast(endWindow);
  
  return (
    <div className="space-y-6">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Video className="h-5 w-5 text-red-500" />
                <CardTitle className="flex items-center gap-2">
                  {currentSession.title}
                  {isCurrentlyLive && (
                    <Badge className="bg-red-500 hover:bg-red-500 text-white text-xs animate-pulse">
                      EN VIVO
                    </Badge>
                  )}
                </CardTitle>
              </div>
              {currentSession.description && (
                <p className="text-muted-foreground">{currentSession.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {usersInRoom.length} participantes
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {messages.length} mensajes
                </span>
                <span className="flex items-center gap-1">
                  {format(sessionDate, "PPP 'a las' p", { locale: es })}
                </span>
              </div>
            </div>
            {isCurrentlyLive && currentSession.meeting_url && (
              <Button className="bg-red-500 hover:bg-red-600 text-white gap-2" asChild>
                <a href={currentSession.meeting_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Entrar a la Videollamada
                </a>
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Stream Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Streaming en Vivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isCurrentlyLive ? (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative">
                  {streamData ? (
                    <div className="text-center">
                      <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Streaming activo</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Video className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Esperando transmisión...</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        El instructor aún no ha iniciado la transmisión
                      </p>
                    </div>
                  )}
                  
                  {/* Connection Status */}
                  <div className="absolute top-4 right-4">
                    <Badge variant={isConnected ? "default" : "destructive"}>
                      {isConnected ? "Conectado" : "Desconectado"}
                    </Badge>
                  </div>
                </div>
              ) : isOver ? (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Video className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Sesión finalizada</p>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Video className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">La sesión aún no ha comenzado</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(sessionDate, "PPP 'a las' p", { locale: es })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Chat Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Chat en Vivo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-96 flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground text-center">
                        Aún no hay mensajes en el chat.<br />
                        ¡Sé el primero en saludar!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => {
                        const isCurrentUser = msg.user_id === user?.id;
                        const userName = msg.profile 
                          ? `${msg.profile.first_name} ${msg.profile.last_name}`
                          : "Usuario";
                        
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={msg.profile?.avatar_url || undefined} />
                              <AvatarFallback>
                                {userName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? "text-right" : ""}`}>
                              <div className="text-xs text-muted-foreground mb-1">
                                {userName}
                                <span className="mx-2">•</span>
                                {format(new Date(msg.created_at), "HH:mm", { locale: es })}
                              </div>
                              <div 
                                className={`inline-block p-3 rounded-2xl ${
                                  isCurrentUser 
                                    ? "bg-primary text-primary-foreground rounded-br-md" 
                                    : "bg-muted rounded-bl-md"
                                }`}
                              >
                                <p className="text-sm">{msg.message}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
                
                {isCurrentlyLive && (
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        disabled={!isConnected}
                      />
                      <Button 
                        size="icon" 
                        onClick={sendMessage}
                        disabled={!message.trim() || !isConnected}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Participants Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participantes ({usersInRoom.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {usersInRoom.map((user) => (
                    <div key={user.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{user.userName.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.userName}</p>
                        {user.userId === currentSession.module_id && (
                          <Badge variant="secondary" className="text-xs">
                            Instructor
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          
          {isCurrentlyLive && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de la Sesión</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium">Enlace de la videollamada:</p>
                  <a 
                    href={currentSession.meeting_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all text-sm"
                  >
                    {currentSession.meeting_url}
                  </a>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>• Puedes participar por chat o unirte a la videollamada</p>
                  <p>• Las preguntas se responden en tiempo real</p>
                  <p>• Mantén una buena conducta en el chat</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}