import { useState, useMemo, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
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
import { CalendarIcon, Star, AlertTriangle } from 'lucide-react';
import { format, addBusinessDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePartners } from '@/hooks/usePartners';
import { useVisits } from '@/hooks/useVisits';
import { useAuth } from '@/contexts/AuthContext';
import { useRegistrations } from '@/hooks/useRegistrations';
import { mockUsers, Partner, Visit, VisitComment } from '@/data/mock-data';
import { toast } from 'sonner';

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

  // Selected partner
  const selectedPartner = useMemo(
    () => (partnerId ? partners.find(p => p.id === partnerId) : undefined),
    [partnerId, partners],
  );

  // Registrations filtered by partner
  const filteredRegistrations = useMemo(() => {
    if (!partnerId) return registrations;
    return registrations.filter(r => r.partnerId === partnerId);
  }, [partnerId, registrations]);

  // Visits filtered by partner
  const filteredVisits = useMemo(() => {
    if (!partnerId) return visits.slice(0, 30);
    return visits.filter(v => v.partnerId === partnerId);
  }, [partnerId, visits]);

  // Auto-suggest responsible based on context
  useEffect(() => {
    if (!open) return;
    if (selectedPartner) {
      setResponsibleId(selectedPartner.responsibleUserId);
    } else if (user) {
      setResponsibleId(user.id);
    }
  }, [selectedPartner, user, open]);

  // When registration is selected, lock deadline to 5 business days
  useEffect(() => {
    if (registrationId) {
      const autoDeadline = addBusinessDays(new Date(), 5);
      setDeadline(autoDeadline);
      setDeadlineLocked(true);
    } else {
      setDeadlineLocked(false);
    }
  }, [registrationId]);

  // Reset dependent fields when partner changes
  useEffect(() => {
    setRegistrationId('');
    setVisitId('');
  }, [partnerId]);

  // Reset form
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

    // Find or create a visit to attach the task to
    const targetPartnerId = partnerId || partners[0]?.id || 'p1';
    let targetVisitId = visitId;

    if (!targetVisitId) {
      // Find the most recent visit for this partner
      const partnerVisits = visits
        .filter(v => v.partnerId === targetPartnerId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      targetVisitId = partnerVisits[0]?.id || visits[0]?.id;
    }

    if (!targetVisitId) {
      toast.error('Não foi possível criar a tarefa. Nenhum compromisso encontrado.');
      return;
    }

    const newTask: VisitComment = {
      id: `manual-${Date.now()}`,
      userId: responsibleId || user?.id || 'u1',
      text: title.trim(),
      type: 'task',
      taskCompleted: false,
      taskCategory: registrationId ? 'document' : 'general',
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova tarefa</DialogTitle>
          <DialogDescription>Crie uma tarefa manual com os campos essenciais.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ── Group 1: Core ── */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-title" className="text-xs font-semibold">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                id="task-title"
                placeholder="Ex: Enviar contrato atualizado"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="h-10"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-desc" className="text-xs font-semibold">Descrição</Label>
              <Textarea
                id="task-desc"
                placeholder="Detalhe adicional sobre a tarefa (opcional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="min-h-[60px] resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tipo da tarefa</Label>
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
          </div>

          {/* ── Group 2: Context ── */}
          <div className="space-y-3 border-t pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vínculo</p>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Parceiro</Label>
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
              <Label className="text-xs font-semibold">Cadastro</Label>
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
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  Prazo automático de 5 dias úteis aplicado
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Compromisso</Label>
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
                  {filteredVisits.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {new Date(v.date).toLocaleDateString('pt-BR')} — {v.type === 'visita' ? 'Visita' : 'Prospecção'} ({v.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Group 3: Assignment ── */}
          <div className="space-y-3 border-t pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Responsabilidade</p>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Responsável principal</Label>
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
                  Sugerido pelo parceiro: {activeUsers.find(u => u.id === selectedPartner.responsibleUserId)?.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Atribuídos</Label>
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
                          : 'hover:bg-accent',
                      )}
                      onClick={() => toggleAssigned(u.id)}
                    >
                      {u.name}
                    </Badge>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Clique para selecionar ou remover atribuídos
              </p>
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Prazo</Label>
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
                  Prazo definido automaticamente (5 dias úteis — regra de cadastro)
                </p>
              )}
            </div>

            {/* Priority */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Star className={cn('h-4 w-4', isPriority ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground')} />
                <Label className="text-xs font-semibold cursor-pointer" htmlFor="priority-switch">
                  Marcar como prioritária
                </Label>
              </div>
              <Switch
                id="priority-switch"
                checked={isPriority}
                onCheckedChange={setIsPriority}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs">
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!canSubmit} className="text-xs gap-1.5">
            Criar tarefa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
