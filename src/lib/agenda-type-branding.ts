import { Handshake, UserPlus, type LucideIcon } from "lucide-react";

/**
 * Fonte única de verdade da identidade visual de Visita e Prospecção.
 * Sempre que o app exibir esses tipos, importar daqui.
 *
 * Visita     → Handshake + cor `info`    (azul)
 * Prospecção → UserPlus  + cor `warning` (amarelo)
 */
export type AgendaType = "visita" | "prospecção";

export interface AgendaTypeBrand {
  label: string;
  icon: LucideIcon;
  /** Token semântico base (sem prefixo). Ex: "info", "warning". */
  colorToken: "info" | "warning";
  /** Classes utilitárias prontas. */
  text: string;        // ex: text-info
  bg: string;          // ex: bg-info
  bgSoft: string;      // ex: bg-info/10
  border: string;      // ex: border-info/20
  badge: string;       // combinação para chips/badges
  /** hsl(var(--token)) — útil para charts/SVG. */
  hsl: string;
}

export const agendaTypeBranding: Record<AgendaType, AgendaTypeBrand> = {
  visita: {
    label: "Visita",
    icon: Handshake,
    colorToken: "info",
    text: "text-info",
    bg: "bg-info",
    bgSoft: "bg-info/10",
    border: "border-info/20",
    badge: "bg-info/10 text-info border-info/20",
    hsl: "hsl(var(--info))",
  },
  "prospecção": {
    label: "Prospecção",
    icon: UserPlus,
    colorToken: "warning",
    text: "text-warning",
    bg: "bg-warning",
    bgSoft: "bg-warning/10",
    border: "border-warning/20",
    badge: "bg-warning/10 text-warning border-warning/20",
    hsl: "hsl(var(--warning))",
  },
};

export function getAgendaTypeBrand(type: string | undefined | null): AgendaTypeBrand {
  return type === "prospecção" ? agendaTypeBranding["prospecção"] : agendaTypeBranding.visita;
}
