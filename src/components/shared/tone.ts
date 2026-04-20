/**
 * Tons semânticos oficiais do Canal Parceiro.
 * Fonte única de classes utilitárias por tom.
 *
 * - primary     : verde institucional (padrão, ações neutras / sucesso operacional)
 * - info        : azul (Visita, informacional)
 * - warning     : amarelo/âmbar (Prospecção, atenção, performance, campanhas)
 * - destructive : vermelho (cancelamento, erro, ação irreversível)
 * - success     : verde positivo (concluído)
 * - muted       : cinza neutro (administrativo / técnico)
 */
export type Tone = 'primary' | 'info' | 'warning' | 'destructive' | 'success' | 'muted';

export interface ToneClasses {
  bar: string;
  tile: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  softBg: string;
  softBorder: string;
  button: string;
  optionSelected: string;
  optionDot: string;
}

export const toneMap: Record<Tone, ToneClasses> = {
  primary: {
    bar: 'bg-gradient-to-b from-primary/80 via-primary/60 to-primary/30',
    tile: 'bg-primary/10 border-primary/30',
    iconColor: 'text-primary',
    badgeBg: 'bg-primary/10',
    badgeText: 'text-primary',
    badgeBorder: 'border-primary/20',
    softBg: 'bg-primary/5',
    softBorder: 'border-primary/20',
    button: 'bg-primary text-primary-foreground hover:bg-primary/90',
    optionSelected: 'border-primary/50 bg-primary/5 ring-1 ring-primary/30',
    optionDot: 'bg-primary text-primary-foreground',
  },
  info: {
    bar: 'bg-gradient-to-b from-info/80 via-info/60 to-info/30',
    tile: 'bg-info/10 border-info/30',
    iconColor: 'text-info',
    badgeBg: 'bg-info/10',
    badgeText: 'text-info',
    badgeBorder: 'border-info/20',
    softBg: 'bg-info/5',
    softBorder: 'border-info/20',
    button: 'bg-info text-info-foreground hover:bg-info/90',
    optionSelected: 'border-info/50 bg-info/5 ring-1 ring-info/30',
    optionDot: 'bg-info text-info-foreground',
  },
  warning: {
    bar: 'bg-gradient-to-b from-warning/80 via-warning/60 to-warning/30',
    tile: 'bg-warning/10 border-warning/30',
    iconColor: 'text-warning',
    badgeBg: 'bg-warning/10',
    badgeText: 'text-warning',
    badgeBorder: 'border-warning/20',
    softBg: 'bg-warning/5',
    softBorder: 'border-warning/20',
    button: 'bg-warning text-warning-foreground hover:bg-warning/90',
    optionSelected: 'border-warning/50 bg-warning/5 ring-1 ring-warning/30',
    optionDot: 'bg-warning text-warning-foreground',
  },
  destructive: {
    bar: 'bg-gradient-to-b from-destructive/80 via-destructive/60 to-destructive/30',
    tile: 'bg-destructive/10 border-destructive/30',
    iconColor: 'text-destructive',
    badgeBg: 'bg-destructive/10',
    badgeText: 'text-destructive',
    badgeBorder: 'border-destructive/20',
    softBg: 'bg-destructive/5',
    softBorder: 'border-destructive/20',
    button: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    optionSelected: 'border-destructive/50 bg-destructive/5 ring-1 ring-destructive/30',
    optionDot: 'bg-destructive text-destructive-foreground',
  },
  success: {
    bar: 'bg-gradient-to-b from-success/80 via-success/60 to-success/30',
    tile: 'bg-success/10 border-success/30',
    iconColor: 'text-success',
    badgeBg: 'bg-success/10',
    badgeText: 'text-success',
    badgeBorder: 'border-success/20',
    softBg: 'bg-success/5',
    softBorder: 'border-success/20',
    button: 'bg-success text-success-foreground hover:bg-success/90',
    optionSelected: 'border-success/50 bg-success/5 ring-1 ring-success/30',
    optionDot: 'bg-success text-success-foreground',
  },
  muted: {
    bar: 'bg-gradient-to-b from-muted-foreground/40 via-muted-foreground/30 to-muted-foreground/10',
    tile: 'bg-muted border-border',
    iconColor: 'text-muted-foreground',
    badgeBg: 'bg-muted',
    badgeText: 'text-muted-foreground',
    badgeBorder: 'border-border',
    softBg: 'bg-muted/30',
    softBorder: 'border-border/60',
    button: 'bg-muted text-foreground hover:bg-muted/80',
    optionSelected: 'border-border bg-muted/40 ring-1 ring-border',
    optionDot: 'bg-foreground text-background',
  },
};

export function getTone(tone: Tone = 'primary'): ToneClasses {
  return toneMap[tone];
}
