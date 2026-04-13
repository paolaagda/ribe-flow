import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useRegistrations } from '@/hooks/useRegistrations';
import { Registration, statusColors } from '@/data/registrations';
import { getUserById } from '@/data/mock-data';
import { useAuth } from '@/contexts/AuthContext';
import DocumentRejectModal from './DocumentRejectModal';
import { FileText, Landmark, Clock, User, AlertCircle, FileCheck, XCircle, RotateCcw, AlertTriangle, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  partnerId: string;
  onOpenRegistration?: (reg: Registration) => void;
}

const validationStatusConfig = {
  pending: { label: 'Pendente', color: 'text-muted-foreground', bgClass: '', borderClass: '' },
  in_validation: { label: 'Em validação', color: 'text-warning', bgClass: 'bg-warning/5', borderClass: 'border-warning/30' },
  validated: { label: 'Validado', color: 'text-success', bgClass: 'bg-success/5', borderClass: 'border-success/30' },
  rejected: { label: 'Devolvido', color: 'text-destructive', bgClass: 'bg-destructive/5', borderClass: 'border-destructive/30' },
};

export default function PartnerRegistrations({ partnerId, onOpenRegistration }: Props) {
  const { registrations, submitRegistrationForValidation, validateRegistration, rejectRegistration, revokeRegistrationValidation } = useRegistrations();
  const { user } = useAuth();
  const partnerRegs = registrations.filter(r => r.partnerId === partnerId);

  const [rejectModal, setRejectModal] = useState<{ open: boolean; regId: string; regName: string; isRevoke: boolean }>({ open: false, regId: '', regName: '', isRevoke: false });

  const isCadastro = user && ['cadastro', 'diretor', 'gerente'].includes(user.role);
  const isComercial = user && user.role === 'comercial';

  if (partnerRegs.length === 0) return null;

  const activeRegs = partnerRegs.filter(r => !['Concluído', 'Cancelado'].includes(r.status));

  const handleRejectConfirm = (reason: string) => {
    if (rejectModal.isRevoke) {
      revokeRegistrationValidation(rejectModal.regId, reason);
    } else {
      rejectRegistration(rejectModal.regId, reason);
    }
  };

  return (
    <>
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
            const vs = reg.validationStatus || 'pending';
            const vsConfig = validationStatusConfig[vs];

            return (
              <div
                key={reg.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                  vsConfig.bgClass,
                  vsConfig.borderClass || 'border-border',
                  onOpenRegistration && 'cursor-pointer hover:bg-muted/30'
                )}
              >
                <div
                  className="flex-1 min-w-0 space-y-1.5"
                  onClick={() => onOpenRegistration?.(reg)}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Landmark className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{reg.bank}</span>
                    <Badge variant="outline" className={cn('text-[10px]', statusColors[reg.status])}>{reg.status}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{reg.solicitation}</Badge>
                    {vs !== 'pending' && (
                      <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0', vsConfig.color, vsConfig.borderClass)}>
                        {vsConfig.label}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{reg.handlingWith}</span>
                    {commercial && <span>• {commercial.name}</span>}
                  </div>
                  {reg.observation && (
                    <p className="text-xs text-muted-foreground truncate">{reg.observation}</p>
                  )}
                  {/* Rejection reason */}
                  {vs === 'rejected' && reg.validationRejectionReason && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                      <span className="text-xs text-destructive font-medium">
                        {reg.validationRejectionReason}
                      </span>
                    </div>
                  )}
                  {lastUpdate && (
                    <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      Última atualização: {format(parseISO(lastUpdate.date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  )}
                </div>

                {/* Comercial: submit for validation */}
                {isComercial && (vs === 'pending' || vs === 'rejected') && !['Concluído', 'Cancelado'].includes(reg.status) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10 shrink-0"
                        onClick={(e) => { e.stopPropagation(); submitRegistrationForValidation(reg.id); }}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Enviar para validação</TooltipContent>
                  </Tooltip>
                )}

                {/* Cadastro: approve/reject for in_validation */}
                {isCadastro && vs === 'in_validation' && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-success hover:text-success hover:bg-success/10"
                          onClick={(e) => { e.stopPropagation(); validateRegistration(reg.id); }}
                        >
                          <FileCheck className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Validar cadastro</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => { e.stopPropagation(); setRejectModal({ open: true, regId: reg.id, regName: `${reg.bank} — ${reg.solicitation}`, isRevoke: false }); }}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Devolver cadastro</TooltipContent>
                    </Tooltip>
                  </div>
                )}

                {/* Cadastro: revoke validated */}
                {isCadastro && vs === 'validated' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={(e) => { e.stopPropagation(); setRejectModal({ open: true, regId: reg.id, regName: `${reg.bank} — ${reg.solicitation}`, isRevoke: true }); }}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Revogar validação</TooltipContent>
                  </Tooltip>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <DocumentRejectModal
        open={rejectModal.open}
        onOpenChange={(open) => setRejectModal(prev => ({ ...prev, open }))}
        docName={rejectModal.regName}
        onConfirm={handleRejectConfirm}
      />
    </>
  );
}
