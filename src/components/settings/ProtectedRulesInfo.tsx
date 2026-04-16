import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert, Lock } from 'lucide-react';
import ConfigurabilityBadge from './ConfigurabilityBadge';

export default function ProtectedRulesInfo() {
  return (
    <Card className="border-dashed border-muted-foreground/25">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base text-muted-foreground">Regras Protegidas pelo Sistema</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Regras estruturais que não podem ser alteradas pela interface de configuração.
              </CardDescription>
            </div>
          </div>
          <ConfigurabilityBadge level="protected" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="text-xs text-muted-foreground space-y-1.5 list-none">
          <ProtectedItem text="Fluxo de validação de documentos e cadastros bancários" />
          <ProtectedItem text="Transições de status de compromissos da Agenda" />
          <ProtectedItem text="Justificativas obrigatórias para cancelamento e reagendamento" />
          <ProtectedItem text="Lógica de criação e atribuição contextual de tarefas" />
          <ProtectedItem text="Motor de notificações: canais, templates e agrupamento" />
          <ProtectedItem text="Permissões estruturais de acesso ao sistema" />
          <ProtectedItem text="Caixa rápida de tarefas: mostra apenas tarefas próprias do usuário (responsável principal ou atribuído) e não herda visões globais de perfil" />
        </ul>
        <p className="text-[11px] text-muted-foreground/60 italic mt-3">
          Regras protegidas poderão ser gradualmente abertas em fases futuras, com proteções adequadas.
        </p>
      </CardContent>
    </Card>
  );
}

function ProtectedItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2">
      <Lock className="h-3 w-3 text-destructive/60 shrink-0" />
      <span>{text}</span>
    </li>
  );
}
