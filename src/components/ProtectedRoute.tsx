import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

type AppRole = "admin" | "instructor" | "estudiante";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  requireActiveMembership?: boolean;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  requireActiveMembership = false 
}: ProtectedRouteProps) {
  const { user, role, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check membership status for payment flow
  if (requireActiveMembership && profile?.membership_status !== "active") {
    return <Navigate to="/payment" replace />;
  }

  // Check role-based access
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on role
    const dashboardMap: Record<AppRole, string> = {
      admin: "/admin",
      instructor: "/instructor",
      estudiante: "/dashboard",
    };
    return <Navigate to={dashboardMap[role]} replace />;
  }

  return <>{children}</>;
}