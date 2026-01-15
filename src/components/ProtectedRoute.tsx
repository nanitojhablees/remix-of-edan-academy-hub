import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireActiveMembership?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireActiveMembership = false 
}: ProtectedRouteProps) {
  const { user, profile, role, loading } = useAuth();
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

  // Check if user account is suspended (admins bypass this check)
  if (profile?.membership_status === "suspended" && role !== "admin") {
    return <Navigate to="/account-suspended" replace />;
  }

  // Check membership status for payment flow
  if (requireActiveMembership && profile?.membership_status !== "active") {
    return <Navigate to="/payment" replace />;
  }

  return <>{children}</>;
}