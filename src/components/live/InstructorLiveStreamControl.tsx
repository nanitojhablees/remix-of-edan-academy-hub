import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  ScreenShare, 
  ScreenShareOff,
  Users,
  MessageCircle,
  Send,
  Play,
  Pause,
  Square
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";
import { LiveSessionMessage } from "@/hooks/useLiveSessions";

interface RoomUser {
  userId: string;
  userName: string;
}

interface StreamData {
  isStreaming: boolean;
  streamUrl?: string;
  title?: string;
}

export function InstructorLiveStreamControl({ 
  sessionId, 
  courseId,
  moduleId
}: { 
  sessionId: string; 
  courseId: string;
  moduleId: string;
}) {
  const { user, session } = useAuth();
  const { toast } = useToast();
  
  const [isConnected, setIsConnected] = useState(false);
  const [usersInRoom, setUsersInRoom] = useState<RoomUser[]>([]);
  const [messages, setMessages] = useState<LiveSessionMessage[]>([]);
  const [message, setMessage] = useState("");
  const [streamData, setStreamData] = useState<StreamData>({ isStreaming: false });
  const [streamTitle, setStreamTitle] = useState("");
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (!user || !session?.access_token) return;
    
    // Connect to WebSocket server
    const socket = io(import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:3000", {
      transports: ["websocket"],
      auth: {
        token: session.access_token
      }
    });
    
    socketRef.current = socket;
    
    socket.on("connect", () => {
      console.log("Instructor connected to WebSocket server");
      setIsConnected(true);
      
      // Join the room as instructor
      socket.emit("join_room", {
        roomId: sessionId,
        courseId: courseId,
        moduleId: moduleId
      });
    });
    
    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar al servidor de streaming",
        variant: "destructive"
      });
    });
    
    socket.on("disconnect", () => {
      console.log("Instructor disconnected from WebSocket server");
      setIsConnected(false);
    });
    
    // Room events
    socket.on("room_users", (users: RoomUser[]) => {
      setUsersInRoom(users);
    });
    
    socket.on("user_joined", (data) => {
      setUsersInRoom(prev => [...prev, { userId: data.userId, userName: data.userName }]);
      toast({
        title: "Usuario conectado",
        description: `${data.userName} se ha unido a la sala`
      });
    });
    
    socket.on("user_left", (data) => {
      setUsersInRoom(prev => prev.filter(u => u.userId !== data.userId));
      toast({
        title: "Usuario desconectado",
        description: "Un usuario ha dejado la sala"
      });
    });
    
    // Chat events
    socket.on("new_message", (message: LiveSessionMessage) => {
      setMessages(prev => [...prev, message]);
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
        socket.emit("leave_room", sessionId);
        socket.disconnect();
      }
    };
  }, [user, session, sessionId, courseId, moduleId, toast]);
  
  const startStream = () => {
    if (!socketRef.current || !isConnected) return;
    
    const data = {
      isStreaming: true,
      title: streamTitle,
      startedAt: new Date().toISOString()
    };
    
    socketRef.current.emit("stream_data", {
      roomId: sessionId,
      streamData: data
    });
    
    setStreamData(data);
    toast({
      title: "Streaming iniciado",
      description: "La transmisión en vivo ha comenzado"
    });
  };
  
  const stopStream = () => {
    if (!socketRef.current || !isConnected) return;
    
    const data = {
      isStreaming: false,
      title: streamTitle,
      endedAt: new Date().toISOString()
    };
    
    socketRef.current.emit("stream_data", {
      roomId: sessionId,
      streamData: data
    });
    
    setStreamData({ isStreaming: false });
    toast({
      title: "Streaming detenido",
      description: "La transmisión en vivo ha finalizado"
    });
  };
  
  const sendMessage = () => {
    if (!socketRef.current || !isConnected || !message.trim()) return;
    
    socketRef.current.emit("chat_message", {
      roomId: sessionId,
      message: message.trim(),
      courseId: courseId
    });
    
    setMessage("");
  };
  
  return (
    <div className="space-y-6">
      {/* Stream Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Control de Streaming
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label htmlFor="stream-title">Título de la Transmisión</Label>
              <Input
                id="stream-title"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="¿De qué tema vamos a hablar hoy?"
                disabled={streamData.isStreaming}
              />
            </div>
            <div className="flex items-end gap-2">
              {!streamData.isStreaming ? (
                <Button 
                  onClick={startStream}
                  className="bg-red-500 hover:bg-red-600 text-white gap-2"
                  disabled={!isConnected || !streamTitle.trim()}
                >
                  <Play className="h-4 w-4" />
                  Iniciar Streaming
                </Button>
              ) : (
                <Button 
                  onClick={stopStream}
                  variant="destructive"
                  className="gap-2"
                >
                  <Square className="h-4 w-4" />
                  Detener Streaming
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
              {isConnected ? "Conectado" : "Desconectado"}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {usersInRoom.length} participantes
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {messages.length} mensajes
            </div>
            {streamData.isStreaming && (
              <div className="flex items-center gap-1 text-red-500">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                EN VIVO
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Preview Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Vista Previa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative">
                {streamData.isStreaming ? (
                  <div className="text-center">
                    <Video className="h-12 w-12 text-red-500 mx-auto mb-2 animate-pulse" />
                    <p className="text-muted-foreground">Transmitiendo en vivo</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {streamTitle}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <VideoOff className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Streaming detenido</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Haz clic en "Iniciar Streaming" para comenzar
                    </p>
                  </div>
                )}
                
                {/* Stream Controls Overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center justify-center gap-2 bg-black/50 rounded-full p-2">
                    <Button size="icon" variant="secondary" className="bg-white/20 hover:bg-white/30">
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="bg-white/20 hover:bg-white/30">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="bg-white/20 hover:bg-white/30">
                      <ScreenShare className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
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
                        Los participantes comenzarán a enviar mensajes pronto.
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
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                        {user.userId === moduleId && (
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
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instrucciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Usa el chat para interactuar con los estudiantes</p>
              <p>• Comparte tu pantalla durante la transmisión</p>
              <p>• Mantén una buena conexión a internet</p>
              <p>• El enlace de videollamada está en la descripción</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}