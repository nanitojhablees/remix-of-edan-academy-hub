import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Search, MessageCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

export default function AdminForums() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const navigate = useNavigate();

  // 1. Fetch all courses that have forum enabled
  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ['admin-courses-forum-enabled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, forum_enabled')
        .eq('forum_enabled', true)
        .order('title');
      
      if (error) throw error;
      return data;
    }
  });

  // 2. Fetch all root forum posts
  const { data: posts, isLoading: loadingPosts } = useQuery({
    queryKey: ['admin-all-forum-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          profiles:user_id (first_name, last_name, avatar_url, role),
          courses:course_id (title)
        `)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Calculate statistics
  const totalPosts = posts?.length || 0;
  const unresolvedPosts = posts?.filter(p => !p.is_resolved).length || 0;
  const resolvedPosts = posts?.filter(p => p.is_resolved).length || 0;

  // Filter posts
  const filteredPosts = posts?.filter(post => {
    const matchesSearch = post.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = filterCourse === "all" || post.course_id === filterCourse;
    
    return matchesSearch && matchesCourse;
  });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'pregunta': return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">Pregunta</Badge>;
      case 'debate': return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">Debate</Badge>;
      case 'anuncio': return <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20">Anuncio</Badge>;
      default: return <Badge variant="secondary">General</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Foros y Comunidad</h1>
        <p className="text-muted-foreground">
          Supervisa la actividad de todos los foros de los cursos en una sola vista.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hilos Activos Totales</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              Posts principales en toda la plataforma
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preguntas sin resolver</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">{unresolvedPosts}</div>
            <p className="text-xs text-muted-foreground">
              Hilos activos esperando respuesta
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dudas resueltas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">{resolvedPosts}</div>
            <p className="text-xs text-muted-foreground">
              Problemas solucionados
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos hilos publicados</CardTitle>
          <CardDescription>Visualiza los posts más recientes de todos los cursos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título o contenido..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Todos los cursos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cursos</SelectItem>
                {courses?.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[600px] rounded-md border p-4">
            {loadingPosts ? (
              <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : filteredPosts && filteredPosts.length > 0 ? (
              <div className="space-y-4">
                {filteredPosts.map((post: any) => (
                  <div key={post.id} className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                    <Avatar className="h-10 w-10 mt-1">
                      <AvatarImage src={post.profiles?.avatar_url || ''} />
                      <AvatarFallback>{post.profiles?.first_name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{post.profiles?.first_name} {post.profiles?.last_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(post.created_at), "d 'de' MMMM, HH:mm", { locale: es })}
                        </span>
                        {getCategoryBadge(post.category)}
                        {post.is_resolved && (
                          <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">Resuelto</Badge>
                        )}
                        {post.is_pinned && (
                          <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50">Anclado</Badge>
                        )}
                      </div>
                      
                      <div className="bg-muted px-2 py-0.5 rounded text-xs w-fit text-muted-foreground font-medium">
                        Curso: {post.courses?.title}
                      </div>

                      <h4 className="text-base font-semibold leading-none">{post.title}</h4>
                      <p className="text-sm text-foreground/80 line-clamp-2">{post.content}</p>
                      
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mb-4 opacity-20" />
                <p>No se encontraron posts en los foros.</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
