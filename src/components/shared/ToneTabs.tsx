import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

/**
 * ToneTabsList / ToneTabsTrigger — versão padronizada de tabs com fundo tonal sutil.
 *
 * Padrão consolidado em Detalhe do Parceiro, Detalhe do Cadastro, Configurações.
 * Continue usando <Tabs> e <TabsContent> originais do shadcn por volta destes.
 */
export function ToneTabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsList>) {
  return (
    <TabsList
      className={cn(
        'bg-muted/40 border border-border/60 p-1 h-auto rounded-lg gap-1',
        className,
      )}
      {...props}
    />
  );
}

export function ToneTabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      className={cn(
        'rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground',
        'data-[state=active]:bg-background data-[state=active]:text-foreground',
        'data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/60',
        'transition-all',
        className,
      )}
      {...props}
    />
  );
}
