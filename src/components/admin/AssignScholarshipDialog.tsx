import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, GraduationCap, Calendar, Percent, DollarSign } from "lucide-react";
import { useActiveScholarships, useAssignScholarship, Scholarship } from "@/hooks/useScholarships";

interface AssignScholarshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export function AssignScholarshipDialog({ 
  open, 
  onOpenChange, 
  userId, 
  userName 
}: AssignScholarshipDialogProps) {
  const { data: scholarships, isLoading: loadingScholarships } = useActiveScholarships();
  const assignScholarship = useAssignScholarship();
  
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<string>("");
  const [startsAt, setStartsAt] = useState<string>(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const selectedScholarship = scholarships?.find(s => s.id === selectedScholarshipId);

  const getScholarshipBadge = (scholarship: Scholarship) => {
    switch (scholarship.type) {
      case "full":
        return <Badge className="bg-green-500/20 text-green-600"><Percent className="w-3 h-3 mr-1" />100%</Badge>;
      case "partial":
        return <Badge className="bg-blue-500/20 text-blue-600"><Percent className="w-3 h-3 mr-1" />{scholarship.discount_percent}%</Badge>;
      case "fixed":
        return <Badge className="bg-purple-500/20 text-purple-600"><DollarSign className="w-3 h-3 mr-1" />${scholarship.discount_amount}</Badge>;
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedScholarshipId) return;

    await assignScholarship.mutateAsync({
      scholarship_id: selectedScholarshipId,
      user_id: userId,
      starts_at: startsAt,
      notes: notes || undefined,
    });

    // Reset form
    setSelectedScholarshipId("");
    setNotes("");
    setStartsAt(new Date().toISOString().split("T")[0]);
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedScholarshipId("");
    setNotes("");
    setStartsAt(new Date().toISOString().split("T")[0]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Asignar Beca
          </DialogTitle>
          <DialogDescription>
            Asignar una beca a <strong>{userName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Seleccionar Beca *</Label>
            {loadingScholarships ? (
              <div className="flex items-center justify-center h-10">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : scholarships?.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay becas disponibles para asignar.
              </p>
            ) : (
              <Select
                value={selectedScholarshipId}
                onValueChange={setSelectedScholarshipId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una beca..." />
                </SelectTrigger>
                <SelectContent>
                  {scholarships?.map((scholarship) => (
                    <SelectItem key={scholarship.id} value={scholarship.id}>
                      <div className="flex items-center gap-2">
                        <span>{scholarship.name}</span>
                        {getScholarshipBadge(scholarship)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedScholarship && (
            <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{selectedScholarship.name}</span>
                {getScholarshipBadge(selectedScholarship)}
              </div>
              {selectedScholarship.description && (
                <p className="text-sm text-muted-foreground">{selectedScholarship.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedScholarship.duration_months} meses</span>
                </div>
                {selectedScholarship.max_recipients && (
                  <span className="text-muted-foreground">
                    {selectedScholarship.current_recipients}/{selectedScholarship.max_recipients} asignadas
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="starts_at">Fecha de Inicio</Label>
            <Input
              id="starts_at"
              type="date"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales sobre la asignación..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedScholarshipId || assignScholarship.isPending}
            >
              {assignScholarship.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Asignar Beca
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
