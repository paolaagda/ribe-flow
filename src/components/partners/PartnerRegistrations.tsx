import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRegistrations } from '@/hooks/useRegistrations';
import { Registration, statusColors } from '@/data/registrations';
import { getUserById } from '@/data/mock-data';
import { FileText, Landmark, Clock, User, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  partnerId: string;
  onOpenRegistration?: (reg: Registration) => void;
}

export default function PartnerRegistrations({ partnerId, onOpenRegistration }: Props) {
  const { registrations } = useRegistrations();
  const partnerRegs = registrations.filter(r => r.partnerId === partnerId);

  if (partnerRegs.length === 0) return null;

  const activeRegs = partnerRegs.filter(r => !['Concluído', 'Cancelado'].includes(r.status));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Cadastros / Credenciamentos ({partnerRegs.length})
          {activeRegs.length > 0 && (
            <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px] gap-1" variant="outline">
              <AlertCircle className="h-3 w-3" />
              {activeRegs.length} em andamento
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {partnerRegs.map(reg => {
          const commercial = getUserById(reg.commercialUserId);
          const lastUpdate = reg.updates.length > 0 ? reg.updates[reg.updates.length - 1] : null;
          return (
            <div
              key={reg.id}
              onClick={() => onOpenRegistration?.(reg)}
              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Landmark className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{reg.bank}</span>
                  <Badge variant="outline" className={cn('text-[10px]', statusColors[reg.status])}>{reg.status}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{reg.solicitation}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{reg.handlingWith}</span>
                  {commercial && <span>• {commercial.name}</span>}
                </div>
                {reg.observation && (
                  <p className="text-xs text-muted-foreground truncate">{reg.observation}</p>
                )}
                {lastUpdate && (
                  <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    Última atualização: {format(parseISO(lastUpdate.date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
