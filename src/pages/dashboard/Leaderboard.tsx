import { useLeaderboard } from "@/hooks/useAnalytics";
import { useUserPoints, getLevelInfo } from "@/hooks/useGamification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const rankIcons = [Trophy, Medal, Award];
const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useLeaderboard(20);
  const { data: userPoints } = useUserPoints();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Find current user's rank
  const userRank = leaderboard?.findIndex((entry: { user_id: string }) => entry.user_id === user?.id);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Tabla de Posiciones</h1>
        <p className="text-muted-foreground">
          Compite con otros estudiantes y sube en el ranking
        </p>
      </div>

      {/* User's current position */}
      {userPoints && userRank !== undefined && userRank >= 0 && (
        <Card className="mb-8 border-primary bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-primary">#{userRank + 1}</div>
              <div className="flex-1">
                <p className="font-medium">Tu Posición Actual</p>
                <p className="text-sm text-muted-foreground">
                  {userPoints.total_points} puntos · Nivel {userPoints.current_level} ({getLevelInfo(userPoints.current_level).title})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Top Estudiantes</CardTitle>
          <CardDescription>Los mejores estudiantes de EDAN</CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboard && leaderboard.length > 0 ? (
            <div className="space-y-4">
              {leaderboard.map((entry: { 
                user_id: string; 
                total_points: number; 
                current_level: number;
                profile?: { first_name: string; last_name: string; avatar_url: string | null };
              }, index: number) => {
                const isCurrentUser = entry.user_id === user?.id;
                const RankIcon = rankIcons[index] || null;
                const rankColor = rankColors[index] || "text-muted-foreground";
                const levelInfo = getLevelInfo(entry.current_level);

                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                      isCurrentUser ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="w-10 text-center">
                      {RankIcon ? (
                        <RankIcon className={`h-6 w-6 mx-auto ${rankColor}`} />
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    
                    <Avatar>
                      <AvatarImage src={entry.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {entry.profile?.first_name?.[0] || "?"}{entry.profile?.last_name?.[0] || ""}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {entry.profile?.first_name || "Usuario"} {entry.profile?.last_name || ""}
                        {isCurrentUser && <span className="text-primary ml-2">(Tú)</span>}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Nivel {entry.current_level} · {levelInfo.title}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-lg">{entry.total_points.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">puntos</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aún no hay datos en la tabla de posiciones
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
