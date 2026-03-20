import { useState } from "react";
import { useParams } from "react-router-dom";
import { useModuleLiveSessions, useCreateLiveSession, useUpdateLiveSession, useDeleteLiveSession, LiveSession } from "@/hooks/useLiveSessions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Save, Edit, Radio, Calendar, Link as LinkIcon, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { InstructorLiveStreamControl } from "./InstructorLiveStreamControl";

export function InstructorLiveSessions({ moduleId }: { moduleId: string }) {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: sessions, isLoading } = useModuleLiveSessions(moduleId);
  const createSession = useCreateLiveSession();
  const updateSession = useUpdateLiveSession();
  const deleteSession = useDeleteLiveSession();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    meeting_url: ""
  });

  const resetForm = () => {
    setFormData({ title: "", description: "", start_time: "", meeting_url: "" });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleEdit = (session: LiveSession) => {
    // Format date for datetime-local input
    // Supabase returns ISO string, slice it to fit standard YYYY-MM-DDThh:mm
    const formattedDate = new Date(session.start_time).toISOString().slice(0, 16);
    
    setFormData({
      title: session.title,
      description: session.description || "",
      start_time: formattedDate,
      meeting_url: session.meeting_url
    });
    setEditingId(session.id);
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.start_time || !formData.meeting_url) return;
    
    // Convert local datetime back to ISO so Supabase stores it properly with timezone
    const isoDate = new Date(formData.start_time).toISOString();

    if (editingId) {
      await updateSession.mutateAsync({
        id: editingId,
        module_id: moduleId,
        title: formData.title,
        description: formData.description,
        start_time: isoDate,
        meeting_url: formData.meeting_url
      });
    } else {
      await createSession.mutateAsync({
        module_id: moduleId,
        title: formData.title,
        description: formData.description,
        start_time: isoDate,
        meeting_url: formData.meeting_url
      });
    }
    resetForm();
  };

  const handleStartStream = (session: LiveSession) => {
    setActiveSession(session);
  };

  if (isLoading) return <div className="text-sm text-muted-foreground pt-2">Cargando sesiones...</div>;

  return (
    <Tabs defaultValue="schedule" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="schedule">Agendar Clases</TabsTrigger>
        <TabsTrigger value="stream" disabled={!activeSession}>Streaming en Vivo</TabsTrigger>
      </TabsList>
      
      <TabsContent value="schedule" className="space-y-4">
        {/* Session List */}
        <div className="space-y-2 mt-2">
          {sessions?.map((session) => (
            <div key={session.id} className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors group">
              <Radio className="h-4 w-4 text-red-500 animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm truncate block">{session.title}</span>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(session.start_time), "PP p", { locale: es })}
                  </span>
                  <span className="flex items-center gap-1 text-blue-500 truncate">
                    <LinkIcon className="h-3 w-3" />
                    {session.meeting_url.replace(/^https?:\/\//, '').substring(0, 25)}...
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-green-600 hover:text-green-700"
                  onClick={() => handleStartStream(session)}
                >
                  <Play className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(session)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => {
                  if(confirm("¿Cancelar clase en vivo?")) deleteSession.mutate({ id: session.id, module_id: moduleId });
                }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={isCreating || !!editingId} onOpenChange={(open) => !open && resetForm()}>
          {!isCreating && !editingId && (
            <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => setIsCreating(true)}>
              <Radio className="h-4 w-4 mr-2" />
              Agendar Clase en Vivo
            </Button>
          )}
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Clase en Vivo" : "Agendar Nueva Clase en Vivo"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Tema de la clase *</Label>
                <Input 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Masterclass de Finanzas"
                />
              </div>
              <div className="grid gap-2">
                <Label>Fecha y Hora *</Label>
                <Input 
                  type="datetime-local" 
                  value={formData.start_time} 
                  onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Enlace de la videollamada (Zoom, Meet, etc) *</Label>
                <Input 
                  value={formData.meeting_url} 
                  onChange={e => setFormData({ ...formData, meeting_url: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                />
              </div>
              <div className="grid gap-2">
                <Label>Descripción Breve (Opcional)</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Pre-requisitos o temas a tratar..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button 
                onClick={handleSave} 
                disabled={!formData.title || !formData.start_time || !formData.meeting_url || createSession.isPending || updateSession.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar Clase
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TabsContent>
      
      <TabsContent value="stream" className="space-y-4">
        {activeSession && courseId && (
          <InstructorLiveStreamControl 
            sessionId={activeSession.id}
            courseId={courseId}
            moduleId={moduleId}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
