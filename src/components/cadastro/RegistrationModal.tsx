import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Registration, statusColors } from '@/data/registrations';
import AuditTimeline from '@/components/shared/AuditTimeline';
import { mockUsers } from '@/data/mock-data';
import { usePartners } from '@/hooks/usePartners';
import { useSystemData } from '@/hooks/useSystemData';
import { useUserAvatars } from '@/hooks/useUserAvatars';
import { useRegistrations } from '@/hooks/useRegistrations';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration?: Registration | null;
  canEdit?: boolean;
  canChangeStatus?: boolean;
  canEditObservation?: boolean;
}

export default function RegistrationModal({ open, onOpenChange, registration, canEdit = true, canChangeStatus = true, canEditObservation = true }: Props) {
  const { partners } = usePartners();
  const { getActiveItems } = useSystemData();
  const { getAvatar } = useUserAvatars();
  const { addRegistration, updateRegistration } = useRegistrations();
  const { addLog, getLogsForEntity } = useAuditLog();
  const { toast } = useToast();

  const isEdit = !!registration;

  const [partnerId, setPartnerId] = useState('');
  const [bank, setBank] = useState('');
  const [status, setStatus] = useState('Não iniciado');
  const [solicitation, setSolicitation] = useState('');
  const [handlingWith, setHandlingWith] = useState('');
  const [observation, setObservation] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    if (registration) {
      setPartnerId(registration.partnerId);
      setBank(registration.bank);
      setStatus(registration.status);
      setSolicitation(registration.solicitation);
      setHandlingWith(registration.handlingWith);
      setObservation(registration.observation);
      setCode(registration.code);
    } else {
      setPartnerId('');
      setBank('');
      setStatus('Não iniciado');
      setSolicitation('');
      setHandlingWith('');
      setObservation('');
      setCode('');
    }
  }, [registration, open]);

  const selectedPartner = partners.find(p => p.id === partnerId);
  const commercial = selectedPartner ? mockUsers.find(u => u.id === selectedPartner.responsibleUserId) : null;

  const banks = infoBanks.map(b => b.name);
  const statuses = getActiveItems('registrationStatuses');
  const solicitations = getActiveItems('registrationSolicitations');
  const handlers = getActiveItems('registrationHandlers');

  const handleSave = () => {
    if (!partnerId || !bank || !solicitation || !handlingWith) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha Parceiro, Banco, Solicitação e Tratando com.', variant: 'destructive' });
      return;
    }

    if (isEdit && registration) {
      // Track field changes for audit
      const changes: Array<{ field: string; old: string; new: string }> = [];
      if (status !== registration.status) changes.push({ field: 'Status', old: registration.status, new: status });
      if (observation !== registration.observation) changes.push({ field: 'Observação', old: registration.observation || '(vazio)', new: observation });
      if (bank !== registration.bank) changes.push({ field: 'Banco', old: registration.bank, new: bank });
      if (handlingWith !== registration.handlingWith) changes.push({ field: 'Tratando com', old: registration.handlingWith, new: handlingWith });
      if (code !== registration.code) changes.push({ field: 'Código', old: registration.code || '(vazio)', new: code });

      updateRegistration(registration.id, {
        partnerId, bank,
        cnpj: selectedPartner?.cnpj || '',
        commercialUserId: selectedPartner?.responsibleUserId || '',
        status, solicitation, handlingWith, observation, code,
      });

      changes.forEach(c => {
        addLog({
          module: 'Cadastro',
          action: c.field === 'Status' ? 'status_change' : 'edit',
          entityId: registration.id,
          entityLabel: `Cadastro - ${bank}`,
          field: c.field,
          oldValue: c.old,
          newValue: c.new,
          description: `${c.field === 'Status' ? 'Alterou status' : 'Editou ' + c.field.toLowerCase()} de "${c.old}" para "${c.new}"`,
        });
      });

      toast({ title: 'Cadastro atualizado' });
    } else {
      const newReg = addRegistration({
        partnerId, bank,
        cnpj: selectedPartner?.cnpj || '',
        commercialUserId: selectedPartner?.responsibleUserId || '',
        status, solicitation, handlingWith, observation, code,
        contractConfirmed: false,
      });
      addLog({
        module: 'Cadastro',
        action: 'create',
        entityId: newReg.id,
        entityLabel: `Cadastro - ${bank}`,
        description: `Criou cadastro para ${selectedPartner?.name || 'parceiro'} com banco ${bank}`,
      });
      toast({ title: 'Cadastro criado com sucesso' });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Cadastro' : 'Novo Cadastro'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Atualize os dados do credenciamento.' : 'Preencha os dados para iniciar o credenciamento.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Parceiro */}
          <div className="space-y-1.5">
            <Label>Parceiro *</Label>
            <Select value={partnerId} onValueChange={setPartnerId} disabled={isEdit && !canEdit}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {partners.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Auto-filled: CNPJ + Comercial */}
          {selectedPartner && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">CNPJ</Label>
                <Input value={selectedPartner.cnpj} readOnly className="bg-muted/50 text-xs h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">Comercial</Label>
                <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/50">
                  {commercial && (
                    <>
                      <Avatar className="h-5 w-5">
                        {getAvatar(commercial.id) && <AvatarImage src={getAvatar(commercial.id)} />}
                        <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                          {commercial.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs truncate">{commercial.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Banco */}
          <div className="space-y-1.5">
            <Label>Banco *</Label>
            <Select value={bank} onValueChange={setBank} disabled={isEdit && !canEdit}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {banks.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Solicitação + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Solicitação *</Label>
              <Select value={solicitation} onValueChange={setSolicitation} disabled={isEdit && !canEdit}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {solicitations.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus} disabled={!canChangeStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statuses.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tratando com */}
          <div className="space-y-1.5">
            <Label>Tratando com *</Label>
            <Select value={handlingWith} onValueChange={setHandlingWith} disabled={!canChangeStatus}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {handlers.map(h => (
                  <SelectItem key={h} value={h}>{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Código */}
          <div className="space-y-1.5">
            <Label>Código</Label>
            <Input value={code} onChange={e => setCode(e.target.value)} placeholder="Código no banco" className="h-9" disabled={isEdit && !canEdit} />
          </div>

          {/* Observação */}
          <div className="space-y-1.5">
            <Label>Observação</Label>
            <Textarea value={observation} onChange={e => setObservation(e.target.value)} placeholder="Descreva o andamento..." rows={3} disabled={!canEditObservation} />
          </div>

          {/* Info fields (edit only) */}
          {isEdit && registration && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Solicitado em</span>
                <span>{format(new Date(registration.requestedAt), "dd/MM/yyyy", { locale: ptBR })}</span>
              </div>
              {registration.completedAt && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Concluído em</span>
                  <span>{format(new Date(registration.completedAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
              )}
              {(() => {
                const entityLogs = getLogsForEntity(registration.id);
                return entityLogs.length > 0 ? (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-xs font-medium">Trilha de Auditoria</span>
                    <div className="max-h-40 overflow-y-auto">
                      <AuditTimeline logs={entityLogs} />
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>{isEdit ? 'Salvar' : 'Criar Cadastro'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
