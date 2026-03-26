import { useState, useMemo, useCallback } from 'react';
import PageTransition from '@/components/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { mockUsers, getUserById, BANKS, PRODUCTS, Visit, VisitStatus, VisitType, VisitPeriod, VisitComment, statusBgClasses, getPartnerById as getPartnerByIdGlobal, RESCHEDULE_REASONS, CANCEL_REASONS } from '@/data/mock-data';
import { useVisits } from '@/hooks/useVisits';
import { usePartners } from '@/hooks/usePartners';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { getRandomMessage } from '@/data/notification-messages';
import { Plus, ChevronLeft, ChevronRight, CalendarIcon, Check, X, Sun, Moon, DollarSign, Clock as ClockIcon } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, addWeeks, subWeeks, isSameDay, isSameMonth, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import AgendaDetailModal from '@/components/AgendaDetailModal';
import JustificationModal from '@/components/agenda/JustificationModal';
import { usePermission } from '@/hooks/usePermission';
import { ShieldOff } from 'lucide-react';
import { formatCurrencyInput, parseCurrencyToNumber, formatCentavos } from '@/lib/currency';
import { AnimatePresence, motion } from 'framer-motion';

type ViewMode = 'day' | 'week' | 'month';

export default function AgendaPage() {
  const { canRead, canWrite } = usePermission();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const { partners, getPartnerById } = usePartners();
  const { addNotification } = useNotifications();
  const { visits, setVisits } = useVisits();
  const [view, setView] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [draggedVisitId, setDraggedVisitId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [filterUser, setFilterUser] = useState<string>('all');
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const [pendingDrop, setPendingDrop] = useState<{ visitId: string; newDate: string; day: Date } | null>(null);
  const [pendingFormStatus, setPendingFormStatus] = useState<'Reagendada' | 'Cancelada' | null>(null);
  const [showJustificationModal, setShowJustificationModal] = useState(false);

  // Form state
  const [formStep, setFormStep] = useState(0);
  const [formData, setFormData] = useState({
    partnerId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    period: '' as VisitPeriod | '',
    type: 'visita' as VisitType,
    medio: 'presencial' as 'presencial' | 'remoto',
    status: 'Planejada' as VisitStatus,
    structures: [] as string[],
    banks: [] as string[],
    products: [] as string[],
    summary: '',
    potentialValue: '',
    prospectEmail: '',
    prospectPartner: '',
    prospectCnpj: '',
    prospectAddress: '',
    prospectPhone: '',
    prospectContact: '',
    invitedUserIds: [] as string[],
    rescheduleReason: '',
    cancelReason: '',
  });

  const resetForm = () => {
    setFormData({
      partnerId: '', date: format(new Date(), 'yyyy-MM-dd'), time: '', period: '',
      type: 'visita', medio: 'presencial', status: 'Planejada',
      structures: [], banks: [], products: [], summary: '',
      potentialValue: '', prospectEmail: '',
      prospectPartner: '', prospectCnpj: '', prospectAddress: '', prospectPhone: '', prospectContact: '',
      invitedUserIds: [], rescheduleReason: '', cancelReason: '',
    });
    setFormStep(0);
  };

  // Visibility filter: comercial only sees visits they participate in
  const visibleVisits = useMemo(() => {
    if (!user || !role) return visits;
    if (role === 'comercial') {
      return visits.filter(v =>
        v.userId === user.id ||
        v.createdBy === user.id ||
        v.invitedUsers?.some(iu => iu.userId === user.id && iu.status === 'accepted')
      );
    }
    return visits;
  }, [visits, user, role]);

  const filteredVisits = useMemo(() => {
    return visibleVisits.filter(v => {
      if (filterStatus !== 'all' && v.status !== filterStatus) return false;
      if (filterType !== 'all' && v.type !== filterType) return false;
      if (filterUser !== 'all' && v.userId !== filterUser) return false;
      return true;
    });
  }, [visibleVisits, filterStatus, filterType, filterUser]);

  const handleDragStart = (e: React.DragEvent, visitId: string) => {
    setDraggedVisitId(visitId);
    setHasDragged(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, dayStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDay(dayStr);
  };

  const handleDragLeave = () => { setDragOverDay(null); };

  const handleDrop = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    setDragOverDay(null);
    if (!draggedVisitId) return;
    const newDate = format(day, 'yyyy-MM-dd');
    const visit = visits.find(v => v.id === draggedVisitId);
    if (!visit || visit.date === newDate) { setDraggedVisitId(null); return; }
    // Intercept: open justification modal for reschedule
    setPendingDrop({ visitId: draggedVisitId, newDate, day });
    setPendingFormStatus('Reagendada');
    setShowJustificationModal(true);
    setDraggedVisitId(null);
  };

  const handleJustificationConfirm = (reason: string) => {
    if (pendingDrop) {
      // Drag-and-drop reschedule
      setVisits(prev => prev.map(v =>
        v.id === pendingDrop.visitId ? {
          ...v,
          date: pendingDrop.newDate,
          status: 'Reagendada' as VisitStatus,
          rescheduleReason: reason,
          statusChangedAt: new Date().toISOString(),
        } : v
      ));
      const visit = visits.find(v => v.id === pendingDrop.visitId);
      const label = visit?.type === 'visita' ? 'Visita' : 'Prospecção';
      toast({ title: 'Reagendamento registrado com sucesso', description: `${label} reagendada para ${format(pendingDrop.day, "dd 'de' MMMM", { locale: ptBR })}` });
      setPendingDrop(null);
    } else if (pendingFormStatus) {
      // Form status change
      const reasonField = pendingFormStatus === 'Reagendada' ? 'rescheduleReason' : 'cancelReason';
      setFormData(prev => ({ ...prev, status: pendingFormStatus as VisitStatus, [reasonField]: reason }));
      const msg = pendingFormStatus === 'Reagendada' ? 'Reagendamento registrado com sucesso' : 'Cancelamento registrado com sucesso';
      toast({ title: msg });
    }
    setPendingFormStatus(null);
    setShowJustificationModal(false);
  };

  const handleJustificationCancel = () => {
    setPendingDrop(null);
    setPendingFormStatus(null);
    setShowJustificationModal(false);
  };

  const handleDragEnd = () => { setDraggedVisitId(null); setDragOverDay(null); };

  const navigateCalendar = (dir: 'prev' | 'next') => {
    if (view === 'month') setCurrentDate(dir === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(dir === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + (dir === 'next' ? 1 : -1));
      setCurrentDate(d);
    }
  };

  const days = useMemo(() => {
    if (view === 'month') {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const weekStart = startOfWeek(start, { locale: ptBR });
      const weekEnd = endOfWeek(end, { locale: ptBR });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    } else if (view === 'week') {
      const start = startOfWeek(currentDate, { locale: ptBR });
      const end = endOfWeek(currentDate, { locale: ptBR });
      return eachDayOfInterval({ start, end });
    }
    return [currentDate];
  }, [view, currentDate]);

  const getVisitsForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return filteredVisits.filter(v => v.date === dateStr);
  };

  // Step 1 validation
  const canProceedStep1 = useMemo(() => {
    if (!formData.period) return false;
    if (!formData.date) return false;
    if (formData.type === 'visita' && !formData.partnerId) return false;
    if (formData.type === 'prospecção' && !formData.prospectPartner) return false;
    if (formData.type === 'prospecção' && !formData.prospectEmail) return false;
    // Status-specific validations
    if (formData.status === 'Reagendada' && !formData.rescheduleReason) return false;
    if (formData.status === 'Cancelada' && !formData.cancelReason) return false;
    return true;
  }, [formData]);

  const handleSave = () => {
    if (!formData.date || !isValid(parseISO(formData.date))) {
      toast({ title: 'Data inválida', description: 'Selecione uma data válida para a agenda.', variant: 'destructive' });
      return;
    }
    const invitedUsers = formData.invitedUserIds.map(uid => ({ userId: uid, status: 'pending' as const }));

    if (user && role !== 'comercial' && formData.type === 'visita' && formData.partnerId) {
      const partner = getPartnerById(formData.partnerId);
      if (partner && !formData.invitedUserIds.includes(partner.responsibleUserId) && partner.responsibleUserId !== user.id) {
        invitedUsers.push({ userId: partner.responsibleUserId, status: 'pending' });
      }
    }

    const potentialValue = formData.potentialValue ? parseCurrencyToNumber(formData.potentialValue) : undefined;

    if (editingVisit) {
      setVisits(prev => prev.map(v =>
        v.id === editingVisit.id ? {
          ...v,
          partnerId: formData.partnerId,
          date: formData.date,
          time: formData.time,
          period: formData.period as VisitPeriod,
          type: formData.type,
          medio: formData.medio,
          status: formData.status,
          structures: formData.structures,
          banks: formData.banks,
          products: formData.products,
          summary: formData.summary,
          potentialValue,
          prospectEmail: formData.prospectEmail || undefined,
          rescheduleReason: formData.rescheduleReason || undefined,
          cancelReason: formData.cancelReason || undefined,
          prospectPartner: formData.prospectPartner,
          prospectCnpj: formData.prospectCnpj,
          prospectAddress: formData.prospectAddress,
          prospectPhone: formData.prospectPhone,
          prospectContact: formData.prospectContact,
          invitedUsers: [...(v.invitedUsers || []), ...invitedUsers.filter(iu => !v.invitedUsers?.some(e => e.userId === iu.userId))],
        } : v
      ));
      const label = formData.type === 'visita' ? 'Visita' : 'Prospecção';
      toast({ title: `${label} atualizada!`, description: `A ${label.toLowerCase()} foi atualizada com sucesso.` });
    } else {
      const newVisit: Visit = {
        id: `v${Date.now()}`,
        partnerId: formData.partnerId,
        userId: user?.id || '',
        createdBy: user?.id || '',
        invitedUsers,
        date: formData.date,
        time: formData.time,
        period: formData.period as VisitPeriod,
        type: formData.type,
        medio: formData.medio,
        status: formData.status,
        structures: formData.structures,
        banks: formData.banks,
        products: formData.products,
        observations: '',
        summary: formData.summary,
        potentialValue,
        prospectEmail: formData.prospectEmail || undefined,
        rescheduleReason: formData.rescheduleReason || undefined,
        cancelReason: formData.cancelReason || undefined,
        prospectPartner: formData.prospectPartner,
        prospectCnpj: formData.prospectCnpj,
        prospectAddress: formData.prospectAddress,
        prospectPhone: formData.prospectPhone,
        prospectContact: formData.prospectContact,
        comments: [],
      };
      setVisits(prev => [...prev, newVisit]);

      const partnerName = formData.type === 'visita' ? (getPartnerById(formData.partnerId)?.name || '') : (formData.prospectPartner || '');
      invitedUsers.forEach(iu => {
        addNotification({
          type: 'invite',
          visitId: newVisit.id,
          fromUserId: user?.id || '',
          toUserId: iu.userId,
          partnerId: formData.partnerId,
          partnerName,
          date: formData.date,
          time: formData.time,
          status: 'pending',
          message: getRandomMessage('invite_detail', {
            parceiro: partnerName,
            nome: user?.name || '',
            data: formData.date,
            hora: formData.time,
          }),
        });
      });

      const label = formData.type === 'visita' ? 'Visita' : 'Prospecção';
      toast({ title: `${label} salva!`, description: potentialValue ? `Potencial: ${formatCentavos(potentialValue)}` : `A ${label.toLowerCase()} foi adicionada à agenda.` });
    }
    setShowForm(false);
    setEditingVisit(null);
    resetForm();
  };

  const handleOpenDetail = (visit: Visit) => {
    if (hasDragged) { setHasDragged(false); return; }
    setSelectedVisit(visit);
    setShowDetail(true);
  };

  const handleEditFromDetail = (visit: Visit) => {
    setShowDetail(false);
    setEditingVisit(visit);
    setFormData({
      partnerId: visit.partnerId,
      date: visit.date,
      time: visit.time,
      period: visit.period || '',
      type: visit.type,
      medio: visit.medio,
      status: visit.status,
      structures: [...visit.structures],
      banks: [...visit.banks],
      products: [...visit.products],
      summary: visit.summary,
      potentialValue: visit.potentialValue ? formatCentavos(visit.potentialValue) : '',
      prospectEmail: visit.prospectEmail || '',
      prospectPartner: visit.prospectPartner || '',
      prospectCnpj: visit.prospectCnpj || '',
      prospectAddress: visit.prospectAddress || '',
      prospectPhone: visit.prospectPhone || '',
      prospectContact: visit.prospectContact || '',
      invitedUserIds: visit.invitedUsers?.map(iu => iu.userId) || [],
      rescheduleReason: visit.rescheduleReason || '',
      cancelReason: visit.cancelReason || '',
    });
    setFormStep(0);
    setShowForm(true);
  };

  const handleAcceptVisitInvite = useCallback((visitId: string) => {
    if (!user) return;
    setVisits(prev => prev.map(v =>
      v.id === visitId ? { ...v, invitedUsers: v.invitedUsers.map(iu => iu.userId === user.id ? { ...iu, status: 'accepted' as const } : iu) } : v
    ));
    toast({ title: getRandomMessage('accept') });
  }, [user, toast]);

  const handleRejectVisitInvite = useCallback((visitId: string) => {
    if (!user) return;
    setVisits(prev => prev.map(v =>
      v.id === visitId ? { ...v, invitedUsers: v.invitedUsers.map(iu => iu.userId === user.id ? { ...iu, status: 'rejected' as const } : iu) } : v
    ));
    toast({ title: getRandomMessage('reject') });
  }, [user, toast]);

  const handleLeaveVisit = useCallback((visitId: string) => {
    if (!user) return;
    setVisits(prev => prev.map(v =>
      v.id === visitId ? { ...v, invitedUsers: v.invitedUsers.filter(iu => iu.userId !== user.id) } : v
    ));
    toast({ title: getRandomMessage('remove') });
  }, [user, toast]);

  // Comment handlers
  const handleAddComment = useCallback((visitId: string, text: string, type: 'observation' | 'task', parentId?: string) => {
    const comment: VisitComment = {
      id: `c${Date.now()}`,
      userId: user?.id || '',
      text,
      type,
      taskCompleted: false,
      parentId,
      createdAt: new Date().toISOString(),
    };
    setVisits(prev => prev.map(v =>
      v.id === visitId ? { ...v, comments: [...(v.comments || []), comment] } : v
    ));
    // Update selectedVisit if open
    setSelectedVisit(prev => prev?.id === visitId ? { ...prev, comments: [...(prev.comments || []), comment] } : prev);
  }, [user]);

  const handleToggleTask = useCallback((visitId: string, commentId: string) => {
    setVisits(prev => prev.map(v =>
      v.id === visitId ? {
        ...v,
        comments: (v.comments || []).map(c => c.id === commentId ? { ...c, taskCompleted: !c.taskCompleted } : c),
      } : v
    ));
    setSelectedVisit(prev => prev?.id === visitId ? {
      ...prev,
      comments: (prev.comments || []).map(c => c.id === commentId ? { ...c, taskCompleted: !c.taskCompleted } : c),
    } : prev);
  }, []);

  const toggleArray = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];

  const commercials = mockUsers.filter(u => u.role === 'comercial' && u.active);
  const today = new Date();

  if (!canRead('agenda.view')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground gap-3">
        <ShieldOff className="h-12 w-12" />
        <p className="text-lg font-medium">Acesso restrito</p>
        <p className="text-sm">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-muted-foreground text-sm">Gerencie suas agendas</p>
        </div>
        {canWrite('agenda.create') && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nova agenda
          </Button>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateCalendar('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[160px] text-center capitalize">
            {view === 'day' ? format(currentDate, "dd 'de' MMMM, yyyy", { locale: ptBR }) :
             view === 'week' ? `${format(startOfWeek(currentDate, { locale: ptBR }), 'dd/MM')} — ${format(endOfWeek(currentDate, { locale: ptBR }), 'dd/MM/yyyy')}` :
             format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </span>
          <Button variant="outline" size="icon" onClick={() => navigateCalendar('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={view} onValueChange={(v) => setView(v as ViewMode)}>
            <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Diário</SelectItem>
              <SelectItem value="week">Semanal</SelectItem>
              <SelectItem value="month">Mensal</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="Planejada">Planejada</SelectItem>
              <SelectItem value="Concluída">Concluída</SelectItem>
              <SelectItem value="Reagendada">Reagendada</SelectItem>
              <SelectItem value="Cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos tipos</SelectItem>
              <SelectItem value="visita">Visita</SelectItem>
              <SelectItem value="prospecção">Prospecção</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar Grid */}
      {view === 'month' ? (
        <Card>
          <CardContent className="p-2 sm:p-4">
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                <div key={d} className="bg-muted px-2 py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
              ))}
              {days.map((day, i) => {
                const dayVisits = getVisitsForDay(day);
                const isToday = isSameDay(day, today);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const dayStr = format(day, 'yyyy-MM-dd');
                return (
                  <div
                    key={i}
                    onDragOver={(e) => handleDragOver(e, dayStr)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, day)}
                    className={cn(
                      'bg-card min-h-[80px] sm:min-h-[100px] p-1.5 transition-colors',
                      !isCurrentMonth && 'opacity-40',
                      dragOverDay === dayStr && 'bg-primary/10 ring-2 ring-primary/30',
                    )}
                  >
                    <span className={cn(
                      'text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full',
                      isToday && 'bg-primary text-primary-foreground',
                    )}>
                      {format(day, 'd')}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayVisits.slice(0, 3).map(v => {
                        const partner = getPartnerById(v.partnerId);
                        const myInvite = user ? v.invitedUsers?.find(iu => iu.userId === user.id && iu.status === 'pending') : null;
                        return (
                          <div
                            key={v.id}
                            draggable={canWrite('agenda.drag')}
                            onDragStart={(e) => canWrite('agenda.drag') && handleDragStart(e, v.id)}
                            onDragEnd={handleDragEnd}
                            onClick={() => handleOpenDetail(v)}
                            className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded truncate border cursor-pointer hover:ring-1 hover:ring-primary/40 flex items-center gap-1',
                              statusBgClasses[v.status],
                              draggedVisitId === v.id && 'opacity-50',
                            )}
                          >
                            {v.period === 'manhã' ? <Sun className="h-2.5 w-2.5 shrink-0" /> : <Moon className="h-2.5 w-2.5 shrink-0" />}
                            <span className="truncate flex-1">{partner?.name?.split(' ')[0]}</span>
                            {myInvite && (
                              <span className="flex gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                                <button
                                  className="h-3.5 w-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600"
                                  onClick={() => handleAcceptVisitInvite(v.id)}
                                >
                                  <Check className="h-2 w-2" />
                                </button>
                                <button
                                  className="h-3.5 w-3.5 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground"
                                  onClick={() => handleRejectVisitInvite(v.id)}
                                >
                                  <X className="h-2 w-2" />
                                </button>
                              </span>
                            )}
                          </div>
                        );
                      })}
                      {dayVisits.length > 3 && (
                        <span className="text-[10px] text-muted-foreground pl-1">+{dayVisits.length - 3}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {days.map((day, i) => {
            const dayVisits = getVisitsForDay(day);
            return (
              <Card key={i}>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs',
                      isSameDay(day, today) ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      {format(day, 'd')}
                    </span>
                    <span className="capitalize">{format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {dayVisits.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma visita agendada</p>
                  ) : dayVisits.map(v => {
                    const partner = getPartnerById(v.partnerId);
                    const vUser = getUserById(v.userId);
                    return (
                      <div key={v.id} onClick={() => handleOpenDetail(v)} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer">
                        <div className={cn('px-2 py-0.5 rounded text-[10px] font-medium border shrink-0', statusBgClasses[v.status])}>
                          {v.status}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{partner?.name}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[9px] px-1 py-0">{v.period === 'manhã' ? '☀ Manhã' : '🌙 Tarde'}</Badge>
                            {v.time ? <span>{v.time}</span> : <span className="flex items-center gap-0.5"><ClockIcon className="h-3 w-3" /> Sem horário</span>}
                            <span>• {vUser?.name} • {v.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {v.potentialValue && (
                            <Badge variant="outline" className={cn('text-[9px]', v.potentialValue >= 1000000 ? 'bg-warning/10 text-warning border-warning/20' : '')}>
                              {formatCentavos(v.potentialValue)}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] capitalize">{v.medio}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Visit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) { setEditingVisit(null); resetForm(); }
      }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVisit ? 'Editar Agenda' : 'Nova Agenda'} — Etapa {formStep + 1}/3</DialogTitle>
          </DialogHeader>

          {formStep === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v as VisitType, partnerId: '', prospectPartner: '', prospectCnpj: '', prospectAddress: '', prospectPhone: '', prospectContact: '', prospectEmail: ''})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visita">Visita</SelectItem>
                      <SelectItem value="prospecção">Prospecção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Meio</Label>
                  <Select value={formData.medio} onValueChange={(v) => setFormData({...formData, medio: v as 'presencial' | 'remoto'})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="remoto">Remoto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Period (required) */}
              <div className="space-y-2">
                <Label>Período da agenda *</Label>
                <Select value={formData.period} onValueChange={(v) => setFormData({...formData, period: v as VisitPeriod})}>
                  <SelectTrigger className={cn(!formData.period && 'text-muted-foreground')}>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manhã">
                      <span className="flex items-center gap-2"><Sun className="h-4 w-4" /> Manhã</span>
                    </SelectItem>
                    <SelectItem value="tarde">
                      <span className="flex items-center gap-2"><Moon className="h-4 w-4" /> Tarde</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'visita' ? (
                <div className="space-y-2">
                  <Label>Parceiro</Label>
                  <Select value={formData.partnerId} onValueChange={(v) => {
                    const partner = getPartnerById(v);
                    setFormData({...formData, partnerId: v, structures: partner?.structures || []});
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecione o parceiro" /></SelectTrigger>
                    <SelectContent>
                      {(role === 'comercial' && user
                        ? partners.filter(p => p.responsibleUserId === user.id)
                        : partners
                      ).map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.partnerId && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{getPartnerById(formData.partnerId)?.address}</p>
                      <div className="flex flex-wrap gap-1">
                        {getPartnerById(formData.partnerId)?.structures.map(s => (
                          <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Parceiro</Label>
                    <Input value={formData.prospectPartner} onChange={e => setFormData({...formData, prospectPartner: e.target.value})} placeholder="Nome do parceiro" />
                  </div>
                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input value={formData.prospectCnpj} onChange={e => setFormData({...formData, prospectCnpj: e.target.value})} placeholder="00.000.000/0000-00" />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail *</Label>
                    <Input
                      type="email"
                      value={formData.prospectEmail}
                      onChange={e => setFormData({...formData, prospectEmail: e.target.value})}
                      placeholder="email@parceiro.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Endereço</Label>
                    <Input value={formData.prospectAddress} onChange={e => setFormData({...formData, prospectAddress: e.target.value})} placeholder="Endereço completo" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input value={formData.prospectPhone} onChange={e => setFormData({...formData, prospectPhone: e.target.value})} placeholder="(00) 0000-0000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Contato</Label>
                      <Input value={formData.prospectContact} onChange={e => setFormData({...formData, prospectContact: e.target.value})} placeholder="Nome do contato" />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Hora <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                  <Input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
              </div>

              {/* Potential Value */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  Potencial de Produção
                </Label>
                <Input
                  value={formData.potentialValue}
                  onChange={e => setFormData({...formData, potentialValue: formatCurrencyInput(e.target.value)})}
                  placeholder="Ex: R$ 5.000,00"
                />
              </div>

              {/* Convidados */}
              <div className="space-y-2">
                <Label>Convidados</Label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {commercials.filter(c => c.id !== user?.id).map(c => (
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
                      {c.name}
                    </label>
                  ))}
                </div>
                {formData.invitedUserIds.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">{formData.invitedUserIds.length} convidado(s)</p>
                )}
              </div>

              {editingVisit && (
                <>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => {
                      const newStatus = v as VisitStatus;
                      if (newStatus === 'Reagendada' || newStatus === 'Cancelada') {
                        setPendingFormStatus(newStatus);
                        setShowJustificationModal(true);
                      } else {
                        setFormData({...formData, status: newStatus, rescheduleReason: '', cancelReason: ''});
                      }
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planejada">Planejada</SelectItem>
                        <SelectItem value="Concluída">Concluída</SelectItem>
                        <SelectItem value="Reagendada">Reagendada</SelectItem>
                        <SelectItem value="Cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Display selected reason */}
                  <AnimatePresence>
                    {formData.status === 'Reagendada' && formData.rescheduleReason && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-2.5 rounded-lg bg-warning/10 border border-warning/20 text-sm overflow-hidden"
                      >
                        <p className="text-xs font-medium text-warning">Motivo do reagendamento</p>
                        <p className="text-sm">{formData.rescheduleReason}</p>
                      </motion.div>
                    )}
                    {formData.status === 'Cancelada' && formData.cancelReason && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-sm overflow-hidden"
                      >
                        <p className="text-xs font-medium text-destructive">Motivo do cancelamento</p>
                        <p className="text-sm">{formData.cancelReason}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          )}

          {formStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Bancos</Label>
                <div className="grid grid-cols-2 gap-2">
                  {BANKS.map(b => (
                    <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={formData.banks.includes(b)} onCheckedChange={() => setFormData({...formData, banks: toggleArray(formData.banks, b)})} />
                      {b}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Produtos</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PRODUCTS.map(p => (
                    <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={formData.products.includes(p)} onCheckedChange={() => setFormData({...formData, products: toggleArray(formData.products, p)})} />
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
                <Textarea value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} placeholder="Resumo geral da visita..." />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {formStep > 0 && <Button variant="outline" onClick={() => setFormStep(formStep - 1)}>Voltar</Button>}
            {formStep < 2 ? (
              <Button onClick={() => setFormStep(formStep + 1)} disabled={formStep === 0 && !canProceedStep1}>Próximo</Button>
            ) : (
              <Button onClick={handleSave}>Salvar agenda</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <AgendaDetailModal
        visit={selectedVisit}
        open={showDetail}
        onOpenChange={setShowDetail}
        onEdit={handleEditFromDetail}
        onDelete={(visitId) => {
          setVisits(prev => prev.filter(v => v.id !== visitId));
          toast({ title: 'Visita excluída', description: 'A visita foi removida com sucesso.' });
        }}
        onAcceptInvite={handleAcceptVisitInvite}
        onRejectInvite={handleRejectVisitInvite}
        onLeaveVisit={handleLeaveVisit}
        onAddComment={handleAddComment}
        onToggleTask={handleToggleTask}
      />
    </PageTransition>
  );
}
