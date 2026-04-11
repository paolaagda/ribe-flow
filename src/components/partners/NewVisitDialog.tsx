import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useVisits } from '@/hooks/useVisits';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemData } from '@/hooks/useSystemData';
import { useInfoData } from '@/hooks/useInfoData';
import { useToast } from '@/hooks/use-toast';
import { Partner, Visit, VisitPeriod, VisitComment, mockUsers, allCargos, cargoLabels } from '@/data/mock-data';
import { useNotifications } from '@/hooks/useNotifications';
import { getRandomMessage } from '@/data/notification-messages';
import { formatCurrencyInput, parseCurrencyToNumber, formatCentavos } from '@/lib/currency';
import { useLastVisitPotential } from '@/hooks/useLastVisitPotential';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DollarSign, CalendarPlus } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: Partner;
}

export default function NewVisitDialog({ open, onOpenChange, partner }: Props) {
  const { user } = useAuth();
  const { visits, setVisits } = useVisits();
  const { getActiveItems } = useSystemData();
  const { getActiveBanks } = useInfoData();
  const { addNotification } = useNotifications();
  const { toast } = useToast();

  const infoBankNames = getActiveBanks().map(b => b.name);

  const [formStep, setFormStep] = useState(0);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    period: '' as VisitPeriod | '',
    medio: 'presencial' as 'presencial' | 'remoto',
    structures: partner.structures || [],
    banks: [] as string[],
    products: [] as string[],
    summary: '',
    potentialValue: '',
    invitedUserIds: [] as string[],
  });

  const invitableUsers = mockUsers.filter(u => u.id !== user?.id && u.active);

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '',
      period: '',
      medio: 'presencial',
      structures: partner.structures || [],
      banks: [],
      products: [],
      summary: '',
      potentialValue: '',
      invitedUserIds: [],
    });
    setFormStep(0);
    userEditedPotential.current = false;
  };

  // Auto-suggest potential value from last visit
  const { value: suggestedPotential, sourceDate: suggestedSourceDate } = useLastVisitPotential(partner.id, formData.date);
  const userEditedPotential = useRef(false);

  useEffect(() => {
    if (!userEditedPotential.current && suggestedPotential) {
      setFormData(prev => ({ ...prev, potentialValue: suggestedPotential }));
    }
  }, [suggestedPotential]);

  useEffect(() => {
    userEditedPotential.current = false;
  }, [formData.date]);

  const handleSave = () => {
    if (!formData.period) {
      toast({ title: 'Período obrigatório', description: 'Selecione o período do compromisso.', variant: 'destructive' });
      return;
    }
    if (!formData.date) {
      toast({ title: 'Data obrigatória', description: 'Selecione uma data válida.', variant: 'destructive' });
      return;
    }

    const invitedUsers = formData.invitedUserIds.map(uid => ({ userId: uid, status: 'pending' as const }));

    // Auto-invite partner's responsible if current user is director/manager
    if (user && ['diretor', 'gerente'].includes(user.role)) {
      if (!formData.invitedUserIds.includes(partner.responsibleUserId) && partner.responsibleUserId !== user.id) {
        invitedUsers.push({ userId: partner.responsibleUserId, status: 'pending' });
      }
    }

    const potentialValue = formData.potentialValue ? parseCurrencyToNumber(formData.potentialValue) : undefined;

    const newVisit: Visit = {
      id: `v${Date.now()}`,
      partnerId: partner.id,
      userId: user?.id || '',
      createdBy: user?.id || '',
      invitedUsers,
      date: formData.date,
      time: formData.time,
      period: formData.period as VisitPeriod,
      type: 'visita',
      medio: formData.medio,
      status: 'Planejada',
      structures: formData.structures,
      banks: formData.banks,
      products: formData.products,
      observations: '',
      summary: formData.summary,
      potentialValue,
      prospectPartner: '',
      prospectCnpj: '',
      prospectAddress: '',
      prospectPhone: '',
      prospectContact: '',
      comments: [],
    };

    setVisits(prev => [...prev, newVisit]);

    // Send invite notifications
    invitedUsers.forEach(iu => {
      addNotification({
        type: 'invite',
        visitId: newVisit.id,
        fromUserId: user?.id || '',
        toUserId: iu.userId,
        partnerId: partner.id,
        partnerName: partner.name,
        date: formData.date,
        time: formData.time,
        status: 'pending',
        message: getRandomMessage('invite_detail', {
          parceiro: partner.name,
          nome: user?.name || '',
          data: formData.date,
          hora: formData.time,
        }),
      });
    });

    toast({
      title: 'Visita salva!',
      description: potentialValue
        ? `Potencial: ${formatCentavos(potentialValue)}`
        : 'A visita foi adicionada aos compromissos.',
    });

    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-4 w-4" />
            Nova Visita — {partner.name}
            <span className="text-xs text-muted-foreground font-normal ml-auto">Etapa {formStep + 1}/3</span>
          </DialogTitle>
        </DialogHeader>

        {formStep === 0 && (
          <div className="space-y-4">
            {/* Partner info (read-only) */}
            <div className="rounded-lg bg-muted/50 border p-3 space-y-1">
              <p className="text-sm font-medium">{partner.name}</p>
              <p className="text-xs text-muted-foreground">{partner.address}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {partner.structures.map(s => (
                  <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Meio</Label>
                <Select value={formData.medio} onValueChange={v => setFormData({ ...formData, medio: v as 'presencial' | 'remoto' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="remoto">Remoto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Período *</Label>
                <Select value={formData.period} onValueChange={v => setFormData({ ...formData, period: v as VisitPeriod })}>
                  <SelectTrigger className={cn(!formData.period && 'text-muted-foreground')}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {getActiveItems('periods').map(p => (
                      <SelectItem key={p} value={p.toLowerCase() as VisitPeriod}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Hora <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" /> Potencial de Produção
              </Label>
              <Input
                value={formData.potentialValue}
                onChange={e => { userEditedPotential.current = true; setFormData({ ...formData, potentialValue: formatCurrencyInput(e.target.value) }); }}
                placeholder="Ex: R$ 5.000,00"
              />
              {suggestedSourceDate && !userEditedPotential.current && (
                <p className="text-[11px] text-muted-foreground">Sugestão baseada na visita de {suggestedSourceDate}</p>
              )}
            </div>

            {/* Convidados */}
            <div className="space-y-2">
              <Label>Convidados</Label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto border rounded-md p-2">
                {allCargos.map(cargo => {
                  const usersInCargo = invitableUsers.filter(u => u.role === cargo);
                  if (usersInCargo.length === 0) return null;
                  return (
                    <div key={cargo} className="space-y-1">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide pt-1">
                        {cargoLabels[cargo]}
                      </p>
                      {usersInCargo.map(c => (
                        <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={formData.invitedUserIds.includes(c.id)}
                            onCheckedChange={() => setFormData({
                              ...formData,
                              invitedUserIds: formData.invitedUserIds.includes(c.id)
                                ? formData.invitedUserIds.filter(id => id !== c.id)
                                : [...formData.invitedUserIds, c.id],
                            })}
                          />
                          <span>{c.name}</span>
                        </label>
                      ))}
                    </div>
                  );
                })}
              </div>
              {formData.invitedUserIds.length > 0 && (
                <p className="text-[11px] text-muted-foreground">{formData.invitedUserIds.length} convidado(s)</p>
              )}
            </div>
          </div>
        )}

        {formStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bancos</Label>
              <div className="grid grid-cols-2 gap-2">
                {infoBankNames.map(b => (
                  <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={formData.banks.includes(b)}
                      onCheckedChange={() => setFormData({ ...formData, banks: toggleArray(formData.banks, b) })}
                    />
                    {b}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Produtos</Label>
              <div className="grid grid-cols-2 gap-2">
                {getActiveItems('products').map(p => (
                  <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={formData.products.includes(p)}
                      onCheckedChange={() => setFormData({ ...formData, products: toggleArray(formData.products, p) })}
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {formStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Resumo da visita</Label>
              <Textarea
                value={formData.summary}
                onChange={e => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Resumo geral da visita..."
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-0">
          {formStep > 0 && (
            <Button variant="outline" onClick={() => setFormStep(s => s - 1)}>Voltar</Button>
          )}
          {formStep < 2 ? (
            <Button onClick={() => setFormStep(s => s + 1)}>
              {formStep === 0 && !formData.period ? 'Preencha o período' : 'Próximo'}
            </Button>
          ) : (
            <Button onClick={handleSave}>Salvar Visita</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
