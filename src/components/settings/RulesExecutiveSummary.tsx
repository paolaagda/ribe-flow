import { Card, CardContent } from '@/components/ui/card';
import { Info, Settings2, Lock, Unlock, AlertTriangle } from 'lucide-react';

export default function RulesExecutiveSummary() {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-4 px-5">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-2.5">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Centro de Governança do Sistema
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Este módulo controla permissões, visibilidade, regras operacionais e parâmetros de comportamento do Canal Parceiro.
                Alterações aqui impactam diretamente o comportamento real do sistema para todos os usuários.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-success">
                <Unlock className="h-3 w-3" />
                <span>3 blocos configuráveis</span>
              </span>
              <span className="flex items-center gap-1.5 text-warning">
                <Settings2 className="h-3 w-3" />
                <span>4 blocos parcialmente configuráveis</span>
              </span>
              <span className="flex items-center gap-1.5 text-destructive">
                <Lock className="h-3 w-3" />
                <span>Regras estruturais protegidas</span>
              </span>
            </div>

            <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground/80 border-t border-border/50 pt-2">
              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
              <span>
                Prefira alterações conscientes e validadas. Use o Histórico de Alterações ao final da página para acompanhar mudanças. Nem todas as regras são editáveis.
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
