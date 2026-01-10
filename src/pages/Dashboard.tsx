import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Routes, Route } from "react-router-dom";
import DashboardHome from "./dashboard/DashboardHome";
import MyCourses from "./dashboard/MyCourses";
import CourseCatalog from "./dashboard/CourseCatalog";
import CourseView from "./dashboard/CourseView";
import Profile from "./dashboard/Profile";
import Achievements from "./dashboard/Achievements";
import Leaderboard from "./dashboard/Leaderboard";
import Certificates from "./dashboard/Certificates";
import PaymentHistory from "./dashboard/PaymentHistory";
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
import InstructorDashboard from "./instructor/InstructorDashboard";
import InstructorCourses from "./instructor/InstructorCourses";
import InstructorStudents from "./instructor/InstructorStudents";
import InstructorCourseEditor from "./instructor/InstructorCourseEditor";
import InstructorExams from "./instructor/InstructorExams";
import InstructorExamEditor from "./instructor/InstructorExamEditor";
import { useAuth } from "@/hooks/useAuth";
import { PageTransition } from "@/components/PageTransition";

export default function Dashboard() {
  const { role } = useAuth();

  const getHomeComponent = () => {
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
    <PageTransition>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              {/* Common Routes */}
              <Route index element={getHomeComponent()} />
              <Route path="profile" element={<Profile />} />
              
              {/* Student Routes */}
              <Route path="my-courses" element={<MyCourses />} />
              <Route path="catalog" element={<CourseCatalog />} />
              <Route path="course/:courseId" element={<CourseView />} />
              <Route path="achievements" element={<Achievements />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="certificates" element={<Certificates />} />
              <Route path="payment-history" element={<PaymentHistory />} />
              
              {/* Instructor Routes */}
              <Route path="instructor-courses" element={<InstructorCourses />} />
              <Route path="instructor-students" element={<InstructorStudents />} />
              <Route path="instructor-exams" element={<InstructorExams />} />
              <Route path="course-editor/:courseId" element={<InstructorCourseEditor />} />
              <Route path="exam-editor/:examId" element={<InstructorExamEditor />} />
              <Route path="exam/:examId" element={<ExamView />} />
              
              {/* Admin Routes */}
              <Route path="admin-users" element={<UsersManagement />} />
              <Route path="admin-courses" element={<CoursesManagement />} />
              <Route path="admin-settings" element={<AdminSettings />} />
              <Route path="admin-analytics" element={<AdvancedAnalytics />} />
              <Route path="admin-exams" element={<ExamsManagement />} />
              <Route path="admin-certificates" element={<CertificatesManagement />} />
              <Route path="admin-badges" element={<BadgesManagement />} />
              <Route path="admin-enrollments" element={<EnrollmentsManagement />} />
              <Route path="admin-notifications" element={<NotificationsManagement />} />
              <Route path="admin-payments" element={<PaymentsManagement />} />
            </Routes>
          </main>
        </div>
      </SidebarProvider>
    </PageTransition>
  );
}
