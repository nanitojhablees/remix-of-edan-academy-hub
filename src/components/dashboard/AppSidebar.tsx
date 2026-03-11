import { Home, BookOpen, GraduationCap, Users, Settings, LogOut, BarChart3, UserCog, Trophy, Medal, Award, FileQuestion, Bell, CreditCard, Receipt, Search, Compass, ClipboardList } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStudentPreview } from "@/hooks/useStudentPreview";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import logoEdan from "@/assets/logo-edan.png";
import { NotificationBell } from "./NotificationBell";
import { StudentPreviewToggle } from "./StudentPreviewToggle";

const studentMenu = [
  { title: "Inicio", url: "/dashboard", icon: Home },
  { title: "Mis Cursos", url: "/dashboard/my-courses", icon: BookOpen },
  { title: "Explorar Cursos", url: "/dashboard/catalog", icon: Compass },
  { title: "Certificados", url: "/dashboard/certificates", icon: Award },
  { title: "Mis Pagos", url: "/dashboard/payment-history", icon: Receipt },
  { title: "Logros", url: "/dashboard/achievements", icon: Trophy },
  { title: "Ranking", url: "/dashboard/leaderboard", icon: Medal },
  { title: "Perfil", url: "/dashboard/profile", icon: Settings },
];

const instructorMenu = [
  { title: "Inicio", url: "/dashboard", icon: Home },
  { title: "Mis Cursos", url: "/dashboard/instructor-courses", icon: BookOpen },
  { title: "Evaluaciones", url: "/dashboard/instructor-exams", icon: FileQuestion },
  { title: "Estudiantes", url: "/dashboard/instructor-students", icon: Users },
  { title: "Explorar Cursos", url: "/dashboard/catalog", icon: Compass },
  { title: "Perfil", url: "/dashboard/profile", icon: Settings },
];

const adminMenu = [
  { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
  { title: "Usuarios", url: "/dashboard/admin-users", icon: UserCog },
  { title: "Cursos", url: "/dashboard/admin-courses", icon: BookOpen },
  { title: "Mis Cursos (Editor)", url: "/dashboard/instructor-courses", icon: Settings },
  { title: "Evaluaciones (Editor)", url: "/dashboard/instructor-exams", icon: FileQuestion },
  { title: "Estudiantes", url: "/dashboard/instructor-students", icon: Users },
  { title: "Explorar Cursos", url: "/dashboard/catalog", icon: Compass },
  { title: "Inscripciones", url: "/dashboard/admin-enrollments", icon: GraduationCap },
  { title: "Pagos", url: "/dashboard/admin-payments", icon: CreditCard },
  { title: "Becas", url: "/dashboard/admin-scholarships", icon: GraduationCap },
  { title: "Exámenes", url: "/dashboard/admin-exams", icon: FileQuestion },
  { title: "Certificados", url: "/dashboard/admin-certificates", icon: Award },
  { title: "Insignias", url: "/dashboard/admin-badges", icon: Medal },
  { title: "Notificaciones", url: "/dashboard/admin-notifications", icon: Bell },
  { title: "Analytics", url: "/dashboard/admin-analytics", icon: Trophy },
  { title: "Configuración", url: "/dashboard/admin-settings", icon: Settings },
];

export function AppSidebar() {
  const { role, profile, signOut } = useAuth();
  const { isStudentPreview } = useStudentPreview();
  const navigate = useNavigate();
  const location = useLocation();

  // If in student preview mode, show student menu
  const effectiveMenu = isStudentPreview ? studentMenu : (role === "admin" ? adminMenu : role === "instructor" ? instructorMenu : studentMenu);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={logoEdan} alt="EDAN" className="h-8 w-auto" />
          <span className="font-bold text-sm">EDAN LMS</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <NotificationBell />
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Student Preview Toggle */}
        {(role === "admin" || role === "instructor") && (
          <div className="px-4 pt-3">
            <StudentPreviewToggle />
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>
            {isStudentPreview 
              ? "Vista Alumno" 
              : role === "admin" ? "Administración" : role === "instructor" ? "Instructor" : "Estudiante"
            }
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {effectiveMenu.map((item) => (
                <SidebarMenuItem key={item.title + item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.first_name} {profile?.last_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
        </div>
        <SidebarMenuButton onClick={handleLogout} className="w-full justify-start text-destructive hover:text-destructive">
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesión</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
