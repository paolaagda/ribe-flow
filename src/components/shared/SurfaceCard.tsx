import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { IconTile } from './IconTile';
import type { Tone } from './tone';

export interface SurfaceCardProps {
  icon?: LucideIcon;
  iconTone?: Tone;
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  /** Aplica fundo tonal sutil ao header */
  tonedHeader?: boolean;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
}

/**
 * SurfaceCard — card oficial do Canal Parceiro com hierarquia padronizada.
 *
 * Padrão consolidado nas páginas refatoradas (Parceiros, Cadastro detalhe, Configurações):
 * - borda border-border/60
 * - shadow-sm
 * - header opcional com fundo tonal bg-muted/30 + tile pequeno
 */
export function SurfaceCard({
  icon,
  iconTone = 'muted',
  title,
  description,
  actions,
  children,
  tonedHeader = true,
  className,
  contentClassName,
  headerClassName,
}: SurfaceCardProps) {
  const hasHeader = !!(title || description || actions || icon);
  return (
    <Card className={cn('border-border/60 shadow-sm overflow-hidden', className)}>
      {hasHeader && (
        <CardHeader
          className={cn(
            'flex flex-row items-center gap-3 space-y-0 py-3 px-4',
            tonedHeader && 'bg-muted/30 border-b border-border/60',
            headerClassName,
          )}
        >
          {icon && <IconTile icon={icon} tone={iconTone} size="sm" />}
          <div className="flex-1 min-w-0">
            {title && (
              <div className="text-sm font-semibold text-foreground leading-snug">{title}</div>
            )}
            {description && (
              <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
                {description}
              </div>
            )}
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </CardHeader>
      )}
      {children !== undefined && (
        <CardContent className={cn('p-4', contentClassName)}>{children}</CardContent>
      )}
    </Card>
  );
}
