import type { VisitStatus } from "@/data/mock-data";

/**
 * Cores de "ponto" (status dot) para uso discreto em listas/grades de Agenda.
 * Mantém semântica forte sem repetir texto + fundo preenchido (visual mais limpo).
 * Usar junto com tooltip ou aria-label que contenha o nome do status.
 */
export const statusDotClasses: Record<VisitStatus, string> = {
  Planejada: "bg-info",
  Concluída: "bg-success",
  Reagendada: "bg-warning",
  Cancelada: "bg-destructive",
  Inconclusa: "bg-purple-500",
};
