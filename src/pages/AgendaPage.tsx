import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Team, initialTeams } from "@/data/teams";
import { initialCampaigns, getCampaignStatus, calculateUserScore } from "@/data/campaigns";
import PageTransition from "@/components/PageTransition";
import HeroSection from "@/components/home/HeroSection";
import AnimatedKpiCard from "@/components/shared/AnimatedKpiCard";
import { CalendarDays, CheckCircle, ListTodo } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  mockUsers,
  getUserById,
  Visit,
  VisitStatus,
  VisitPeriod,
  VisitComment,
  statusBgClasses,
  getPartnerById as getPartnerByIdGlobal,
  allCargos,
  cargoLabels,
} from "@/data/mock-data";
import { useSystemData } from "@/hooks/useSystemData";
import { useInfoData } from "@/hooks/useInfoData";
import { useVisits } from "@/hooks/useVisits";
import { usePartners } from "@/hooks/usePartners";
import { useAuth } from "@/contexts/AuthContext";
import { useVisibility } from "@/hooks/useVisibility";
import { useNotifications } from "@/hooks/useNotifications";
import { getRandomMessage } from "@/data/notification-messages";
import { useTasks } from "@/hooks/useTasks";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Check,
  X,
  DollarSign,
  Clock as ClockIcon,
  Handshake,
  UserPlus,
  CalendarRange,
  Filter,
  Crown,
} from "lucide-react";
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
  isSameDay,
  isSameMonth,
  parseISO,
  isValid,
  isWithinInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import AgendaDetailModal from "@/components/AgendaDetailModal";
import TodayAgenda from "@/components/home/TodayAgenda";
import VisitMap from "@/components/home/VisitMap";
import JustificationModal from "@/components/agenda/JustificationModal";
import InviteRejectionModal from "@/components/agenda/InviteRejectionModal";
import AgendaFormDialog, { AgendaFormData } from "@/components/agenda/AgendaFormDialog";
import { useAgendaDragDrop } from "@/hooks/useAgendaDragDrop";
import AgendaMonthView from "@/components/agenda/AgendaMonthView";
import AgendaWeekView from "@/components/agenda/AgendaWeekView";
import AgendaDayView from "@/components/agenda/AgendaDayView";

import InlineTasksPanel from "@/components/agenda/InlineTasksPanel";
import SmartInsights from "@/components/shared/SmartInsights";
import AnimatedFilterContent from "@/components/shared/AnimatedFilterContent";
import { usePermission } from "@/hooks/usePermission";
import { ShieldOff, FileText } from "lucide-react";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useRegistrations } from "@/hooks/useRegistrations";
import { parseCurrencyToNumber, formatCentavos } from "@/lib/currency";
import { AnimatePresence, motion } from "framer-motion";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
  const { getActiveItems } = useSystemData();
  const { getActiveBanks } = useInfoData();
  const { registrations } = useRegistrations();
  const { addLog } = useAuditLog();

  const [teams] = useLocalStorage<Team[]>("ribercred_teams", initialTeams);

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
  const [filterUser, setFilterUser] = useState<string>("all");
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [pendingFormStatus, setPendingFormStatus] = useState<"Reagendada" | "Cancelada" | "Inconclusa" | null>(null);

  const [showDragJustificationModal, setShowDragJustificationModal] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [showTodayPanel, setShowTodayPanel] = useState(false);
  const [showInviteRejectionModal, setShowInviteRejectionModal] = useState(false);
  const [rejectingVisitId, setRejectingVisitId] = useState<string | null>(null);
  const [showTasksPanel, setShowTasksPanel] = useState(false);
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

  const togglePanel = (panel: "today" | "tasks") => {
    if (panel === "today") {
      setShowTodayPanel((prev) => !prev);
    } else {
      setShowTasksPanel((prev) => !prev);
    }
  };

  const { filterVisits, filterPartners, isRestricted: userIsRestricted } = useVisibility();

  const visibleVisits = useMemo(() => filterVisits(visits), [visits, filterVisits]);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const filteredVisits = useMemo(() => {
    return visibleVisits.filter((v) => {
      if (filterStatus !== "all" && v.status !== filterStatus) return false;
      if (filterType !== "all" && v.type !== filterType) return false;
      if (filterUser !== "all" && v.userId !== filterUser) return false;
      if (dateRange.from && dateRange.to) {
        const vDate = parseISO(v.date);
        if (!isWithinInterval(vDate, { start: dateRange.from, end: dateRange.to })) return false;
      } else if (dateRange.from) {
        const vDate = parseISO(v.date);
        if (vDate < dateRange.from) return false;
      }
      if (activeInsight === "agenda_evolucao") {
        const d = parseISO(v.date);
        const ms = startOfMonth(new Date());
        const me = endOfMonth(new Date());
        if (!(v.status === "Concluída" && isWithinInterval(d, { start: ms, end: me }))) return false;
      }
      if (activeInsight === "agenda_valor_hoje") {
        if (!(v.status === "Planejada" && (v.potentialValue || 0) > 0)) return false;
      }
      if (activeInsight === "agenda_tarefas_atrasadas") {
        // No direct visit filter for tasks insight
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
  }, [visibleVisits, filterStatus, filterType, filterUser, dateRange, activeInsight, todayStr]);

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

  const indicators = useMemo(() => {
    const visitas = viewFilteredVisits.filter((v) => v.type === "visita");
    const prospecoes = viewFilteredVisits.filter((v) => v.type === "prospecção");
    return {
      visitasCriadas: visitas.length,
      visitasConcluidas: visitas.filter((v) => v.status === "Concluída").length,
      prospecoesCriadas: prospecoes.length,
      prospecoesConcluidas: prospecoes.filter((v) => v.status === "Concluída").length,
      totalAgendas: viewFilteredVisits.length,
      totalConcluidas: viewFilteredVisits.filter((v) => v.status === "Concluída").length,
    };
  }, [viewFilteredVisits]);

  const todayVisits = useMemo(() => {
    return visibleVisits.filter((v) => v.date === todayStr);
  }, [visibleVisits, todayStr]);

  const todayIndicators = useMemo(() => {
    return {
      total: todayVisits.length,
      concluidas: todayVisits.filter((v) => v.status === "Concluída").length,
    };
  }, [todayVisits]);

  const { pendingTasks, completedTasks, toggleTask } = useTasks();

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

      {/* Title + Month nav + Filters toggle */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-ds-xl font-bold shrink-0">Agenda</h1>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => navigateCalendar("prev")}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-ds-xs font-medium min-w-[100px] text-center capitalize">
                {view === "day"
                  ? format(currentDate, "dd 'de' MMMM, yyyy", { locale: ptBR })
                  : view === "week"
                    ? `${format(startOfWeek(currentDate, { locale: ptBR }), "dd/MM")} — ${format(endOfWeek(currentDate, { locale: ptBR }), "dd/MM/yyyy")}`
                    : format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
              </span>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => navigateCalendar("next")}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setCurrentDate(new Date())}>
                Hoje
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant={showFilters ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1.5 relative"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-3.5 w-3.5" />
              Filtros
              {(filterStatus !== "all" || filterType !== "all" || dateRange.from || dateRange.to) && (
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary text-[9px] text-primary-foreground flex items-center justify-center">
                  !
                </span>
              )}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 flex-wrap py-2">
                <Select value={view} onValueChange={(v) => setView(v as ViewMode)}>
                  <SelectTrigger className="w-24 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Diário</SelectItem>
                    <SelectItem value="week">Semanal</SelectItem>
                    <SelectItem value="month">Mensal</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-28 h-7 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos status</SelectItem>
                    <SelectItem value="Planejada">Planejada</SelectItem>
                    <SelectItem value="Concluída">Concluída</SelectItem>
                    <SelectItem value="Reagendada">Reagendada</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                    <SelectItem value="Inconclusa">Inconclusa</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-28 h-7 text-xs">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos tipos</SelectItem>
                    <SelectItem value="visita">Visita</SelectItem>
                    <SelectItem value="prospecção">Prospecção</SelectItem>
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-7 text-xs gap-1",
                        (dateRange.from || dateRange.to) && "border-primary text-primary",
                      )}
                    >
                      <CalendarRange className="h-3 w-3" />
                      {dateRange.from && dateRange.to
                        ? `${format(dateRange.from, "dd/MM")} — ${format(dateRange.to, "dd/MM")}`
                        : dateRange.from
                          ? `A partir de ${format(dateRange.from, "dd/MM")}`
                          : "Período"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="end">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Data inicial</p>
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(d) => setDateRange((prev) => ({ ...prev, from: d || undefined }))}
                          className="p-2 pointer-events-auto"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Data final</p>
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(d) => setDateRange((prev) => ({ ...prev, to: d || undefined }))}
                          disabled={(d) => (dateRange.from ? d < dateRange.from : false)}
                          className="p-2 pointer-events-auto"
                        />
                      </div>
                      {(dateRange.from || dateRange.to) && (
                        <Button variant="ghost" size="sm" className="w-full" onClick={() => setDateRange({})}>
                          Limpar período
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                {(filterStatus !== "all" || filterType !== "all" || dateRange.from || dateRange.to) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-muted-foreground"
                    onClick={() => {
                      setFilterStatus("all");
                      setFilterType("all");
                      setDateRange({});
                    }}
                  >
                    <X className="h-3 w-3" /> Limpar
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatedFilterContent filterKey={activeInsight} className="space-y-ds-lg">
        {/* KPI Grid - 6 cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-ds-sm">
          <AnimatedKpiCard
            icon={CalendarDays}
            label="Agenda do dia"
            value={todayIndicators.concluidas}
            secondaryValue={todayIndicators.total}
            color="text-info"
            delay={0.1}
            onClick={() => togglePanel("today")}
            active={showTodayPanel}
          />
          <AnimatedKpiCard
            icon={ListTodo}
            label="Tarefas"
            value={completedTasks.length}
            secondaryValue={pendingTasks.length + completedTasks.length}
            color="text-warning"
            delay={0.15}
            onClick={() => togglePanel("tasks")}
            active={showTasksPanel}
            pulse={pendingTasks.some((t) => {
              const days = Math.floor((Date.now() - new Date(t.task.createdAt).getTime()) / 86400000);
              return days >= 10;
            })}
          />
          <AnimatedKpiCard
            icon={CheckCircle}
            label="Compromissos"
            value={indicators.totalConcluidas}
            secondaryValue={indicators.totalAgendas}
            color="text-success"
            delay={0.2}
          />
          <AnimatedKpiCard
            icon={Handshake}
            label="Visitas"
            value={indicators.visitasConcluidas}
            secondaryValue={indicators.visitasCriadas}
            color="text-info"
            delay={0.25}
          />
          <AnimatedKpiCard
            icon={UserPlus}
            label="Prospecções"
            value={indicators.prospecoesConcluidas}
            secondaryValue={indicators.prospecoesCriadas}
            color="text-warning"
            delay={0.3}
          />
          {canWrite("agenda.create") && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              <Card
                className="hover:shadow-md transition-shadow cursor-pointer h-full border-dashed border-2 border-primary/20 hover:border-primary/40"
                onClick={() => {
                  setEditingVisit(null);
                  setFormOverrides(undefined);
                  setShowForm(true);
                }}
              >
                <CardContent className="p-ds-sm flex items-center gap-ds-sm h-full">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-ds-sm font-semibold text-primary">Novo compromisso</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {showTodayPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-ds-sm pt-ds-xs">
                <TodayAgenda viewMode="personal" todayVisits={todayVisits} />
                <VisitMap viewMode="personal" todayVisits={todayVisits} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTasksPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-ds-xs">
                <InlineTasksPanel
                  onOpenVisit={(visitId) => {
                    const visit = visits.find((v) => v.id === visitId);
                    if (visit) {
                      setSelectedVisit(visit);
                      setShowDetail(true);
                    }
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {view === "month" ? (
          <Card>
            <CardContent className="p-ds-xs sm:p-ds-sm">
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                  <div key={d} className="bg-muted px-2 py-2 text-center text-xs font-medium text-muted-foreground">
                    {d}
                  </div>
                ))}
                {days.map((day, i) => {
                  const dayVisits = getVisitsForDay(day);
                  const isToday = isSameDay(day, today);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const dayStr = format(day, "yyyy-MM-dd");
                  return (
                    <div
                      key={i}
                      onDragOver={(e) => handleDragOver(e, dayStr)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, day)}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("[data-visit-item]")) return;
                        if (canWrite("agenda.create")) {
                          setEditingVisit(null);
                          setFormOverrides({ date: dayStr });
                          setShowForm(true);
                        }
                      }}
                      className={cn(
                        "bg-card min-h-[80px] sm:min-h-[100px] p-1.5 transition-colors group/day cursor-pointer",
                        !isCurrentMonth && "opacity-40",
                        dragOverDay === dayStr && "bg-primary/10 ring-2 ring-primary/30",
                        canWrite("agenda.create") && "hover:bg-muted/30",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full",
                            isToday && "bg-primary text-primary-foreground",
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        {canWrite("agenda.create") && dayVisits.length === 0 && (
                          <Plus className="h-3 w-3 text-muted-foreground/0 group-hover/day:text-muted-foreground/60 transition-colors" />
                        )}
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {dayVisits.slice(0, 3).map((v) => {
                          const partner = getPartnerById(v.partnerId);
                          const myInvite = user
                            ? v.invitedUsers?.find((iu) => iu.userId === user.id && iu.status === "pending")
                            : null;
                          return (
                            <div
                              key={v.id}
                              data-visit-item
                              draggable={canWrite("agenda.drag")}
                              onDragStart={(e) => canWrite("agenda.drag") && handleDragStart(e, v.id)}
                              onDragEnd={handleDragEnd}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail(v);
                              }}
                              className={cn(
                                "text-[10px] px-1 py-0.5 rounded border cursor-pointer hover:ring-1 hover:ring-primary/40 flex items-center gap-1",
                                statusBgClasses[v.status],
                                draggedVisitId === v.id && "opacity-50",
                                v.type === "prospecção" && "opacity-50 border-muted",
                              )}
                            >
                              {v.type === "visita" ? (
                                <Handshake className="h-2.5 w-2.5 shrink-0 text-info" />
                              ) : (
                                <UserPlus className="h-2.5 w-2.5 shrink-0 text-warning" />
                              )}
                              <span className="text-[9px] truncate max-w-[60px]">
                                {partner?.name || v.prospectPartner || ""}
                              </span>
                              {(() => {
                                const participants = getParticipants(v);
                                return (
                                  <TooltipProvider delayDuration={200}>
                                    <div className="flex -space-x-1 shrink-0">
                                      {participants.slice(0, 2).map((p) => (
                                        <Tooltip key={p.id}>
                                          <TooltipTrigger asChild>
                                            <div className="h-3.5 w-3.5 rounded-full bg-muted border border-background flex items-center justify-center text-[7px] font-medium text-muted-foreground">
                                              {p.name.charAt(0)}
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent side="top" className="text-xs">
                                            {p.name} • {p.cargo}
                                          </TooltipContent>
                                        </Tooltip>
                                      ))}
                                      {participants.length > 2 && (
                                        <div className="h-3.5 w-3.5 rounded-full bg-muted border border-background flex items-center justify-center text-[7px] font-medium text-muted-foreground">
                                          +{participants.length - 2}
                                        </div>
                                      )}
                                    </div>
                                  </TooltipProvider>
                                );
                              })()}
                              {myInvite && (
                                <span className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    aria-label="Aceitar convite"
                                    className="h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90"
                                    onClick={() => handleAcceptVisitInvite(v.id)}
                                  >
                                    <Check className="h-2 w-2" />
                                  </button>
                                  <button
                                    aria-label="Recusar convite"
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
        ) : view === "week" ? (
          <Card>
            <CardContent className="p-ds-xs sm:p-ds-sm">
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {days.map((day, i) => (
                  <div key={`wh-${i}`} className="bg-muted px-2 py-2 text-center text-xs font-medium text-muted-foreground">
                    {format(day, "EEE", { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
                  </div>
                ))}
                {days.map((day, i) => {
                  const dayVisits = getVisitsForDay(day);
                  const dateStr = format(day, "yyyy-MM-dd");
                  const isToday = isSameDay(day, today);
                  return (
                    <div
                      key={i}
                      className={cn(
                        "bg-card min-h-[200px] p-1.5 transition-colors group/day cursor-pointer",
                        dragOverDay === dateStr && "bg-primary/10 ring-2 ring-primary/30",
                        canWrite("agenda.create") && "hover:bg-muted/30",
                      )}
                      onDragOver={(e) => handleDragOver(e, dateStr)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, day)}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("[data-visit-item]")) return;
                        if (canWrite("agenda.create") && dayVisits.length === 0) {
                          setEditingVisit(null);
                          setFormOverrides({ date: dateStr });
                          setShowForm(true);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={cn(
                            "text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full",
                            isToday && "bg-primary text-primary-foreground",
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        {dayVisits.length > 0 && (
                          <span className="text-[10px] text-muted-foreground">{dayVisits.length}</span>
                        )}
                        {canWrite("agenda.create") && dayVisits.length === 0 && (
                          <Plus className="h-3 w-3 text-muted-foreground/0 group-hover/day:text-muted-foreground/60 transition-colors" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {dayVisits.map((v) => {
                          const partner = getPartnerById(v.partnerId);
                          const myInvite = user
                            ? v.invitedUsers?.find((iu) => iu.userId === user.id && iu.status === "pending")
                            : null;
                          return (
                            <div
                              key={v.id}
                              data-visit-item
                              draggable={canWrite("agenda.drag")}
                              onDragStart={(e) => canWrite("agenda.drag") && handleDragStart(e, v.id)}
                              onDragEnd={handleDragEnd}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail(v);
                              }}
                              className={cn(
                                "text-[10px] px-1 py-1 rounded border cursor-pointer hover:ring-1 hover:ring-primary/40 flex flex-col gap-0.5",
                                statusBgClasses[v.status],
                                draggedVisitId === v.id && "opacity-50",
                                v.type === "prospecção" && "opacity-50 border-muted",
                              )}
                            >
                              <div className="flex items-center gap-1">
                                {v.type === "visita" ? (
                                  <Handshake className="h-2.5 w-2.5 shrink-0 text-info" />
                                ) : (
                                  <UserPlus className="h-2.5 w-2.5 shrink-0 text-warning" />
                                )}
                                <span className="text-[10px] font-medium truncate leading-tight">
                                  {partner?.name || v.prospectPartner || ""}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 flex-wrap">
                                {v.time && (
                                  <span className="text-[9px] font-mono text-muted-foreground">{v.time}</span>
                                )}
                                <Badge variant="outline" className={cn("text-[8px] px-0.5 py-0 leading-tight", statusBgClasses[v.status])}>
                                  {v.status}
                                </Badge>
                                {partner && (
                                  <Badge variant="outline" className={cn("text-[8px] px-0.5 py-0 capitalize",
                                    partner.potential === 'alto' ? 'bg-success/10 text-success border-success/20' :
                                    partner.potential === 'médio' ? 'bg-info/10 text-info border-info/20' :
                                    'bg-muted/50 text-muted-foreground border-border/30'
                                  )}>{partner.potential}</Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                {(() => {
                                  const participants = getParticipants(v);
                                  return (
                                    <TooltipProvider delayDuration={200}>
                                      <div className="flex -space-x-1 shrink-0">
                                        {participants.slice(0, 2).map((p) => (
                                          <Tooltip key={p.id}>
                                            <TooltipTrigger asChild>
                                              <div className="h-3.5 w-3.5 rounded-full bg-muted border border-background flex items-center justify-center text-[7px] font-medium text-muted-foreground">
                                                {p.name.charAt(0)}
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="text-xs">
                                              {p.name} • {p.cargo}
                                            </TooltipContent>
                                          </Tooltip>
                                        ))}
                                        {participants.length > 2 && (
                                          <div className="h-3.5 w-3.5 rounded-full bg-muted border border-background flex items-center justify-center text-[7px] font-medium text-muted-foreground">
                                            +{participants.length - 2}
                                          </div>
                                        )}
                                      </div>
                                    </TooltipProvider>
                                  );
                                })()}
                                {myInvite && (
                                  <span className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      aria-label="Aceitar convite"
                                      className="h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90"
                                      onClick={() => handleAcceptVisitInvite(v.id)}
                                    >
                                      <Check className="h-2 w-2" />
                                    </button>
                                    <button
                                      aria-label="Recusar convite"
                                      className="h-3.5 w-3.5 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground"
                                      onClick={() => handleRejectVisitInvite(v.id)}
                                    >
                                      <X className="h-2 w-2" />
                                    </button>
                                  </span>
                                )}
                                {v.potentialValue && v.potentialValue > 0 && (
                                  <span className="text-[9px] text-muted-foreground font-medium">{formatCentavos(v.potentialValue)}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {dayVisits.length === 0 && (
                          <div className="flex items-center justify-center h-full min-h-[60px]">
                            <p className="text-[10px] text-muted-foreground/40">—</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Day view */
          <div className="space-y-3">
            {days.map((day, i) => {
              const dayVisits = getVisitsForDay(day);
              return (
                <Card key={i}>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs",
                          isSameDay(day, today) ? "bg-primary text-primary-foreground" : "bg-muted",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      <span className="capitalize">{format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    {dayVisits.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma visita agendada</p>
                    ) : (
                      dayVisits.map((v) => {
                        const partner = getPartnerById(v.partnerId);
                        const vUser = getUserById(v.userId);
                        return (
                          <div
                            key={v.id}
                            onClick={() => handleOpenDetail(v)}
                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer"
                          >
                            <div
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-medium border shrink-0",
                                statusBgClasses[v.status],
                              )}
                            >
                              {v.status}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {partner?.name || v.prospectPartner || "Sem nome"}
                              </p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[9px] px-1 py-0 gap-0.5",
                                    v.type === "visita"
                                      ? "bg-info/10 text-info border-info/20"
                                      : "bg-warning/10 text-warning border-warning/20",
                                  )}
                                >
                                  {v.type === "visita" ? (
                                    <>
                                      <Handshake className="h-2.5 w-2.5" />
                                      Visita
                                    </>
                                  ) : (
                                    <>
                                      <UserPlus className="h-2.5 w-2.5" />
                                      Prospecção
                                    </>
                                  )}
                                </Badge>
                                {v.time ? (
                                  <span>{v.time}</span>
                                ) : (
                                  <span className="flex items-center gap-0.5">
                                    <ClockIcon className="h-3 w-3" /> Sem horário
                                  </span>
                                )}
                                <span>• {vUser?.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {partner && (
                                  <Badge variant="outline" className={cn("text-[9px] px-1 py-0 capitalize",
                                    partner.potential === 'alto' ? 'bg-success/10 text-success border-success/20' :
                                    partner.potential === 'médio' ? 'bg-info/10 text-info border-info/20' :
                                    'bg-muted/50 text-muted-foreground border-border/30'
                                  )}>{partner.potential}</Badge>
                                )}
                                {v.type === 'visita' && partner && (() => {
                                  const lastConcluded = lastVisitMap.get(v.partnerId);
                                  if (!lastConcluded || lastConcluded.id === v.id) return <span className="text-[10px] text-muted-foreground/70">Primeira visita</span>;
                                  const daysAgo = Math.floor((Date.now() - new Date(lastConcluded.date).getTime()) / 86400000);
                                  return <span className="text-[10px] text-muted-foreground/70">Última visita: {daysAgo}d atrás</span>;
                                })()}
                                {v.status === 'Concluída' && !v.summary?.trim() && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 bg-muted/50 text-muted-foreground border-border/30 gap-0.5">
                                    <FileText className="h-2 w-2" /> Sem resumo
                                  </Badge>
                                )}
                                {(() => {
                                  const pendingCount = v.comments?.filter(c => c.type === 'task' && !c.taskCompleted).length || 0;
                                  if (pendingCount === 0) return null;
                                  return (
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 bg-warning/10 text-warning border-warning/20 gap-0.5">
                                      <ListTodo className="h-2 w-2" /> {pendingCount} tarefa{pendingCount > 1 ? 's' : ''}
                                    </Badge>
                                  );
                                })()}
                              </div>
                            </div>
                            {(() => {
                              const participants = getParticipants(v);
                              return (
                                <TooltipProvider delayDuration={200}>
                                  <div className="flex -space-x-1.5 shrink-0">
                                    {participants.slice(0, 4).map((p) => (
                                      <Tooltip key={p.id}>
                                        <TooltipTrigger asChild>
                                          <div className="relative">
                                            {p.id === rankingLeaderId && (
                                              <Crown className="h-3 w-3 text-yellow-500 fill-yellow-500 absolute -top-2 left-1/2 -translate-x-1/2 z-10" />
                                            )}
                                            <Avatar className="h-6 w-6 border-2 border-background">
                                              <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                                                {p.name.charAt(0)}
                                              </AvatarFallback>
                                            </Avatar>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="text-xs">
                                          {p.name} • {p.cargo}
                                        </TooltipContent>
                                      </Tooltip>
                                    ))}
                                    {participants.length > 4 && (
                                      <Avatar className="h-6 w-6 border-2 border-background">
                                        <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">
                                          +{participants.length - 4}
                                        </AvatarFallback>
                                      </Avatar>
                                    )}
                                  </div>
                                </TooltipProvider>
                              );
                            })()}
                            <div className="flex items-center gap-1.5">
                              {hasActiveRegistration(v.partnerId) && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] bg-info/10 text-info border-info/20 gap-0.5"
                                >
                                  <FileText className="h-2.5 w-2.5" />
                                  Cadastro
                                </Badge>
                              )}
                              {v.potentialValue && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[9px]",
                                    v.potentialValue >= 1000000 ? "bg-warning/10 text-warning border-warning/20" : "",
                                  )}
                                >
                                  {formatCentavos(v.potentialValue)}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-[10px] capitalize">
                                {v.medio}
                              </Badge>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
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
