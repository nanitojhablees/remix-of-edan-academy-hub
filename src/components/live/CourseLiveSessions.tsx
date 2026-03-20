import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCourseLiveSessions, LiveSession } from "@/hooks/useLiveSessions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radio, Calendar, ExternalLink, Clock, CheckCircle2 } from "lucide-react";
import { format, isPast, isFuture, differenceInSeconds } from "date-fns";
import { es } from "date-fns/locale";

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState(differenceInSeconds(targetDate, new Date()));

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = differenceInSeconds(targetDate, new Date());
      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
      } else {
        setTimeLeft(diff);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-2 text-sm font-mono">
      {days > 0 && (
        <span className="bg-muted px-2 py-1 rounded text-sm">{days}d</span>
      )}
      <span className="bg-muted px-2 py-1 rounded">{pad(hours)}</span>
      <span className="text-muted-foreground">:</span>
      <span className="bg-muted px-2 py-1 rounded">{pad(minutes)}</span>
      <span className="text-muted-foreground">:</span>
      <span className="bg-muted px-2 py-1 rounded">{pad(seconds)}</span>
    </div>
  );
}

function LiveSessionCard({ session, courseId }: { session: LiveSession; courseId: string }) {
  const navigate = useNavigate();
  const sessionDate = new Date(session.start_time);
  const isLive = isPast(sessionDate);
  // Consider "live" window = starts in the past but within 3 hours
  const endWindow = new Date(sessionDate.getTime() + 3 * 60 * 60 * 1000);
  const isCurrentlyLive = isPast(sessionDate) && isFuture(endWindow);
  const isOver = isPast(endWindow);
  const isUpcoming = isFuture(sessionDate);

  const handleJoinLive = () => {
    navigate(`/dashboard/courses/${courseId}/live/${session.id}`);
  };

  return (
    <Card className={`border shadow-sm transition-all ${isCurrentlyLive ? "border-red-500/50 bg-red-500/5 shadow-red-500/10" : isOver ? "opacity-60 bg-muted/30" : "border-primary/20 bg-primary/5"}`}>
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className={`p-3 rounded-full flex-shrink-0 ${isCurrentlyLive ? "bg-red-500/10" : "bg-primary/10"}`}>
          <Radio className={`h-5 w-5 ${isCurrentlyLive ? "text-red-500 animate-pulse" : "text-primary"}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4 className="font-semibold truncate">{session.title}</h4>
            {isCurrentlyLive && (
              <Badge className="bg-red-500 hover:bg-red-500 text-white text-xs animate-pulse">EN VIVO</Badge>
            )}
            {isOver && (
              <Badge variant="outline" className="text-xs text-muted-foreground">Finalizada</Badge>
            )}
          </div>
          {session.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{session.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(sessionDate, "PPP 'a las' p", { locale: es })}
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          {isUpcoming && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1 justify-end">
                <Clock className="h-3 w-3" /> Inicia en:
              </p>
              <CountdownTimer targetDate={sessionDate} />
            </div>
          )}

          {isCurrentlyLive && (
            <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white gap-2" onClick={handleJoinLive}>
              <ExternalLink className="h-4 w-4" />
              Entrar a Sala
            </Button>
          )}

          {isOver && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Sesión finalizada
            </div>
          )}

          {isUpcoming && (
            <Button size="sm" variant="outline" className="gap-2" asChild>
              <a href={session.meeting_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Ver Enlace
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CourseLiveSessions({ courseId }: { courseId: string }) {
  const { data: sessions, isLoading } = useCourseLiveSessions(courseId);

  if (isLoading) return null;
  if (!sessions || sessions.length === 0) return null;

  // Sort: live now first, then upcoming, then past
  const sorted = [...sessions].sort((a, b) => {
    const aDate = new Date(a.start_time);
    const bDate = new Date(b.start_time);
    const aIsLive = isPast(aDate) && isFuture(new Date(aDate.getTime() + 3 * 60 * 60 * 1000));
    const bIsLive = isPast(bDate) && isFuture(new Date(bDate.getTime() + 3 * 60 * 60 * 1000));
    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;
    return aDate.getTime() - bDate.getTime();
  });

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-2">
        <Radio className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Clases en Vivo</h3>
        <Badge variant="secondary">{sessions.length}</Badge>
      </div>
      <div className="space-y-3">
        {sorted.map((session) => (
          <LiveSessionCard key={session.id} session={session} courseId={courseId} />
        ))}
      </div>
    </div>
  );
}
