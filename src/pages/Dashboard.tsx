import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Routes, Route } from "react-router-dom";
import DashboardHome from "./dashboard/DashboardHome";
import MyCourses from "./dashboard/MyCourses";
import CourseCatalog from "./dashboard/CourseCatalog";
import CourseView from "./dashboard/CourseView";
import Profile from "./dashboard/Profile";
import AdminDashboard from "./admin/AdminDashboard";
import UsersManagement from "./admin/UsersManagement";
import CoursesManagement from "./admin/CoursesManagement";
import AdminSettings from "./admin/AdminSettings";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { role } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            {/* Student Routes */}
            <Route index element={role === "admin" ? <AdminDashboard /> : <DashboardHome />} />
            <Route path="my-courses" element={<MyCourses />} />
            <Route path="catalog" element={<CourseCatalog />} />
            <Route path="course/:courseId" element={<CourseView />} />
            <Route path="profile" element={<Profile />} />
            
            {/* Admin Routes (accessed via /admin/*) */}
            <Route path="users" element={<UsersManagement />} />
            <Route path="courses" element={<CoursesManagement />} />
            <Route path="settings" element={<AdminSettings />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
}
