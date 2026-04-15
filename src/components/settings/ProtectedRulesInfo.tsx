import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRulesInfo() {
  return (
    <Card className="border-dashed border-muted-foreground/25">
      <CardContent className="pt-4 pb-4">
        <div className="flex gap-3">
          <ShieldAlert className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Regras protegidas pelo sistema
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Algumas regras do Canal Parceiro permanecem protegidas por segurança e integridade operacional.
              Elas não podem ser alteradas pela interface de configuração. Exemplos incluem:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
              <li>Fluxo estrutural de validação de documentos e cadastros bancários</li>
              <li>Regras de transição de status de compromissos</li>
              <li>Lógica contextual profunda de criação e atribuição de tarefas</li>
              <li>Motor de notificações (canais, templates e agrupamento)</li>
              <li>Permissões estruturais de acesso ao sistema</li>
            </ul>
            <p className="text-[11px] text-muted-foreground/70 italic">
              Essas regras poderão ser gradualmente configuráveis em fases futuras, sempre com proteções adequadas.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
