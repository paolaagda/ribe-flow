import { useState, useMemo, useEffect } from 'react';
import {
  Dialog, DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  CalendarIcon, Star, AlertTriangle, ListChecks, Link2, Users, ClipboardList,
  Handshake, UserPlus,
} from 'lucide-react';
import { format, addBusinessDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePartners } from '@/hooks/usePartners';
import { useVisits } from '@/hooks/useVisits';
import { useAuth } from '@/contexts/AuthContext';
import { useRegistrations } from '@/hooks/useRegistrations';
import { mockUsers, Partner, Visit, VisitComment } from '@/data/mock-data';
import { toast } from 'sonner';
import { ModalHeaderShell, ModalFooterShell, SectionHeader, ToneBlock } from '@/components/shared';

const TASK_TYPES = [
  'Pendência documental',
  'Pendência operacional',
  'Acompanhamento comercial',
  'Ação de cadastro',
  'Cobrança de retorno',
  'Visita de follow-up',
  'Outro',
];

interface TaskCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TaskCreateModal({ open, onOpenChange }: TaskCreateModalProps) {
  const { partners } = usePartners();
  const { visits, setVisits } = useVisits();
  const { user } = useAuth();
  const { registrations } = useRegistrations();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [registrationId, setRegistrationId] = useState('');
  const [visitId, setVisitId] = useState('');
  const [responsibleId, setResponsibleId] = useState('');
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [isPriority, setIsPriority] = useState(false);
  const [deadlineLocked, setDeadlineLocked] = useState(false);

  const activeUsers = useMemo(() => mockUsers.filter(u => u.active), []);

  const selectedPartner = useMemo(
    () => (partnerId ? partners.find(p => p.id === partnerId) : undefined),
    [partnerId, partners],
  );

  const filteredRegistrations = useMemo(() => {
    if (!partnerId) return registrations;
    return registrations.filter(r => r.partnerId === partnerId);
  }, [partnerId, registrations]);

  const filteredVisits = useMemo(() => {
    if (!partnerId) return visits.slice(0, 30);
    return visits.filter(v => v.partnerId === partnerId);
  }, [partnerId, visits]);

  useEffect(() => {
    if (!open) return;
    if (selectedPartner) {
      setResponsibleId(selectedPartner.responsibleUserId);
    } else if (user) {
      setResponsibleId(user.id);
    }
  }, [selectedPartner, user, open]);

  useEffect(() => {
    if (registrationId) {
      const autoDeadline = addBusinessDays(new Date(), 5);
      setDeadline(autoDeadline);
      setDeadlineLocked(true);
    } else {
      setDeadlineLocked(false);
    }
  }, [registrationId]);

  useEffect(() => {
    setRegistrationId('');
    setVisitId('');
  }, [partnerId]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTaskType('');
    setPartnerId('');
    setRegistrationId('');
    setVisitId('');
    setResponsibleId(user?.id || '');
    setAssignedIds([]);
    setDeadline(undefined);
    setIsPriority(false);
    setDeadlineLocked(false);
  };

  useEffect(() => {
    if (open) resetForm();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSubmit = title.trim().length > 0;

  const handleCreate = () => {
    if (!canSubmit) return;

    const targetPartnerId = partnerId || partners[0]?.id || 'p1';
    let targetVisitId = visitId;

    if (!targetVisitId) {
      const partnerVisits = visits
        .filter(v => v.partnerId === targetPartnerId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      targetVisitId = partnerVisits[0]?.id || visits[0]?.id;
    }

    if (!targetVisitId) {
      toast.error('Não foi possível criar a tarefa. Nenhum compromisso encontrado.');
      return;
    }

    const isDocOrData = registrationId && registrationId !== 'none';
    const autoCategory: 'document' | 'data' | 'general' = isDocOrData ? 'document' : 'general';
    const isAutoPrio = autoCategory === 'document';
    const effectivePriority = isPriority || isAutoPrio;

    const historyEvents: any[] = [
      { id: `evt-${Date.now()}`, type: 'created', label: 'Tarefa criada manualmente', date: new Date().toISOString(), userId: user?.id },
    ];
    if (effectivePriority) {
      historyEvents.push({
        id: `evt-${Date.now()}-p`,
        type: isAutoPrio ? 'priority_auto' : 'created',
        label: isAutoPrio ? 'Prioridade automática: pendência documental' : 'Marcada como prioritária',
        date: new Date().toISOString(),
      });
    }

    const principalId = responsibleId || user?.id || 'u1';
    const cleanAssignees = assignedIds.filter(id => id && id !== principalId);

    if (cleanAssignees.length > 0) {
      const names = cleanAssignees
        .map(id => mockUsers.find(u => u.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      historyEvents.push({
        id: `evt-${Date.now()}-a`,
        type: 'assigned',
        label: `Atribuída a: ${names}`,
        date: new Date().toISOString(),
        userId: user?.id,
      });
    }

    const newTask: VisitComment = {
      id: `manual-${Date.now()}`,
      userId: principalId,
      text: title.trim(),
      type: 'task',
      taskCompleted: false,
      taskCategory: autoCategory as any,
      taskPriority: effectivePriority,
      taskAssignedUserIds: cleanAssignees.length > 0 ? cleanAssignees : undefined,
      taskHistory: historyEvents,
      createdAt: new Date().toISOString(),
    };

    setVisits(prev => prev.map(v => {
      if (v.id !== targetVisitId) return v;
      return { ...v, comments: [...v.comments, newTask] };
    }));

    toast.success('Tarefa criada com sucesso');
    onOpenChange(false);
  };

  const toggleAssigned = (uid: string) => {
    setAssignedIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] p-0 gap-0 overflow-hidden">
        {/* ── Branded header with lateral bar ── */}
        <div className="relative">
          <div
            className="absolute left-0 top-0 bottom-0 w-1.5"
            style={{
              background: 'linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.6) 100%)',
            }}
          />
          <DialogHeader className="px-5 py-4 pl-6 space-y-2.5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                <ListChecks className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Nova tarefa
                </p>
                <DialogTitle className="text-base font-semibold leading-snug">
                  Criar tarefa manual
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Defina identificação, vínculo e responsabilidade.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto max-h-[calc(92vh-180px)] px-5 py-4 space-y-5">
          {/* ── Identificação ── */}
          <section className="space-y-3">
            <SectionHeader icon={ClipboardList} label="Identificação" />

            <div className="space-y-1.5">
              <Label htmlFor="task-title" className="text-xs font-medium text-foreground">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                id="task-title"
                placeholder="Ex: Enviar contrato atualizado"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="h-9 text-sm"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-desc" className="text-xs font-medium text-foreground">
                Descrição
              </Label>
              <Textarea
                id="task-desc"
                placeholder="Detalhe adicional sobre a tarefa (opcional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="min-h-[64px] text-sm resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Tipo da tarefa</Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* ── Vínculo ── */}
          <section className="space-y-3">
            <SectionHeader icon={Link2} label="Vínculo" />

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Parceiro</Label>
              <Select value={partnerId} onValueChange={setPartnerId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Nenhum (tarefa avulsa)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {partners.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Cadastro</Label>
              <Select
                value={registrationId}
                onValueChange={setRegistrationId}
                disabled={!partnerId || partnerId === 'none'}
              >
                <SelectTrigger className={cn('h-9 text-xs', (!partnerId || partnerId === 'none') && 'opacity-50')}>
                  <SelectValue placeholder={partnerId && partnerId !== 'none' ? 'Selecione cadastro' : 'Selecione parceiro primeiro'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {filteredRegistrations.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.bank} — {r.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {registrationId && registrationId !== 'none' && (
                <div className="relative overflow-hidden rounded-md border border-warning/30 bg-warning/10 pl-3 pr-3 py-2">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning" />
                  <p className="text-[11px] text-foreground flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3 text-warning shrink-0" />
                    Prazo automático de 5 dias úteis aplicado pela regra de Cadastro
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Compromisso</Label>
              <Select
                value={visitId}
                onValueChange={setVisitId}
                disabled={!partnerId || partnerId === 'none'}
              >
                <SelectTrigger className={cn('h-9 text-xs', (!partnerId || partnerId === 'none') && 'opacity-50')}>
                  <SelectValue placeholder={partnerId && partnerId !== 'none' ? 'Selecione compromisso' : 'Selecione parceiro primeiro'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {filteredVisits.map(v => {
                    const isVisita = v.type === 'visita';
                    const TypeIcon = isVisita ? Handshake : UserPlus;
                    return (
                      <SelectItem key={v.id} value={v.id}>
                        <span className="inline-flex items-center gap-1.5">
                          <TypeIcon className={cn('h-3 w-3', isVisita ? 'text-info' : 'text-warning')} />
                          {new Date(v.date).toLocaleDateString('pt-BR')} — {isVisita ? 'Visita' : 'Prospecção'} ({v.status})
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* ── Responsabilidade ── */}
          <section className="space-y-3">
            <SectionHeader icon={Users} label="Responsabilidade" />

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Responsável principal</Label>
              <Select value={responsibleId} onValueChange={setResponsibleId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {activeUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPartner && (
                <p className="text-[10px] text-muted-foreground">
                  Sugerido pelo Parceiro: {activeUsers.find(u => u.id === selectedPartner.responsibleUserId)?.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Atribuídos</Label>
              <div className="rounded-md border border-border/60 bg-muted/20 p-2.5">
                {activeUsers.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic">Nenhum usuário disponível.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {activeUsers.map(u => {
                      const selected = assignedIds.includes(u.id);
                      return (
                        <Badge
                          key={u.id}
                          variant={selected ? 'default' : 'outline'}
                          className={cn(
                            'cursor-pointer text-[10px] transition-colors',
                            selected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background hover:bg-accent',
                          )}
                          onClick={() => toggleAssigned(u.id)}
                        >
                          {u.name}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Clique para selecionar ou remover atribuídos
              </p>
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Prazo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={deadlineLocked}
                    className={cn(
                      'w-full h-9 justify-start text-left text-xs font-normal',
                      !deadline && 'text-muted-foreground',
                      deadlineLocked && 'opacity-70',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {deadline
                      ? format(deadline, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : 'Sem prazo definido'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {deadlineLocked && (
                <p className="text-[10px] text-muted-foreground">
                  Prazo definido automaticamente (5 dias úteis — regra de Cadastro)
                </p>
              )}
            </div>

            {/* Priority */}
            <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/20 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Star className={cn('h-4 w-4', isPriority ? 'text-warning fill-warning' : 'text-muted-foreground')} />
                <Label className="text-xs font-medium cursor-pointer text-foreground" htmlFor="priority-switch">
                  Marcar como prioritária
                </Label>
              </div>
              <Switch
                id="priority-switch"
                checked={isPriority}
                onCheckedChange={setIsPriority}
              />
            </div>
          </section>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 px-5 py-3 border-t border-border/60 bg-muted/20">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Cancelar
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={!canSubmit} className="text-xs gap-1.5">
            <ListChecks className="h-3.5 w-3.5" />
            Criar tarefa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
