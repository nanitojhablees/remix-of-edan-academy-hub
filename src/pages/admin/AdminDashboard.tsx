import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, GraduationCap, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [users, courses, enrollments] = await Promise.all([
        supabase.from("profiles").select("id, membership_status", { count: "exact" }),
        supabase.from("courses").select("id, is_published", { count: "exact" }),
        supabase.from("enrollments").select("id", { count: "exact" }),
      ]);

      const activeUsers = users.data?.filter(u => u.membership_status === "active").length || 0;
      const publishedCourses = courses.data?.filter(c => c.is_published).length || 0;

      return {
        totalUsers: users.count || 0,
        activeUsers,
        totalCourses: courses.count || 0,
        publishedCourses,
        totalEnrollments: enrollments.count || 0,
      };
    },
  });

  const { data: enrollmentsByLevel } = useQuery({
    queryKey: ["enrollments-by-level"],
    queryFn: async () => {
      const { data } = await supabase
        .from("enrollments")
        .select("course:courses(level)");

      const levelCounts: Record<string, number> = {
        básico: 0,
        tecnologias: 0,
        decisiones: 0,
        analisis: 0,
      };

      data?.forEach((e: any) => {
        if (e.course?.level) {
          levelCounts[e.course.level]++;
        }
      });

      return [
        { name: "Operaciones", value: levelCounts.operaciones, color: "hsl(var(--primary))" },
        { name: "Tecnologías", value: levelCounts.tecnologias, color: "hsl(var(--secondary))" },
        { name: "Decisiones", value: levelCounts.decisiones, color: "hsl(var(--accent))" },
        { name: "Análisis", value: levelCounts.analisis, color: "hsl(var(--edan-orange))" },
      ];
    },
  });

  const { data: recentEnrollments } = useQuery({
    queryKey: ["recent-enrollments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("enrollments")
        .select(`
          id,
          enrolled_at,
          profile:profiles!enrollments_user_id_fkey(first_name, last_name),
          course:courses(title)
        `)
        .order("enrolled_at", { ascending: false })
        .limit(5);

      return data;
    },
  });

  const statCards = [
    { title: "Total Usuarios", value: stats?.totalUsers || 0, subtext: `${stats?.activeUsers || 0} activos`, icon: Users, color: "text-primary" },
    { title: "Cursos", value: stats?.totalCourses || 0, subtext: `${stats?.publishedCourses || 0} publicados`, icon: BookOpen, color: "text-secondary" },
    { title: "Inscripciones", value: stats?.totalEnrollments || 0, subtext: "Total", icon: GraduationCap, color: "text-accent" },
    { title: "Tasa Activación", value: stats?.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) + "%" : "0%", subtext: "Usuarios activos", icon: TrendingUp, color: "text-edan-orange" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground">
          Resumen general del sistema EDAN LMS
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Inscripciones por Nivel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={enrollmentsByLevel || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {enrollmentsByLevel?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inscripciones Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEnrollments?.map((enrollment: any) => (
                <div key={enrollment.id} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium">
                      {enrollment.profile?.first_name} {enrollment.profile?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{enrollment.course?.title}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(enrollment.enrolled_at).toLocaleDateString()}
                  </span>
                </div>
              )) || (
                <p className="text-muted-foreground text-sm">No hay inscripciones recientes</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
