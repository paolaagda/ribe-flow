import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { initialCampaigns, getCampaignStatus, calculateUserScore } from "@/data/campaigns";
import PageTransition from "@/components/PageTransition";
import HeroSection from "@/components/home/HeroSection";
import {
  getUserById,
  Visit,
  VisitStatus,
  VisitPeriod,
  VisitComment,
  cargoLabels,
} from "@/data/mock-data";
import { useVisits } from "@/hooks/useVisits";
import { usePartners } from "@/hooks/usePartners";
import { useAuth } from "@/contexts/AuthContext";
import { useVisibility } from "@/hooks/useVisibility";
import { useNotifications } from "@/hooks/useNotifications";
import { getRandomMessage } from "@/data/notification-messages";
import { useTasks } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  parseISO,
  isValid,
  isWithinInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import AgendaDetailModal from "@/components/AgendaDetailModal";
import JustificationModal from "@/components/agenda/JustificationModal";
import InviteRejectionModal from "@/components/agenda/InviteRejectionModal";
import AgendaFormDialog, { AgendaFormData } from "@/components/agenda/AgendaFormDialog";
import { useAgendaDragDrop } from "@/hooks/useAgendaDragDrop";
import AgendaMonthView from "@/components/agenda/AgendaMonthView";
import AgendaWeekView from "@/components/agenda/AgendaWeekView";
import AgendaDayView from "@/components/agenda/AgendaDayView";
import AgendaFiltersBar from "@/components/agenda/AgendaFiltersBar";
import AgendaKpiGrid from "@/components/agenda/AgendaKpiGrid";
import SmartInsights from "@/components/shared/SmartInsights";
import AnimatedFilterContent from "@/components/shared/AnimatedFilterContent";
import { usePermission } from "@/hooks/usePermission";
import { ShieldOff } from "lucide-react";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useRegistrations } from "@/hooks/useRegistrations";
import { parseCurrencyToNumber, formatCentavos } from "@/lib/currency";
import {
  AGENDA_MAP_CREATE_VISIT_EVENT,
  AGENDA_MAP_OPEN_VISIT_DETAIL_EVENT,
  type AgendaMapCreateVisitPayload,
  type AgendaMapOpenVisitDetailPayload,
} from "@/lib/agenda-map-actions";

type ViewMode = "day" | "week" | "month";

export default function AgendaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { canRead, canWrite } = usePermission();
  const { user } = useAuth();
  const { toast } = useToast();
  const { partners, getPartnerById } = usePartners();
  const { addNotification } = useNotifications();
  const { visits, setVisits } = useVisits();
  const { registrations } = useRegistrations();
  const { addLog } = useAuditLog();

  const rankingLeaderId = useMemo(() => {
    const activeCampaign = initialCampaigns.find((c) => getCampaignStatus(c) === "Ativa");
    if (!activeCampaign) return null;
    const sorted = activeCampaign.participants
      .map((p) => ({ userId: p.userId, score: calculateUserScore(activeCampaign, p.userId) }))
      .sort((a, b) => b.score - a.score);
    return sorted.length > 0 && sorted[0].score > 0 ? sorted[0].userId : null;
  }, []);

  const hasActiveRegistration = useCallback(
    (partnerId: string) => {
      return registrations.some((r) => r.partnerId === partnerId && !["Concluído", "Cancelado"].includes(r.status));
    },
    [registrations],
  );

  const lastVisitMap = useMemo(() => {
    const map = new Map<string, { id: string; date: string }>();
    const concluded = visits
      .filter(v => v.status === 'Concluída')
      .sort((a, b) => b.date.localeCompare(a.date));
    for (const v of concluded) {
      if (!map.has(v.partnerId)) {
        map.set(v.partnerId, { id: v.id, date: v.date });
      }
    }
    return map;
  }, [visits]);

  const [view, setView] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);

  const [showDragJustificationModal, setShowDragJustificationModal] = useState(false);
  const [showInviteRejectionModal, setShowInviteRejectionModal] = useState(false);
  const [rejectingVisitId, setRejectingVisitId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeInsight, setActiveInsight] = useState<string | null>(null);

  // Form initial overrides for pre-filling from cell click / map
  const [formOverrides, setFormOverrides] = useState<Partial<AgendaFormData> | undefined>(undefined);

  // ── Drag-and-drop (A6) ──────────────────────────────────────────
  const {
    draggedVisitId,
    dragOverDay,
    pendingDrop,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    clearPendingDrop,
    consumeDrag,
  } = useAgendaDragDrop(visits);

  // When a drop is pending, open justification modal for reschedule
  useEffect(() => {
    if (pendingDrop) {
      setShowDragJustificationModal(true);
    }
  }, [pendingDrop]);

  useEffect(() => {
    setSelectedVisit((currentSelectedVisit) => {
      if (!currentSelectedVisit) return null;
      return visits.find((currentVisit) => currentVisit.id === currentSelectedVisit.id) ?? currentSelectedVisit;
    });
  }, [visits]);

  const openVisitDetailFromMap = useCallback(
    (visitId: string) => {
      const visit = visits.find((currentVisit) => currentVisit.id === visitId);
      if (!visit) return false;
      setShowForm(false);
      setEditingVisit(null);
      setSelectedVisit(visit);
      setShowDetail(true);
      return true;
    },
    [visits],
  );

  const openCreateVisitFromMap = useCallback(
    (partnerId: string, suggestedDate?: string) => {
      const partner = getPartnerById(partnerId);
      setShowDetail(false);
      setSelectedVisit(null);
      setEditingVisit(null);
      setFormOverrides({
        partnerId,
        date: suggestedDate || format(new Date(), 'yyyy-MM-dd'),
        type: 'visita',
        medio: 'presencial',
        structures: partner?.structures || [],
      });
      setShowForm(true);
    },
    [getPartnerById],
  );

  useEffect(() => {
    const handleOpenVisitDetail = (event: Event) => {
      const detail = (event as CustomEvent<AgendaMapOpenVisitDetailPayload>).detail;
      if (detail?.visitId) {
        openVisitDetailFromMap(detail.visitId);
      }
    };
    const handleCreateVisit = (event: Event) => {
      const detail = (event as CustomEvent<AgendaMapCreateVisitPayload>).detail;
      if (detail?.partnerId) {
        openCreateVisitFromMap(detail.partnerId, detail.suggestedDate);
      }
    };
    window.addEventListener(AGENDA_MAP_OPEN_VISIT_DETAIL_EVENT, handleOpenVisitDetail);
    window.addEventListener(AGENDA_MAP_CREATE_VISIT_EVENT, handleCreateVisit);
    return () => {
      window.removeEventListener(AGENDA_MAP_OPEN_VISIT_DETAIL_EVENT, handleOpenVisitDetail);
      window.removeEventListener(AGENDA_MAP_CREATE_VISIT_EVENT, handleCreateVisit);
    };
  }, [openCreateVisitFromMap, openVisitDetailFromMap]);

  useEffect(() => {
    const createPartnerId = searchParams.get('createVisit');
    const createDate = searchParams.get('date');
    const openVisitId = searchParams.get('openVisit');
    if (createPartnerId) {
      openCreateVisitFromMap(createPartnerId, createDate || undefined);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('createVisit');
      nextParams.delete('date');
      setSearchParams(nextParams, { replace: true });
      return;
    }
    if (openVisitId && openVisitDetailFromMap(openVisitId)) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('openVisit');
      setSearchParams(nextParams, { replace: true });
    }
  }, [openCreateVisitFromMap, openVisitDetailFromMap, searchParams, setSearchParams]);

  const { filterVisits } = useVisibility();

  const visibleVisits = useMemo(() => filterVisits(visits), [visits, filterVisits]);

  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const filteredVisits = useMemo(() => {
    return visibleVisits.filter((v) => {
      if (filterStatus !== "all" && v.status !== filterStatus) return false;
      if (filterType !== "all" && v.type !== filterType) return false;
      if (activeInsight === "agenda_evolucao") {
        const d = parseISO(v.date);
        const ms = startOfMonth(new Date());
        const me = endOfMonth(new Date());
        if (!(v.status === "Concluída" && isWithinInterval(d, { start: ms, end: me }))) return false;
      }
      if (activeInsight === "agenda_valor_hoje") {
        if (!(v.status === "Planejada" && (v.potentialValue || 0) > 0)) return false;
      }
      if (activeInsight === "agenda_taxa_conclusao") {
        if (v.status !== "Concluída") return false;
      }
      if (activeInsight === "agenda_cancelamentos") {
        if (v.status !== "Cancelada") return false;
      }
      if (activeInsight === "agenda_prospeccoes") {
        if (v.type !== "prospecção") return false;
      }
      return true;
    });
  }, [visibleVisits, filterStatus, filterType, activeInsight]);

  const getParticipants = useCallback((v: Visit) => {
    const participants: { id: string; name: string; cargo: string }[] = [];
    const owner = getUserById(v.userId);
    if (owner) participants.push({ id: owner.id, name: owner.name, cargo: cargoLabels[owner.role] || owner.role });
    v.invitedUsers?.forEach((iu) => {
      if (iu.status === "accepted" && iu.userId !== v.userId) {
        const u = getUserById(iu.userId);
        if (u) participants.push({ id: u.id, name: u.name, cargo: cargoLabels[u.role] || u.role });
      }
    });
    return participants;
  }, []);

  const viewFilteredVisits = useMemo(() => {
    let start: Date, end: Date;
    if (view === "month") {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    } else if (view === "week") {
      start = startOfWeek(currentDate, { locale: ptBR });
      end = endOfWeek(currentDate, { locale: ptBR });
    } else {
      start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
    }
    return filteredVisits.filter((v) => {
      const vDate = parseISO(v.date);
      return isWithinInterval(vDate, { start, end });
    });
  }, [filteredVisits, view, currentDate]);

  const todayVisits = useMemo(() => {
    return visibleVisits.filter((v) => v.date === todayStr);
  }, [visibleVisits, todayStr]);

  const todayIndicators = useMemo(() => {
    return {
      total: todayVisits.length,
      concluidas: todayVisits.filter((v) => v.status === "Concluída").length,
    };
  }, [todayVisits]);

  const weekIndicators = useMemo(() => {
    const start = startOfWeek(currentDate, { locale: ptBR });
    const end = endOfWeek(currentDate, { locale: ptBR });
    const inWeek = filteredVisits.filter((v) => {
      const d = parseISO(v.date);
      return isWithinInterval(d, { start, end });
    });
    return {
      total: inWeek.length,
      concluidas: inWeek.filter((v) => v.status === "Concluída").length,
    };
  }, [filteredVisits, currentDate]);

  const monthIndicators = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const inMonth = filteredVisits.filter((v) => {
      const d = parseISO(v.date);
      return isWithinInterval(d, { start, end });
    });
    return {
      total: inMonth.length,
      concluidas: inMonth.filter((v) => v.status === "Concluída").length,
    };
  }, [filteredVisits, currentDate]);

  // Visitas / Prospecções: contagem dentro do período ativo (Dia/Semana/Mês),
  // ignorando o filtro de tipo para que os cards permaneçam estáveis ao alternar.
  const typeAgnosticInPeriod = useMemo(() => {
    let start: Date, end: Date;
    if (view === "month") {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    } else if (view === "week") {
      start = startOfWeek(currentDate, { locale: ptBR });
      end = endOfWeek(currentDate, { locale: ptBR });
    } else {
      start = new Date(currentDate); start.setHours(0, 0, 0, 0);
      end = new Date(currentDate); end.setHours(23, 59, 59, 999);
    }
    return visibleVisits.filter((v) => {
      if (filterStatus !== "all" && v.status !== filterStatus) return false;
      const d = parseISO(v.date);
      return isWithinInterval(d, { start, end });
    });
  }, [visibleVisits, filterStatus, view, currentDate]);

  const visitIndicators = useMemo(() => {
    const list = typeAgnosticInPeriod.filter((v) => v.type === "visita");
    return { total: list.length, concluidas: list.filter((v) => v.status === "Concluída").length };
  }, [typeAgnosticInPeriod]);

  const prospectIndicators = useMemo(() => {
    const list = typeAgnosticInPeriod.filter((v) => v.type === "prospecção");
    return { total: list.length, concluidas: list.filter((v) => v.status === "Concluída").length };
  }, [typeAgnosticInPeriod]);

  const { toggleTask } = useTasks();

  // ── Drag-and-drop justification handler ─────────────────────────
  const handleDragJustificationConfirm = (reason: string) => {
    if (pendingDrop) {
      setVisits((prev) =>
        prev.map((v) =>
          v.id === pendingDrop.visitId
            ? {
                ...v,
                date: pendingDrop.newDate,
                status: "Reagendada" as VisitStatus,
                rescheduleReason: reason,
                statusChangedAt: new Date().toISOString(),
              }
            : v,
        ),
      );
      const visit = visits.find((v) => v.id === pendingDrop.visitId);
      const label = visit?.type === "visita" ? "Visita" : "Prospecção";
      toast({
        title: "Reagendamento registrado com sucesso",
        description: `${label} reagendada para ${format(pendingDrop.day, "dd 'de' MMMM", { locale: ptBR })}`,
      });
      clearPendingDrop();
    }
    setShowDragJustificationModal(false);
  };

  const handleDragJustificationCancel = () => {
    clearPendingDrop();
    setShowDragJustificationModal(false);
  };

  const navigateCalendar = (dir: "prev" | "next") => {
    if (view === "month") setCurrentDate(dir === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(dir === "next" ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + (dir === "next" ? 1 : -1));
      setCurrentDate(d);
    }
  };

  const days = useMemo(() => {
    if (view === "month") {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const weekStart = startOfWeek(start, { locale: ptBR });
      const weekEnd = endOfWeek(end, { locale: ptBR });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    } else if (view === "week") {
      const start = startOfWeek(currentDate, { locale: ptBR });
      const end = endOfWeek(currentDate, { locale: ptBR });
      return eachDayOfInterval({ start, end });
    }
    return [currentDate];
  }, [view, currentDate]);

  const getVisitsForDay = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return filteredVisits.filter((v) => v.date === dateStr);
  };

  // ── Form save handler (A5) ──────────────────────────────────────
  const handleFormSave = useCallback(
    (formData: AgendaFormData, isEditing: boolean) => {
      if (!formData.date || !isValid(parseISO(formData.date))) {
        toast({
          title: "Data inválida",
          description: "Selecione uma data válida para o compromisso.",
          variant: "destructive",
        });
        return;
      }
      if (formData.status === "Inconclusa" && !formData.inconclusiveReason) {
        toast({ title: "Justificativa obrigatória", description: "Selecione o motivo do compromisso inconcluso.", variant: "destructive" });
        return;
      }

      const invitedUsers = formData.invitedUserIds.map((uid) => ({ userId: uid, status: "pending" as const }));

      if (user && ['diretor', 'gerente'].includes(user.role) && formData.type === "visita" && formData.partnerId) {
        const partner = getPartnerById(formData.partnerId);
        if (
          partner &&
          !formData.invitedUserIds.includes(partner.responsibleUserId) &&
          partner.responsibleUserId !== user.id
        ) {
          invitedUsers.push({ userId: partner.responsibleUserId, status: "pending" });
        }
      }

      const potentialValue = formData.potentialValue ? parseCurrencyToNumber(formData.potentialValue) : undefined;

      if (isEditing && editingVisit) {
        setVisits((prev) =>
          prev.map((v) =>
            v.id === editingVisit.id
              ? {
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
                  inconclusiveReason: formData.inconclusiveReason || undefined,
                  statusChangedAt:
                    ["Reagendada", "Cancelada", "Concluída", "Inconclusa"].includes(formData.status)
                      ? new Date().toISOString()
                      : v.statusChangedAt,
                  prospectPartner: formData.prospectPartner,
                  prospectCnpj: formData.prospectCnpj,
                  prospectAddress: formData.prospectAddress,
                  prospectPhone: formData.prospectPhone,
                  prospectContact: formData.prospectContact,
                  invitedUsers: [
                    ...(v.invitedUsers || []),
                    ...invitedUsers.filter((iu) => !v.invitedUsers?.some((e) => e.userId === iu.userId)),
                  ],
                }
              : v,
          ),
        );
        const label = formData.type === "visita" ? "Visita" : "Prospecção";
        toast({ title: `${label} atualizada!`, description: `A ${label.toLowerCase()} foi atualizada com sucesso.` });
      } else {
        const newVisit: Visit = {
          id: `v${Date.now()}`,
          partnerId: formData.partnerId,
          userId: user?.id || "",
          createdBy: user?.id || "",
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
          observations: "",
          summary: formData.summary,
          potentialValue,
          prospectEmail: formData.prospectEmail || undefined,
          rescheduleReason: formData.rescheduleReason || undefined,
          cancelReason: formData.cancelReason || undefined,
          inconclusiveReason: formData.inconclusiveReason || undefined,
          prospectPartner: formData.prospectPartner,
          prospectCnpj: formData.prospectCnpj,
          prospectAddress: formData.prospectAddress,
          prospectPhone: formData.prospectPhone,
          prospectContact: formData.prospectContact,
          comments: [],
        };
        setVisits((prev) => [...prev, newVisit]);

        const partnerName =
          formData.type === "visita" ? getPartnerById(formData.partnerId)?.name || "" : formData.prospectPartner || "";
        invitedUsers.forEach((iu) => {
          addNotification({
            type: "invite",
            visitId: newVisit.id,
            fromUserId: user?.id || "",
            toUserId: iu.userId,
            partnerId: formData.partnerId,
            partnerName,
            date: formData.date,
            time: formData.time,
            status: "pending",
            message: getRandomMessage("invite_detail", {
              parceiro: partnerName,
              nome: user?.name || "",
              data: formData.date,
              hora: formData.time,
            }),
          });
        });

        const label = formData.type === "visita" ? "Visita" : "Prospecção";
        toast({
          title: `${label} salva!`,
          description: potentialValue
            ? `Potencial: ${formatCentavos(potentialValue)}`
            : `A ${label.toLowerCase()} foi adicionada aos compromissos.`,
        });
      }
      setShowForm(false);
      setEditingVisit(null);
    },
    [user, editingVisit, getPartnerById, setVisits, toast, addNotification],
  );

  const handleOpenDetail = (visit: Visit) => {
    if (consumeDrag()) return;
    setSelectedVisit(visit);
    setShowDetail(true);
  };

  const handleEditFromDetail = (visit: Visit) => {
    setShowDetail(false);
    setEditingVisit(visit);
    setFormOverrides(undefined); // use editingVisit path
    setShowForm(true);
  };

  const handleAcceptVisitInvite = useCallback(
    (visitId: string) => {
      if (!user) return;
      setVisits((prev) =>
        prev.map((v) =>
          v.id === visitId
            ? {
                ...v,
                invitedUsers: v.invitedUsers.map((iu) =>
                  iu.userId === user.id ? { ...iu, status: "accepted" as const } : iu,
                ),
              }
            : v,
        ),
      );
      toast({ title: getRandomMessage("accept") });
    },
    [user, toast],
  );

  const handleRejectVisitInvite = useCallback(
    (visitId: string) => {
      if (!user) return;
      setRejectingVisitId(visitId);
      setShowInviteRejectionModal(true);
    },
    [user],
  );

  const handleConfirmRejectVisitInvite = useCallback(
    (reason: string) => {
      if (!user || !rejectingVisitId) return;
      const foundVisit = visits.find((v) => v.id === rejectingVisitId);
      const partnerName = foundVisit ? getPartnerById(foundVisit.partnerId)?.name || foundVisit.partnerId : "Agenda";
      setVisits((prev) =>
        prev.map((v) =>
          v.id === rejectingVisitId
            ? {
                ...v,
                invitedUsers: v.invitedUsers.map((iu) =>
                  iu.userId === user.id ? { ...iu, status: "rejected" as const } : iu,
                ),
              }
            : v,
        ),
      );
      addLog({
        module: "Agenda",
        action: "reject",
        entityId: rejectingVisitId,
        entityLabel: partnerName,
        field: "Convite",
        oldValue: "Pendente",
        newValue: `Rejeitado – ${reason}`,
        description: `${user.name} rejeitou participação – motivo: ${reason}`,
      });
      toast({ title: getRandomMessage("reject"), description: `Motivo: ${reason}` });
      setShowInviteRejectionModal(false);
      setRejectingVisitId(null);
    },
    [user, rejectingVisitId, toast, visits, addLog],
  );

  const handleLeaveVisit = useCallback(
    (visitId: string) => {
      if (!user) return;
      setVisits((prev) =>
        prev.map((v) =>
          v.id === visitId ? { ...v, invitedUsers: v.invitedUsers.filter((iu) => iu.userId !== user.id) } : v,
        ),
      );
      toast({ title: getRandomMessage("remove") });
    },
    [user, toast],
  );

  const handleAddComment = useCallback(
    (visitId: string, text: string, type: "observation" | "task", parentId?: string) => {
      const comment: VisitComment = {
        id: `c${Date.now()}`,
        userId: user?.id || "",
        text,
        type,
        taskCompleted: false,
        parentId,
        createdAt: new Date().toISOString(),
      };
      setVisits((prev) =>
        prev.map((v) => (v.id === visitId ? { ...v, comments: [...(v.comments || []), comment] } : v)),
      );
      setSelectedVisit((prev) =>
        prev?.id === visitId ? { ...prev, comments: [...(prev.comments || []), comment] } : prev,
      );
    },
    [user],
  );

  const handleToggleTask = useCallback((visitId: string, commentId: string) => {
    toggleTask(visitId, commentId);
    setSelectedVisit((prev) => {
      if (!prev || prev.id !== visitId) return prev;
      return {
        ...prev,
        comments: (prev.comments || []).map((c) =>
          c.id === commentId ? { ...c, taskCompleted: !c.taskCompleted } : c,
        ),
      };
    });
  }, [toggleTask]);

  const today = new Date();

  if (!canRead("agenda.view")) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground gap-3">
        <ShieldOff className="h-12 w-12" />
        <p className="text-lg font-medium">Acesso restrito</p>
        <p className="text-sm">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <PageTransition className="space-y-ds-lg">
      <HeroSection />

      <SmartInsights
        page="agenda"
        activeFilter={activeInsight}
        onFilterClick={setActiveInsight}
        filterView={view}
        filterStatus={filterStatus}
        filterType={filterType}
      />

      <AgendaFiltersBar
        view={view}
        currentDate={currentDate}
        navigateCalendar={navigateCalendar}
        setCurrentDate={setCurrentDate}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterType={filterType}
        setFilterType={setFilterType}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />

      <AnimatedFilterContent filterKey={activeInsight} className="space-y-ds-lg">
        <AgendaKpiGrid
          view={view}
          setView={setView}
          todayIndicators={todayIndicators}
          weekIndicators={weekIndicators}
          monthIndicators={monthIndicators}
          visitIndicators={visitIndicators}
          prospectIndicators={prospectIndicators}
          filterType={filterType}
          setFilterType={setFilterType}
          canCreate={canWrite("agenda.create")}
          onCreateClick={() => { setEditingVisit(null); setFormOverrides(undefined); setShowForm(true); }}
          onCreateClick={() => { setEditingVisit(null); setFormOverrides(undefined); setShowForm(true); }}
        />
        {view === "month" ? (
          <AgendaMonthView
            days={days} currentDate={currentDate} today={today}
            getVisitsForDay={getVisitsForDay} getPartnerById={getPartnerById}
            getParticipants={getParticipants} user={user} canWrite={canWrite}
            draggedVisitId={draggedVisitId} dragOverDay={dragOverDay}
            handleDragStart={handleDragStart} handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave} handleDrop={handleDrop}
            handleDragEnd={handleDragEnd} handleOpenDetail={handleOpenDetail}
            handleAcceptVisitInvite={handleAcceptVisitInvite}
            handleRejectVisitInvite={handleRejectVisitInvite}
            onCellClick={(dateStr) => { setEditingVisit(null); setFormOverrides({ date: dateStr }); setShowForm(true); }}
          />
        ) : view === "week" ? (
          <AgendaWeekView
            days={days} currentDate={currentDate} today={today}
            getVisitsForDay={getVisitsForDay} getPartnerById={getPartnerById}
            getParticipants={getParticipants} user={user} canWrite={canWrite}
            draggedVisitId={draggedVisitId} dragOverDay={dragOverDay}
            handleDragStart={handleDragStart} handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave} handleDrop={handleDrop}
            handleDragEnd={handleDragEnd} handleOpenDetail={handleOpenDetail}
            handleAcceptVisitInvite={handleAcceptVisitInvite}
            handleRejectVisitInvite={handleRejectVisitInvite}
            onCellClick={(dateStr) => { setEditingVisit(null); setFormOverrides({ date: dateStr }); setShowForm(true); }}
          />
        ) : (
          <AgendaDayView
            days={days} currentDate={currentDate} today={today}
            getVisitsForDay={getVisitsForDay} getPartnerById={getPartnerById}
            getParticipants={getParticipants} user={user} canWrite={canWrite}
            draggedVisitId={draggedVisitId} dragOverDay={dragOverDay}
            handleDragStart={handleDragStart} handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave} handleDrop={handleDrop}
            handleDragEnd={handleDragEnd} handleOpenDetail={handleOpenDetail}
            handleAcceptVisitInvite={handleAcceptVisitInvite}
            handleRejectVisitInvite={handleRejectVisitInvite}
            onCellClick={(dateStr) => { setEditingVisit(null); setFormOverrides({ date: dateStr }); setShowForm(true); }}
            lastVisitMap={lastVisitMap} rankingLeaderId={rankingLeaderId}
            hasActiveRegistration={hasActiveRegistration}
          />
        )}

        {/* Create/Edit Visit Dialog (A5) */}
        <AgendaFormDialog
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open);
            if (!open) {
              setEditingVisit(null);
              setFormOverrides(undefined);
            }
          }}
          editingVisit={editingVisit}
          initialOverrides={formOverrides}
          onSave={handleFormSave}
        />
      </AnimatedFilterContent>

      {/* Detail Modal */}
      <AgendaDetailModal
        visit={selectedVisit}
        open={showDetail}
        onOpenChange={setShowDetail}
        onEdit={handleEditFromDetail}
        onDelete={(visitId) => {
          setVisits((prev) => prev.filter((v) => v.id !== visitId));
          toast({ title: "Visita excluída", description: "A visita foi removida com sucesso." });
        }}
        onAcceptInvite={handleAcceptVisitInvite}
        onRejectInvite={handleRejectVisitInvite}
        onLeaveVisit={handleLeaveVisit}
        onAddComment={handleAddComment}
        onToggleTask={handleToggleTask}
        onScheduleFollowUp={(partnerId) => {
          const currentVisit = selectedVisit;
          setShowDetail(false);
          const followUpDate = new Date();
          let businessDays = 0;
          while (businessDays < 5) {
            followUpDate.setDate(followUpDate.getDate() + 1);
            const dow = followUpDate.getDay();
            if (dow !== 0 && dow !== 6) businessDays++;
          }
          const partner = getPartnerById(partnerId);
          setEditingVisit(null);
          setFormOverrides({
            partnerId,
            date: format(followUpDate, "yyyy-MM-dd"),
            type: currentVisit?.type || "visita",
            medio: currentVisit?.medio || "presencial",
            structures: partner?.structures || currentVisit?.structures || [],
            banks: currentVisit?.banks || [],
            products: currentVisit?.products || [],
            potentialValue: currentVisit?.potentialValue ? formatCentavos(currentVisit.potentialValue) : "",
            prospectPartner: currentVisit?.prospectPartner || "",
            prospectCnpj: currentVisit?.prospectCnpj || "",
            prospectAddress: currentVisit?.prospectAddress || "",
            prospectPhone: currentVisit?.prospectPhone || "",
            prospectContact: currentVisit?.prospectContact || "",
          });
          setShowForm(true);
        }}
      />

      {/* Drag-and-drop reschedule justification */}
      <JustificationModal
        open={showDragJustificationModal}
        onOpenChange={(open) => {
          if (!open) handleDragJustificationCancel();
        }}
        targetStatus="Reagendada"
        medio="presencial"
        onConfirm={handleDragJustificationConfirm}
      />

      <InviteRejectionModal
        open={showInviteRejectionModal}
        onOpenChange={setShowInviteRejectionModal}
        medio={rejectingVisitId ? (visits.find(v => v.id === rejectingVisitId)?.medio || 'presencial') : 'presencial'}
        onConfirm={handleConfirmRejectVisitInvite}
      />
    </PageTransition>
  );
}
