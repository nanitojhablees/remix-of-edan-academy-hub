import { useAllBadges, useUserBadges, useCheckBadges, usePointsHistory } from "@/hooks/useGamification";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy, Star, Zap, Award, Target, Flame, Moon, Sunrise,
  Footprints, BookOpen, GraduationCap, UserCheck, Lock, RefreshCw,
  MessageSquare, ClipboardCheck, History
} from "lucide-react";
import { useEffect } from "react";
import { AchievementsSkeleton } from "@/components/skeletons/AchievementsSkeleton";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  award: Award, trophy: Trophy, star: Star, zap: Zap, target: Target,
  flame: Flame, moon: Moon, sunrise: Sunrise, footprints: Footprints,
  "book-open": BookOpen, "graduation-cap": GraduationCap, "user-check": UserCheck,
  "message-square": MessageSquare, "clipboard-check": ClipboardCheck,
};

function BadgeIcon({ icon }: { icon: string }) {
  const IconComponent = iconMap[icon];
  if (IconComponent) return <IconComponent className="h-6 w-6" />;
  // Emoji fallback
  return <span className="text-2xl leading-none">{icon}</span>;
}

const categoryLabels: Record<string, string> = {
  progress: "Progreso de Curso",
  achievement: "Logros Generales",
  profile: "Perfil",
  streak: "Rachas de Estudio",
  special: "Especiales",
  community: "Comunidad y Foros",
  assignments: "Tareas y Proyectos",
  quizzes: "Mini-Quizzes",
  points: "Acumulación de Puntos",
};

export default function Achievements() {
  const { data: allBadges, isLoading: loadingAll } = useAllBadges();
  const { data: userBadges, isLoading: loadingUser } = useUserBadges();
  const { data: pointsHistory } = usePointsHistory();
  const checkBadges = useCheckBadges();

  useEffect(() => { checkBadges.mutate(); }, []);

  if (loadingAll || loadingUser) return <AchievementsSkeleton />;

  const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);

  const badgesByCategory = allBadges?.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, typeof allBadges>) || {};

  const totalEarned = userBadges?.length || 0;
  const totalBadges = allBadges?.length || 0;
  const totalPoints = userBadges?.reduce((sum, ub) => sum + ub.badge.points_value, 0) || 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logros e Insignias</h1>
          <p className="text-muted-foreground mt-1">Desbloquea insignias completando cursos y actividades</p>
        </div>
        <Button variant="outline" onClick={() => checkBadges.mutate()} disabled={checkBadges.isPending}>
          <RefreshCw className={`h-4 w-4 mr-2 ${checkBadges.isPending ? 'animate-spin' : ''}`} />
          Verificar Logros
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10"><Trophy className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold">{totalEarned}/{totalBadges}</p>
              <p className="text-sm text-muted-foreground">Insignias Obtenidas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-amber-500/10"><Star className="h-6 w-6 text-amber-500" /></div>
            <div>
              <p className="text-2xl font-bold">{totalPoints}</p>
              <p className="text-sm text-muted-foreground">Puntos por Insignias</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-secondary/50"><Target className="h-6 w-6 text-secondary-foreground" /></div>
            <div>
              <p className="text-2xl font-bold">
                {totalBadges > 0 ? Math.round((totalEarned / totalBadges) * 100) : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Completado</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges by category */}
      {Object.entries(badgesByCategory).map(([category, badges]) => (
        <div key={category}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            {categoryLabels[category] || category}
            <Badge variant="secondary" className="text-xs">
              {badges?.filter(b => earnedBadgeIds.has(b.id)).length}/{badges?.length}
            </Badge>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {badges?.map((badge) => {
              const isEarned = earnedBadgeIds.has(badge.id);
              const earnedBadge = userBadges?.find(ub => ub.badge_id === badge.id);
              return (
                <Card
                  key={badge.id}
                  className={`transition-all ${isEarned ? "border-primary/50 bg-primary/5 shadow-sm" : "opacity-60 grayscale"}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full flex-shrink-0 ${isEarned ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {isEarned ? <BadgeIcon icon={badge.icon} /> : <Lock className="h-6 w-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{badge.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{badge.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">+{badge.points_value} pts</Badge>
                          {isEarned && earnedBadge && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(earnedBadge.earned_at).toLocaleDateString('es')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Points history */}
      {pointsHistory && pointsHistory.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Puntos Recientes
          </h2>
          <Card>
            <CardContent className="p-0 divide-y">
              {pointsHistory.slice(0, 10).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{entry.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                  <Badge variant={entry.points > 0 ? "default" : "destructive"} className="shrink-0 ml-4">
                    {entry.points > 0 ? "+" : ""}{entry.points} pts
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
