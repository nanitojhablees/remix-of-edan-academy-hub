import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "instructor" | "estudiante";

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  country: string | null;
  profession: string | null;
  phone: string | null;
  membership_status: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    metadata: {
      first_name: string;
      last_name: string;
      country?: string;
      profession?: string;
      phone?: string;
    }
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  activateMembership: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Prevent duplicate fetches
  const fetchingRef = useRef(false);
  const lastFetchedUserId = useRef<string | null>(null);

  const fetchProfileAndRole = useCallback(async (userId: string) => {
    // Skip if already fetching or already fetched for this user
    if (fetchingRef.current || lastFetchedUserId.current === userId) {
      return;
    }
    
    fetchingRef.current = true;
    
    try {
      // Fetch profile and role in parallel
      const [profileResult, roleResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle()
      ]);

      if (profileResult.error) throw profileResult.error;
      if (roleResult.error) throw roleResult.error;
      
      setProfile(profileResult.data);
      setRole(roleResult.data?.role as AppRole ?? "estudiante");
      lastFetchedUserId.current = userId;
    } catch (error) {
      console.error("Error fetching profile/role:", error);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfileAndRole(session.user.id);
      } else {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Reset last fetched if user changed
          if (lastFetchedUserId.current !== session.user.id) {
            lastFetchedUserId.current = null;
          }
          await fetchProfileAndRole(session.user.id);
        } else {
          setProfile(null);
          setRole(null);
          lastFetchedUserId.current = null;
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfileAndRole]);

  const signUp = async (
    email: string,
    password: string,
    metadata: {
      first_name: string;
      last_name: string;
      country?: string;
      profession?: string;
      phone?: string;
    }
  ) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata,
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  const activateMembership = async () => {
    if (!user) return { error: new Error("No user logged in") };

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ membership_status: "active" })
        .eq("user_id", user.id);

      if (error) throw error;

      // Refresh profile
      await fetchProfileAndRole(user.id);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        signUp,
        signIn,
        signOut,
        activateMembership,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}