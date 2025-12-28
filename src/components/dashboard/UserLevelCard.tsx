import { useUserPoints, useUserBadges, getLevelInfo, getProgressToNextLevel, LEVEL_THRESHOLDS } from "@/hooks/useGamification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Zap, Award, Target, Flame, Moon, Sunrise, Footprints, BookOpen, GraduationCap, UserCheck } from "lucide-react";

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

export function UserLevelCard() {
  const { data: userPoints, isLoading: loadingPoints } = useUserPoints();
  const { data: userBadges, isLoading: loadingBadges } = useUserBadges();

  if (loadingPoints || loadingBadges) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const points = userPoints?.total_points || 0;
  const level = userPoints?.current_level || 1;
  const levelInfo = getLevelInfo(level);
  const nextLevelInfo = getLevelInfo(level + 1);
  const progress = getProgressToNextLevel(points, level);

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-primary to-primary/70 p-4 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Tu Nivel</p>
            <h3 className="text-2xl font-bold">{levelInfo.title}</h3>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{level}</div>
            <p className="text-sm opacity-90">Nivel</p>
          </div>
        </div>
      </div>
      <CardContent className="p-4 space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>{points} puntos</span>
            {level < 10 && (
              <span className="text-muted-foreground">
                {nextLevelInfo.minPoints - points} para nivel {level + 1}
              </span>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        {userBadges && userBadges.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Insignias recientes</p>
            <div className="flex flex-wrap gap-2">
              {userBadges.slice(0, 4).map((ub) => {
                const IconComponent = iconMap[ub.badge.icon] || Award;
                return (
                  <Badge
                    key={ub.id}
                    variant="secondary"
                    className="flex items-center gap-1 py-1"
                  >
                    <IconComponent className="h-3 w-3" />
                    {ub.badge.name}
                  </Badge>
                );
              })}
              {userBadges.length > 4 && (
                <Badge variant="outline">+{userBadges.length - 4}</Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
