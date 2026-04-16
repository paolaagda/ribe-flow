import { Check, X } from "lucide-react";

interface VisitInviteActionsProps {
  visitId: string;
  onAccept: (visitId: string) => void;
  onReject: (visitId: string) => void;
}

export default function VisitInviteActions({ visitId, onAccept, onReject }: VisitInviteActionsProps) {
  return (
    <span className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        aria-label="Aceitar convite"
        className="h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90"
        onClick={() => onAccept(visitId)}
      >
        <Check className="h-2 w-2" />
      </button>
      <button
        aria-label="Recusar convite"
        className="h-3.5 w-3.5 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground"
        onClick={() => onReject(visitId)}
      >
        <X className="h-2 w-2" />
      </button>
    </span>
  );
}
