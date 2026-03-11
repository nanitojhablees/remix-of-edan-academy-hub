import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Routes, Route, Navigate } from "react-router-dom";
import { StudentPreviewProvider } from "@/hooks/useStudentPreview";
import DashboardHome from "./dashboard/DashboardHome";
import MyCourses from "./dashboard/MyCourses";
import CourseCatalog from "./dashboard/CourseCatalog";
import CourseView from "./dashboard/CourseView";
import Profile from "./dashboard/Profile";
import Achievements from "./dashboard/Achievements";
import Leaderboard from "./dashboard/Leaderboard";
import Certificates from "./dashboard/Certificates";
import PaymentHistory from "./dashboard/PaymentHistory";
import RenewMembership from "./dashboard/RenewMembership";
import ExamView from "./dashboard/ExamView";
import AdminDashboard from "./admin/AdminDashboard";
import UsersManagement from "./admin/UsersManagement";
import CoursesManagement from "./admin/CoursesManagement";
import AdminSettings from "./admin/AdminSettings";
import AdvancedAnalytics from "./admin/AdvancedAnalytics";
import ExamsManagement from "./admin/ExamsManagement";
import CertificatesManagement from "./admin/CertificatesManagement";
import BadgesManagement from "./admin/BadgesManagement";
import EnrollmentsManagement from "./admin/EnrollmentsManagement";
import NotificationsManagement from "./admin/NotificationsManagement";
import PaymentsManagement from "./admin/PaymentsManagement";
import ScholarshipsManagement from "./admin/ScholarshipsManagement";
import EnrollmentRequestsManagement from "./admin/EnrollmentRequestsManagement";
import InstructorDashboard from "./instructor/InstructorDashboard";
import InstructorCourses from "./instructor/InstructorCourses";
import InstructorStudents from "./instructor/InstructorStudents";
import InstructorCourseEditor from "./instructor/InstructorCourseEditor";
import InstructorExams from "./instructor/InstructorExams";
import InstructorExamEditor from "./instructor/InstructorExamEditor";
import { useAuth } from "@/hooks/useAuth";
import { useStudentPreview } from "@/hooks/useStudentPreview";
import { PageTransition } from "@/components/PageTransition";

type AppRole = "admin" | "instructor" | "estudiante";

// Role-based route protection component
function RoleRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles: AppRole[] 
}) {
  const { role } = useAuth();
  
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function DashboardRoutes() {
  const { role } = useAuth();
  const { isStudentPreview } = useStudentPreview();

  const getHomeComponent = () => {
    if (isStudentPreview) return <DashboardHome />;
    switch (role) {
      case "admin":
        return <AdminDashboard />;
      case "instructor":
        return <InstructorDashboard />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <Routes>
      {/* Common Routes */}
      <Route index element={getHomeComponent()} />
      <Route path="profile" element={<Profile />} />
      
      {/* Student Routes (all authenticated users can access) */}
      <Route path="my-courses" element={<MyCourses />} />
      <Route path="catalog" element={<CourseCatalog />} />
      <Route path="course/:courseId" element={<CourseView />} />
      <Route path="achievements" element={<Achievements />} />
      <Route path="leaderboard" element={<Leaderboard />} />
      <Route path="certificates" element={<Certificates />} />
      <Route path="payment-history" element={<PaymentHistory />} />
      <Route path="renew" element={<RenewMembership />} />
      <Route path="exam/:examId" element={<ExamView />} />
      
      {/* Instructor Routes */}
      <Route path="instructor-courses" element={
        <RoleRoute allowedRoles={["instructor", "admin"]}>
          <InstructorCourses />
        </RoleRoute>
      } />
      <Route path="instructor-students" element={
        <RoleRoute allowedRoles={["instructor", "admin"]}>
          <InstructorStudents />
        </RoleRoute>
      } />
      <Route path="instructor-exams" element={
        <RoleRoute allowedRoles={["instructor", "admin"]}>
          <InstructorExams />
        </RoleRoute>
      } />
      <Route path="course-editor/:courseId" element={
        <RoleRoute allowedRoles={["instructor", "admin"]}>
          <InstructorCourseEditor />
        </RoleRoute>
      } />
      <Route path="exam-editor/:examId" element={
        <RoleRoute allowedRoles={["instructor", "admin"]}>
          <InstructorExamEditor />
        </RoleRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="admin-users" element={
        <RoleRoute allowedRoles={["admin"]}>
          <UsersManagement />
        </RoleRoute>
      } />
      <Route path="admin-courses" element={
        <RoleRoute allowedRoles={["admin"]}>
          <CoursesManagement />
        </RoleRoute>
      } />
      <Route path="admin-settings" element={
        <RoleRoute allowedRoles={["admin"]}>
          <AdminSettings />
        </RoleRoute>
      } />
      <Route path="admin-analytics" element={
        <RoleRoute allowedRoles={["admin"]}>
          <AdvancedAnalytics />
        </RoleRoute>
      } />
      <Route path="admin-exams" element={
        <RoleRoute allowedRoles={["admin"]}>
          <ExamsManagement />
        </RoleRoute>
      } />
      <Route path="admin-certificates" element={
        <RoleRoute allowedRoles={["admin"]}>
          <CertificatesManagement />
        </RoleRoute>
      } />
      <Route path="admin-badges" element={
        <RoleRoute allowedRoles={["admin"]}>
          <BadgesManagement />
        </RoleRoute>
      } />
      <Route path="admin-enrollments" element={
        <RoleRoute allowedRoles={["admin"]}>
          <EnrollmentsManagement />
        </RoleRoute>
      } />
      <Route path="admin-enrollment-requests" element={
        <RoleRoute allowedRoles={["admin"]}>
          <EnrollmentRequestsManagement />
        </RoleRoute>
      } />
      <Route path="admin-notifications" element={
        <RoleRoute allowedRoles={["admin"]}>
          <NotificationsManagement />
        </RoleRoute>
      } />
      <Route path="admin-payments" element={
        <RoleRoute allowedRoles={["admin"]}>
          <PaymentsManagement />
        </RoleRoute>
      } />
      <Route path="admin-scholarships" element={
        <RoleRoute allowedRoles={["admin"]}>
          <ScholarshipsManagement />
        </RoleRoute>
      } />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function Dashboard() {
  return (
    <PageTransition>
      <StudentPreviewProvider>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <main className="flex-1 p-6 overflow-auto">
              <DashboardRoutes />
            </main>
          </div>
        </SidebarProvider>
      </StudentPreviewProvider>
    </PageTransition>
  );
}
