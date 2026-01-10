import { useAllBadges, useUserBadges } from "@/hooks/useGamification";
import { useCheckBadges } from "@/hooks/useGamification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Zap, Award, Target, Flame, Moon, Sunrise, Footprints, BookOpen, GraduationCap, UserCheck, Lock, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { AchievementsSkeleton } from "@/components/skeletons/AchievementsSkeleton";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  award: Award,
  trophy: Trophy,
  star: Star,
  zap: Zap,
  target: Target,
  flame: Flame,
  moon: Moon,
  sunrise: Sunrise,
  footprints: Footprints,
  "book-open": BookOpen,
  "graduation-cap": GraduationCap,
  "user-check": UserCheck,
};

const categoryLabels: Record<string, string> = {
  progress: "Progreso",
  achievement: "Logros",
  profile: "Perfil",
  streak: "Rachas",
  special: "Especiales",
};

export default function Achievements() {
  const { data: allBadges, isLoading: loadingAll } = useAllBadges();
  const { data: userBadges, isLoading: loadingUser } = useUserBadges();
  const checkBadges = useCheckBadges();

  // Check for new badges on mount
  useEffect(() => {
    checkBadges.mutate();
  }, []);

  if (loadingAll || loadingUser) {
    return <AchievementsSkeleton />;
  }

  const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);
  
  // Group badges by category
  const badgesByCategory = allBadges?.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, typeof allBadges>) || {};

  const totalEarned = userBadges?.length || 0;
  const totalBadges = allBadges?.length || 0;
  const totalPoints = userBadges?.reduce((sum, ub) => sum + ub.badge.points_value, 0) || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Logros e Insignias</h1>
          <p className="text-muted-foreground">
            Desbloquea insignias completando cursos y actividades
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => checkBadges.mutate()}
          disabled={checkBadges.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${checkBadges.isPending ? 'animate-spin' : ''}`} />
          Verificar Logros
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEarned}/{totalBadges}</p>
                <p className="text-sm text-muted-foreground">Insignias Obtenidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-accent/10">
                <Star className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPoints}</p>
                <p className="text-sm text-muted-foreground">Puntos por Insignias</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-secondary/50">
                <Target className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round((totalEarned / totalBadges) * 100)}%</p>
                <p className="text-sm text-muted-foreground">Completado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges by category */}
      {Object.entries(badgesByCategory).map(([category, badges]) => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{categoryLabels[category] || category}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {badges?.map((badge) => {
              const isEarned = earnedBadgeIds.has(badge.id);
              const IconComponent = iconMap[badge.icon] || Award;
              const earnedBadge = userBadges?.find(ub => ub.badge_id === badge.id);
              
              return (
                <Card 
                  key={badge.id} 
                  className={`transition-all ${
                    isEarned 
                      ? "border-primary/50 bg-primary/5" 
                      : "opacity-60 grayscale"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full ${
                        isEarned 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {isEarned ? (
                          <IconComponent className="h-6 w-6" />
                        ) : (
                          <Lock className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{badge.name}</h3>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            +{badge.points_value} pts
                          </Badge>
                          {isEarned && earnedBadge && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(earnedBadge.earned_at).toLocaleDateString()}
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
    </div>
  );
}
