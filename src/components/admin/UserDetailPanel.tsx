import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAdminUsers, UserDetails } from "@/hooks/useAdminUsers";
import { useUserScholarships, useRevokeScholarship, ScholarshipRecipient } from "@/hooks/useScholarships";
import { AssignScholarshipDialog } from "./AssignScholarshipDialog";
import { 
  User, Clock, MapPin, BookOpen, Award, Trophy, 
  Plus, X, Save, Loader2, GraduationCap, Shield,
  Calendar, Percent, DollarSign, CheckCircle, XCircle
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

type AppRole = "admin" | "instructor" | "estudiante";

interface UserDetailPanelProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000];
const LEVEL_NAMES = [
  "Novato", "Aprendiz", "Estudiante", "Practicante", "Intermedio",
  "Avanzado", "Experto", "Maestro", "Gran Maestro", "Leyenda"
];

const getScholarshipTypeBadge = (scholarship: ScholarshipRecipient["scholarship"]) => {
  if (!scholarship) return null;
  switch (scholarship.type) {
    case "full":
      return <Badge className="bg-accent/20 text-accent"><Percent className="w-3 h-3 mr-1" />100%</Badge>;
    case "partial":
      return <Badge className="bg-primary/20 text-primary"><Percent className="w-3 h-3 mr-1" />{scholarship.discount_percent}%</Badge>;
    case "fixed":
      return <Badge className="bg-secondary/50 text-secondary-foreground"><DollarSign className="w-3 h-3 mr-1" />${scholarship.discount_amount}</Badge>;
    default:
      return null;
  }
};

const getScholarshipStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-accent/20 text-accent"><CheckCircle className="w-3 h-3 mr-1" />Activa</Badge>;
    case "expired":
      return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Vencida</Badge>;
    case "revoked":
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Revocada</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function UserDetailPanel({ userId, open, onOpenChange }: UserDetailPanelProps) {
  const {
    useUserDetails,
    useUserEnrollments,
    useUserBadges,
    useUserPoints,
    useAvailableCourses,
    useAvailableBadges,
    updateProfile,
    updateRole,
    assignCourse,
    removeCourse,
    assignBadge,
    removeBadge,
    isUpdating
  } = useAdminUsers();

  const { data: user, isLoading: loadingUser } = useUserDetails(userId);
  const { data: enrollments, isLoading: loadingEnrollments } = useUserEnrollments(userId);
  const { data: badges, isLoading: loadingBadges } = useUserBadges(userId);
  const { data: points } = useUserPoints(userId);
  const { data: availableCourses } = useAvailableCourses();
  const { data: availableBadges } = useAvailableBadges();
  const { data: userScholarships, isLoading: loadingScholarships } = useUserScholarships(userId || "");
  const revokeScholarship = useRevokeScholarship();

  const [editForm, setEditForm] = useState<Partial<UserDetails>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [assignCourseOpen, setAssignCourseOpen] = useState(false);
  const [assignBadgeOpen, setAssignBadgeOpen] = useState(false);
  const [assignScholarshipOpen, setAssignScholarshipOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedBadge, setSelectedBadge] = useState<string>("");
  const [revokeRecipient, setRevokeRecipient] = useState<ScholarshipRecipient | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
 
   const handleEditStart = () => {
     if (user) {
       setEditForm({
         first_name: user.first_name,
         last_name: user.last_name,
         country: user.country,
         profession: user.profession,
         phone: user.phone,
         membership_status: user.membership_status
       });
       setIsEditing(true);
     }
   };
 
   const handleSave = () => {
     if (userId && editForm) {
       updateProfile({ userId, updates: editForm });
       setIsEditing(false);
     }
   };
 
   const handleRoleChange = (role: AppRole) => {
     if (userId) {
       updateRole({ userId, role });
     }
   };
 
   const handleAssignCourse = () => {
     if (userId && selectedCourse) {
       assignCourse({ userId, courseId: selectedCourse });
       setSelectedCourse("");
       setAssignCourseOpen(false);
     }
   };
 
   const handleAssignBadge = () => {
     if (userId && selectedBadge) {
       const badge = availableBadges?.find(b => b.id === selectedBadge);
       if (badge) {
         assignBadge({ 
           userId, 
           badgeId: selectedBadge,
           badgeName: badge.name,
           pointsValue: badge.points_value
         });
         setSelectedBadge("");
         setAssignBadgeOpen(false);
       }
     }
   };
 
   const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];
   const earnedBadgeIds = badges?.map(b => b.badge_id) || [];
 
   const availableCoursesToAssign = availableCourses?.filter(c => !enrolledCourseIds.includes(c.id)) || [];
   const availableBadgesToAssign = availableBadges?.filter(b => !earnedBadgeIds.includes(b.id)) || [];
 
   const nextLevelPoints = LEVEL_THRESHOLDS[points?.current_level || 1] || 9000;
   const currentLevelPoints = LEVEL_THRESHOLDS[(points?.current_level || 1) - 1] || 0;
   const progressToNextLevel = Math.min(
     ((points?.total_points || 0) - currentLevelPoints) / (nextLevelPoints - currentLevelPoints) * 100,
     100
   );
 
   if (loadingUser) {
     return (
       <Sheet open={open} onOpenChange={onOpenChange}>
         <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
           <div className="flex items-center justify-center h-full">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
           </div>
         </SheetContent>
       </Sheet>
     );
   }
 
   return (
     <Sheet open={open} onOpenChange={onOpenChange}>
       <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
         <SheetHeader className="mb-6">
           <SheetTitle>Detalle de Usuario</SheetTitle>
         </SheetHeader>
 
         {user && (
           <>
             {/* User Header */}
             <div className="flex items-center gap-4 mb-6 p-4 rounded-lg bg-muted/50">
               <Avatar className="h-16 w-16">
                 <AvatarImage src={user.avatar_url || undefined} />
                 <AvatarFallback className="text-lg font-bold bg-primary text-primary-foreground">
                   {user.first_name?.[0]}{user.last_name?.[0]}
                 </AvatarFallback>
               </Avatar>
               <div className="flex-1">
                 <h3 className="text-lg font-semibold">{user.first_name} {user.last_name}</h3>
                 <div className="flex items-center gap-2 mt-1">
                   <Badge variant={user.membership_status === "active" ? "default" : "secondary"}>
                     {user.membership_status === "active" ? "Activo" : 
                      user.membership_status === "pending" ? "Pendiente" :
                      user.membership_status === "suspended" ? "Suspendido" :
                      user.membership_status}
                   </Badge>
                   <Badge variant="outline" className="gap-1">
                     {user.role === "admin" ? <Shield className="h-3 w-3" /> : 
                      user.role === "instructor" ? <GraduationCap className="h-3 w-3" /> : 
                      <User className="h-3 w-3" />}
                     {user.role}
                   </Badge>
                 </div>
               </div>
             </div>
 
              <Tabs defaultValue="info" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="info" className="text-xs">Info</TabsTrigger>
                  <TabsTrigger value="activity" className="text-xs">Actividad</TabsTrigger>
                  <TabsTrigger value="courses" className="text-xs">Cursos</TabsTrigger>
                  <TabsTrigger value="scholarships" className="text-xs">Becas</TabsTrigger>
                  <TabsTrigger value="gamification" className="text-xs">Logros</TabsTrigger>
                </TabsList>
 
               {/* Info Tab */}
               <TabsContent value="info" className="space-y-4">
                 <Card>
                   <CardHeader className="flex flex-row items-center justify-between py-3">
                     <CardTitle className="text-base">Información Personal</CardTitle>
                     {!isEditing ? (
                       <Button variant="outline" size="sm" onClick={handleEditStart}>
                         Editar
                       </Button>
                     ) : (
                       <div className="flex gap-2">
                         <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                           Cancelar
                         </Button>
                         <Button size="sm" onClick={handleSave} disabled={isUpdating}>
                           {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                           <span className="ml-1">Guardar</span>
                         </Button>
                       </div>
                     )}
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <Label>Nombre</Label>
                         {isEditing ? (
                           <Input 
                             value={editForm.first_name || ""} 
                             onChange={e => setEditForm({...editForm, first_name: e.target.value})}
                           />
                         ) : (
                           <p className="text-sm text-muted-foreground">{user.first_name}</p>
                         )}
                       </div>
                       <div className="space-y-2">
                         <Label>Apellido</Label>
                         {isEditing ? (
                           <Input 
                             value={editForm.last_name || ""} 
                             onChange={e => setEditForm({...editForm, last_name: e.target.value})}
                           />
                         ) : (
                           <p className="text-sm text-muted-foreground">{user.last_name}</p>
                         )}
                       </div>
                     </div>
                     <div className="space-y-2">
                       <Label>País</Label>
                       {isEditing ? (
                         <Input 
                           value={editForm.country || ""} 
                           onChange={e => setEditForm({...editForm, country: e.target.value})}
                         />
                       ) : (
                         <p className="text-sm text-muted-foreground">{user.country || "No especificado"}</p>
                       )}
                     </div>
                     <div className="space-y-2">
                       <Label>Profesión</Label>
                       {isEditing ? (
                         <Input 
                           value={editForm.profession || ""} 
                           onChange={e => setEditForm({...editForm, profession: e.target.value})}
                         />
                       ) : (
                         <p className="text-sm text-muted-foreground">{user.profession || "No especificado"}</p>
                       )}
                     </div>
                     <div className="space-y-2">
                       <Label>Teléfono</Label>
                       {isEditing ? (
                         <Input 
                           value={editForm.phone || ""} 
                           onChange={e => setEditForm({...editForm, phone: e.target.value})}
                         />
                       ) : (
                         <p className="text-sm text-muted-foreground">{user.phone || "No especificado"}</p>
                       )}
                     </div>
                     <div className="space-y-2">
                       <Label>Estado de Membresía</Label>
                       {isEditing ? (
                         <Select 
                           value={editForm.membership_status || ""} 
                           onValueChange={v => setEditForm({...editForm, membership_status: v})}
                         >
                           <SelectTrigger>
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="pending">Pendiente</SelectItem>
                             <SelectItem value="active">Activo</SelectItem>
                             <SelectItem value="suspended">Suspendido</SelectItem>
                             <SelectItem value="expired">Vencido</SelectItem>
                             <SelectItem value="cancelled">Cancelado</SelectItem>
                           </SelectContent>
                         </Select>
                       ) : (
                         <p className="text-sm text-muted-foreground">{user.membership_status}</p>
                       )}
                     </div>
                   </CardContent>
                 </Card>
 
                 <Card>
                   <CardHeader className="py-3">
                     <CardTitle className="text-base">Rol del Usuario</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <Select value={user.role} onValueChange={(v) => handleRoleChange(v as AppRole)}>
                       <SelectTrigger>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="estudiante">Estudiante</SelectItem>
                         <SelectItem value="instructor">Instructor</SelectItem>
                         <SelectItem value="admin">Administrador</SelectItem>
                       </SelectContent>
                     </Select>
                   </CardContent>
                 </Card>
               </TabsContent>
 
               {/* Activity Tab */}
               <TabsContent value="activity" className="space-y-4">
                 <Card>
                   <CardHeader className="py-3">
                     <CardTitle className="text-base flex items-center gap-2">
                       <Clock className="h-4 w-4" />
                       Actividad del Usuario
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <div className="flex items-center justify-between py-2 border-b">
                       <span className="text-sm text-muted-foreground">Última conexión</span>
                       <span className="text-sm font-medium">
                         {user.last_login 
                           ? format(new Date(user.last_login), "PPP 'a las' HH:mm", { locale: es })
                           : "Nunca"
                         }
                       </span>
                     </div>
                     <div className="flex items-center justify-between py-2 border-b">
                       <span className="text-sm text-muted-foreground flex items-center gap-2">
                         <MapPin className="h-4 w-4" />
                         Dirección IP
                       </span>
                       <span className="text-sm font-medium font-mono">
                         {user.last_ip_address || "No disponible"}
                       </span>
                     </div>
                     <div className="flex items-center justify-between py-2 border-b">
                       <span className="text-sm text-muted-foreground">Fecha de registro</span>
                       <span className="text-sm font-medium">
                         {format(new Date(user.created_at), "PPP", { locale: es })}
                       </span>
                     </div>
                     <div className="flex items-center justify-between py-2">
                       <span className="text-sm text-muted-foreground">Última actualización</span>
                       <span className="text-sm font-medium">
                         {format(new Date(user.updated_at), "PPP", { locale: es })}
                       </span>
                     </div>
                   </CardContent>
                 </Card>
               </TabsContent>
 
               {/* Courses Tab */}
               <TabsContent value="courses" className="space-y-4">
                 <Card>
                   <CardHeader className="flex flex-row items-center justify-between py-3">
                     <CardTitle className="text-base flex items-center gap-2">
                       <BookOpen className="h-4 w-4" />
                       Cursos Inscritos ({enrollments?.length || 0})
                     </CardTitle>
                     <Dialog open={assignCourseOpen} onOpenChange={setAssignCourseOpen}>
                       <DialogTrigger asChild>
                         <Button size="sm" variant="outline" disabled={availableCoursesToAssign.length === 0}>
                           <Plus className="h-4 w-4 mr-1" />
                           Asignar
                         </Button>
                       </DialogTrigger>
                       <DialogContent>
                         <DialogHeader>
                           <DialogTitle>Asignar Curso</DialogTitle>
                         </DialogHeader>
                         <div className="space-y-4 py-4">
                           <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                             <SelectTrigger>
                               <SelectValue placeholder="Seleccionar curso..." />
                             </SelectTrigger>
                             <SelectContent>
                               {availableCoursesToAssign.map(course => (
                                 <SelectItem key={course.id} value={course.id}>
                                   {course.title} ({course.level})
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </div>
                         <DialogFooter>
                           <Button variant="outline" onClick={() => setAssignCourseOpen(false)}>
                             Cancelar
                           </Button>
                           <Button onClick={handleAssignCourse} disabled={!selectedCourse}>
                             Asignar Curso
                           </Button>
                         </DialogFooter>
                       </DialogContent>
                     </Dialog>
                   </CardHeader>
                   <CardContent>
                     {loadingEnrollments ? (
                       <div className="flex justify-center py-4">
                         <Loader2 className="h-6 w-6 animate-spin" />
                       </div>
                     ) : enrollments?.length === 0 ? (
                       <p className="text-sm text-muted-foreground text-center py-4">
                         No está inscrito en ningún curso
                       </p>
                     ) : (
                       <div className="space-y-3">
                         {enrollments?.map(enrollment => (
                           <div key={enrollment.id} className="flex items-center justify-between p-3 rounded-lg border">
                             <div className="flex-1">
                               <p className="font-medium text-sm">{enrollment.course?.title}</p>
                               <div className="flex items-center gap-2 mt-1">
                                 <Badge variant="outline" className="text-xs">
                                   {enrollment.course?.level}
                                 </Badge>
                                 <span className="text-xs text-muted-foreground">
                                   {enrollment.progress_percent}% completado
                                 </span>
                               </div>
                               <Progress value={enrollment.progress_percent} className="h-1 mt-2" />
                             </div>
                             <Button 
                               variant="ghost" 
                               size="icon"
                               className="text-destructive hover:text-destructive"
                               onClick={() => removeCourse({ enrollmentId: enrollment.id, userId: userId! })}
                             >
                               <X className="h-4 w-4" />
                             </Button>
                           </div>
                         ))}
                       </div>
                     )}
                   </CardContent>
                 </Card>
                </TabsContent>

                {/* Scholarships Tab */}
                <TabsContent value="scholarships" className="space-y-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between py-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Historial de Becas ({userScholarships?.length || 0})
                      </CardTitle>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setAssignScholarshipOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Asignar
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {loadingScholarships ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : userScholarships?.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No tiene becas asignadas
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {userScholarships?.map(recipient => {
                            const daysRemaining = recipient.status === "active" 
                              ? differenceInDays(new Date(recipient.expires_at), new Date())
                              : 0;
                            
                            return (
                              <div key={recipient.id} className="p-3 rounded-lg border space-y-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-sm">{recipient.scholarship?.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {getScholarshipTypeBadge(recipient.scholarship)}
                                      {getScholarshipStatusBadge(recipient.status)}
                                    </div>
                                  </div>
                                  {recipient.status === "active" && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => setRevokeRecipient(recipient)}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(recipient.starts_at), "d MMM yy", { locale: es })} - {format(new Date(recipient.expires_at), "d MMM yy", { locale: es })}
                                  </div>
                                  {recipient.status === "active" && daysRemaining > 0 && (
                                    <span className="text-accent font-medium">
                                      {daysRemaining} días restantes
                                    </span>
                                  )}
                                </div>
                                
                                {recipient.notes && (
                                  <p className="text-xs text-muted-foreground italic">
                                    "{recipient.notes}"
                                  </p>
                                )}
                                
                                {recipient.status === "revoked" && recipient.revoked_reason && (
                                  <p className="text-xs text-destructive">
                                    Motivo: {recipient.revoked_reason}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
 
               {/* Gamification Tab */}
               <TabsContent value="gamification" className="space-y-4">
                 {/* Points & Level */}
                 <Card>
                   <CardHeader className="py-3">
                     <CardTitle className="text-base flex items-center gap-2">
                       <Trophy className="h-4 w-4" />
                       Nivel y Puntos
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <div className="text-center mb-4">
                       <div className="text-4xl font-bold text-primary">
                         Nivel {points?.current_level || 1}
                       </div>
                       <div className="text-sm text-muted-foreground">
                         {LEVEL_NAMES[(points?.current_level || 1) - 1]}
                       </div>
                     </div>
                     <div className="space-y-2">
                       <div className="flex justify-between text-sm">
                         <span>{points?.total_points || 0} pts</span>
                         <span>{nextLevelPoints} pts</span>
                       </div>
                       <Progress value={progressToNextLevel} />
                       <p className="text-xs text-center text-muted-foreground">
                         {nextLevelPoints - (points?.total_points || 0)} puntos para el siguiente nivel
                       </p>
                     </div>
                   </CardContent>
                 </Card>
 
                 {/* Badges */}
                 <Card>
                   <CardHeader className="flex flex-row items-center justify-between py-3">
                     <CardTitle className="text-base flex items-center gap-2">
                       <Award className="h-4 w-4" />
                       Insignias ({badges?.length || 0})
                     </CardTitle>
                     <Dialog open={assignBadgeOpen} onOpenChange={setAssignBadgeOpen}>
                       <DialogTrigger asChild>
                         <Button size="sm" variant="outline" disabled={availableBadgesToAssign.length === 0}>
                           <Plus className="h-4 w-4 mr-1" />
                           Asignar
                         </Button>
                       </DialogTrigger>
                       <DialogContent>
                         <DialogHeader>
                           <DialogTitle>Asignar Insignia</DialogTitle>
                         </DialogHeader>
                         <div className="space-y-4 py-4">
                           <Select value={selectedBadge} onValueChange={setSelectedBadge}>
                             <SelectTrigger>
                               <SelectValue placeholder="Seleccionar insignia..." />
                             </SelectTrigger>
                             <SelectContent>
                               {availableBadgesToAssign.map(badge => (
                                 <SelectItem key={badge.id} value={badge.id}>
                                   {badge.name} (+{badge.points_value} pts)
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                           {selectedBadge && (
                             <p className="text-sm text-muted-foreground">
                               {availableBadges?.find(b => b.id === selectedBadge)?.description}
                             </p>
                           )}
                         </div>
                         <DialogFooter>
                           <Button variant="outline" onClick={() => setAssignBadgeOpen(false)}>
                             Cancelar
                           </Button>
                           <Button onClick={handleAssignBadge} disabled={!selectedBadge}>
                             Asignar Insignia
                           </Button>
                         </DialogFooter>
                       </DialogContent>
                     </Dialog>
                   </CardHeader>
                   <CardContent>
                     {loadingBadges ? (
                       <div className="flex justify-center py-4">
                         <Loader2 className="h-6 w-6 animate-spin" />
                       </div>
                     ) : badges?.length === 0 ? (
                       <p className="text-sm text-muted-foreground text-center py-4">
                         No tiene insignias todavía
                       </p>
                     ) : (
                       <div className="space-y-2">
                         {badges?.map(userBadge => (
                           <div key={userBadge.id} className="flex items-center justify-between p-3 rounded-lg border">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                 <Award className="h-5 w-5 text-primary" />
                               </div>
                               <div>
                                 <p className="font-medium text-sm">{userBadge.badge?.name}</p>
                                 <p className="text-xs text-muted-foreground">
                                   +{userBadge.badge?.points_value} pts • {format(new Date(userBadge.earned_at), "PP", { locale: es })}
                                 </p>
                               </div>
                             </div>
                             <Button 
                               variant="ghost" 
                               size="icon"
                               className="text-destructive hover:text-destructive"
                               onClick={() => removeBadge({ userBadgeId: userBadge.id, userId: userId! })}
                             >
                               <X className="h-4 w-4" />
                             </Button>
                           </div>
                         ))}
                       </div>
                     )}
                   </CardContent>
                 </Card>
               </TabsContent>
             </Tabs>
            </>
          )}

          {/* Assign Scholarship Dialog */}
          {userId && user && (
            <AssignScholarshipDialog
              open={assignScholarshipOpen}
              onOpenChange={setAssignScholarshipOpen}
              userId={userId}
              userName={`${user.first_name} ${user.last_name}`}
            />
          )}

          {/* Revoke Scholarship Dialog */}
          <AlertDialog open={!!revokeRecipient} onOpenChange={() => setRevokeRecipient(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Revocar beca?</AlertDialogTitle>
                <AlertDialogDescription>
                  El estudiante perderá los beneficios de esta beca. Por favor ingresa el motivo:
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                placeholder="Motivo de la revocación..."
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setRevokeReason("")}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    if (revokeRecipient && revokeReason) {
                      await revokeScholarship.mutateAsync({
                        recipientId: revokeRecipient.id,
                        reason: revokeReason,
                      });
                      setRevokeRecipient(null);
                      setRevokeReason("");
                    }
                  }}
                  disabled={!revokeReason.trim()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Revocar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SheetContent>
      </Sheet>
    );
  }