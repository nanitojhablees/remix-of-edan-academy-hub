import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useEffect } from "react";
import { Loader2, Package, HardDrive, Cpu, Zap } from "lucide-react";

// Import pages directly (no lazy loading)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Payment from "./pages/Payment";
import Dashboard from "./pages/Dashboard";
import AccountSuspended from "./pages/AccountSuspended";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const EnhancedPageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 animate-ping" />
        </div>
        <div className="relative">
          <Zap className="h-16 w-16 text-primary animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Cargando aplicación</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Optimizando tu experiencia educativa...
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
          <Package className="h-3 w-3" />
          <span>Cargando módulos</span>
          <HardDrive className="h-3 w-3" />
          <span>Recursos</span>
          <Cpu className="h-3 w-3" />
          <span>Procesando</span>
        </div>
      </div>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/payment" 
              element={
                <ProtectedRoute>
                  <Payment />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/*" 
              element={
                <ProtectedRoute requireActiveMembership>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/account-suspended" element={<AccountSuspended />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
