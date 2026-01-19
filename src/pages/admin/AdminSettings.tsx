import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Bell, Shield, Database } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailSettingsCard } from "@/components/admin/EmailSettingsCard";
import { EmailLogsTable } from "@/components/admin/EmailLogsTable";

export default function AdminSettings() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Administra la configuración del sistema
        </p>
      </div>

      <Tabs defaultValue="emails" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="emails">📧 Emails</TabsTrigger>
          <TabsTrigger value="general">⚙️ General</TabsTrigger>
          <TabsTrigger value="system">🔧 Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="emails" className="space-y-6">
          <EmailSettingsCard />
          <EmailLogsTable />
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración General
              </CardTitle>
              <CardDescription>
                Ajustes básicos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo Mantenimiento</Label>
                  <p className="text-sm text-muted-foreground">
                    Desactiva el acceso público al sitio
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Registro Abierto</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite nuevos registros de usuarios
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones
              </CardTitle>
              <CardDescription>
                Configura las notificaciones del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificar nuevos registros</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe un email cuando un usuario se registra
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificar inscripciones</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe un email cuando un usuario se inscribe a un curso
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Seguridad
              </CardTitle>
              <CardDescription>
                Opciones de seguridad del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Requerir verificación de email</Label>
                  <p className="text-sm text-muted-foreground">
                    Los usuarios deben verificar su email al registrarse
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Autenticación de dos factores</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilita 2FA para todos los administradores
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Database Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Base de Datos
              </CardTitle>
              <CardDescription>
                Información del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Estado</p>
                  <p className="font-medium text-accent">Conectado</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Región</p>
                  <p className="font-medium">Lovable Cloud</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Versión</p>
                  <p className="font-medium">PostgreSQL 15</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Última sincronización</p>
                  <p className="font-medium">{new Date().toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
