import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Crown } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  cargo: string;
}

interface VisitParticipantsProps {
  participants: Participant[];
  /** Compact mode uses 3.5 circles (month/week), full uses 6-size avatars (day) */
  variant?: "compact" | "full";
  maxVisible?: number;
  rankingLeaderId?: string | null;
}

export default function VisitParticipants({
  participants,
  variant = "compact",
  maxVisible = 2,
  rankingLeaderId,
}: VisitParticipantsProps) {
  if (participants.length === 0) return null;

  if (variant === "full") {
    return (
      <TooltipProvider delayDuration={200}>
        <div className="flex -space-x-1.5 shrink-0">
          {participants.slice(0, maxVisible).map((p) => (
            <Tooltip key={p.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  {p.id === rankingLeaderId && (
                    <Crown className="h-3 w-3 text-yellow-500 fill-yellow-500 absolute -top-2 left-1/2 -translate-x-1/2 z-10" />
                  )}
                  <Avatar className="h-6 w-6 border-2 border-background">
                    <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">{p.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">{p.name} • {p.cargo}</TooltipContent>
            </Tooltip>
          ))}
          {participants.length > maxVisible && (
            <Avatar className="h-6 w-6 border-2 border-background">
              <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">+{participants.length - maxVisible}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex -space-x-1 shrink-0">
        {participants.slice(0, maxVisible).map((p) => (
          <Tooltip key={p.id}>
            <TooltipTrigger asChild>
              <div className="h-3.5 w-3.5 rounded-full bg-muted border border-background flex items-center justify-center text-[7px] font-medium text-muted-foreground">
                {p.name.charAt(0)}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">{p.name} • {p.cargo}</TooltipContent>
          </Tooltip>
        ))}
        {participants.length > maxVisible && (
          <div className="h-3.5 w-3.5 rounded-full bg-muted border border-background flex items-center justify-center text-[7px] font-medium text-muted-foreground">
            +{participants.length - maxVisible}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
