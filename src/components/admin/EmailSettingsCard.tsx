import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, Mail, Edit2, Check, X } from "lucide-react";
import { useEmailSettings, useUpdateEmailSetting, useSendTestEmail, getEmailTypeLabel, getEmailTypeIcon, EmailSetting } from "@/hooks/useEmailSettings";

export function EmailSettingsCard() {
  const { data: settings, isLoading } = useEmailSettings();
  const updateSetting = useUpdateEmailSetting();
  const sendTestEmail = useSendTestEmail();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedEmailType, setSelectedEmailType] = useState("");

  const handleToggle = (setting: EmailSetting) => {
    updateSetting.mutate({
      id: setting.id,
      updates: { enabled: !setting.enabled },
    });
  };

  const handleEditStart = (setting: EmailSetting) => {
    setEditingId(setting.id);
    setEditSubject(setting.subject);
  };

  const handleEditSave = (id: string) => {
    updateSetting.mutate({
      id,
      updates: { subject: editSubject },
    });
    setEditingId(null);
  };

  const handleTestEmail = () => {
    if (testEmailAddress && selectedEmailType) {
      sendTestEmail.mutate({
        emailType: selectedEmailType,
        recipientEmail: testEmailAddress,
      });
      setTestDialogOpen(false);
      setTestEmailAddress("");
    }
  };

  const openTestDialog = (emailType: string) => {
    setSelectedEmailType(emailType);
    setTestDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configuración de Emails
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configuración de Emails
          </CardTitle>
          <CardDescription>
            Gestiona los emails transaccionales del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings?.map((setting) => (
            <div
              key={setting.id}
              className="flex items-start justify-between p-4 rounded-lg border bg-card"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getEmailTypeIcon(setting.email_type)}</span>
                  <h4 className="font-medium">{getEmailTypeLabel(setting.email_type)}</h4>
                  <Badge variant={setting.enabled ? "default" : "secondary"}>
                    {setting.enabled ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {setting.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Label className="text-xs text-muted-foreground">Asunto:</Label>
                  {editingId === setting.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        className="h-7 text-sm"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleEditSave(setting.id)}
                      >
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{setting.subject}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => handleEditStart(setting)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openTestDialog(setting.email_type)}
                  disabled={!setting.enabled || sendTestEmail.isPending}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Probar
                </Button>
                <Switch
                  checked={setting.enabled}
                  onCheckedChange={() => handleToggle(setting)}
                  disabled={updateSetting.isPending}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Email de Prueba</DialogTitle>
            <DialogDescription>
              Se enviará un email de prueba de tipo "{getEmailTypeLabel(selectedEmailType)}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Email del destinatario</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="ejemplo@correo.com"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleTestEmail}
              disabled={!testEmailAddress || sendTestEmail.isPending}
            >
              {sendTestEmail.isPending ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
