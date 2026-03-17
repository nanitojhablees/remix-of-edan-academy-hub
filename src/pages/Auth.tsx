import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import logoEdan from "@/assets/logo-edan.png";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const registerSchema = z.object({
  first_name: z.string().min(2, "Mínimo 2 caracteres"),
  last_name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  country: z.string().optional(),
  profession: z.string().optional(),
  phone: z.string().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(searchParams.get("mode") === "register");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user, profile, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && profile) {
      if (profile.membership_status !== "active") {
        navigate("/payment");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, profile, navigate]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { first_name: "", last_name: "", email: "", password: "", country: "", profession: "", phone: "" },
  });

  const onLogin = async (data: LoginForm) => {
    setLoading(true);
    const { error } = await signIn(data.email, data.password);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const onRegister = async (data: RegisterForm) => {
    setLoading(true);
    const { error } = await signUp(data.email, data.password, {
      first_name: data.first_name,
      last_name: data.last_name,
      country: data.country,
      profession: data.profession,
      phone: data.phone,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "¡Registro exitoso!", description: "Ahora completa el pago de membresía." });
      
      // Send welcome email (fire and forget - don't block registration flow)
      supabase.functions.invoke("send-welcome-email", {
        body: {
          userEmail: data.email,
          userName: `${data.first_name} ${data.last_name}`,
        },
      }).catch((err) => console.error("Error sending welcome email:", err));
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </Link>

          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="text-center mb-8">
              <img src={logoEdan} alt="EDAN" className="h-16 mx-auto mb-4" />
              <h1 className="text-2xl font-bold">{isRegister ? "Crear Cuenta" : "Iniciar Sesión"}</h1>
              <p className="text-sm text-muted-foreground mt-2">
                {isRegister ? "Únete al programa EDAN Latinoamérica" : "Accede a tu cuenta"}
              </p>
            </div>

            {isRegister ? (
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre *</Label>
                    <Input {...registerForm.register("first_name")} />
                    {registerForm.formState.errors.first_name && (
                      <p className="text-xs text-destructive mt-1">{registerForm.formState.errors.first_name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Apellido *</Label>
                    <Input {...registerForm.register("last_name")} />
                    {registerForm.formState.errors.last_name && (
                      <p className="text-xs text-destructive mt-1">{registerForm.formState.errors.last_name.message}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" {...registerForm.register("email")} />
                  {registerForm.formState.errors.email && (
                    <p className="text-xs text-destructive mt-1">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="relative">
                  <Label>Contraseña *</Label>
                  <Input type={showPassword ? "text" : "password"} {...registerForm.register("password")} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div>
                  <Label>País</Label>
                  <Input {...registerForm.register("country")} placeholder="Ej: Colombia" />
                </div>
                <div>
                  <Label>Profesión</Label>
                  <Input {...registerForm.register("profession")} placeholder="Ej: Bombero, Paramédico" />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input {...registerForm.register("phone")} placeholder="+57 300 123 4567" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear Cuenta
                </Button>
              </form>
            ) : (
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input type="email" {...loginForm.register("email")} />
                  {loginForm.formState.errors.email && (
                    <p className="text-xs text-destructive mt-1">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="relative">
                  <Label>Contraseña</Label>
                  <Input type={showPassword ? "text" : "password"} {...loginForm.register("password")} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Iniciar Sesión
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-muted-foreground mt-6">
              {isRegister ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
              <button onClick={() => setIsRegister(!isRegister)} className="text-primary hover:underline font-medium">
                {isRegister ? "Iniciar Sesión" : "Registrarse"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}