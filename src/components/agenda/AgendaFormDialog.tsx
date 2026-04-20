import { useState, useMemo, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";
import { DollarSign, Users, Building2, CalendarDays, Landmark, Package, FileText, Info, RefreshCw, XCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getAgendaTypeBrand } from "@/lib/agenda-type-branding";
import {
  Visit,
  VisitStatus,
  VisitType,
  VisitPeriod,
  statusBgClasses,
  allCargos,
  cargoLabels,
  mockUsers,
} from "@/data/mock-data";
import { useAuth } from "@/contexts/AuthContext";
import { usePartners } from "@/hooks/usePartners";
import { useSystemData } from "@/hooks/useSystemData";
import { useInfoData } from "@/hooks/useInfoData";
import { useVisibility } from "@/hooks/useVisibility";
import { useLastVisitPotential } from "@/hooks/useLastVisitPotential";
import { formatCurrencyInput, parseCurrencyToNumber, formatCentavos } from "@/lib/currency";
import JustificationModal from "@/components/agenda/JustificationModal";

export interface AgendaFormData {
  partnerId: string;
  date: string;
  time: string;
  period: VisitPeriod | "";
  type: VisitType;
  medio: "presencial" | "remoto";
  status: VisitStatus;
  structures: string[];
  banks: string[];
  products: string[];
  summary: string;
  potentialValue: string;
  prospectEmail: string;
  prospectPartner: string;
  prospectCnpj: string;
  prospectAddress: string;
  prospectPhone: string;
  prospectContact: string;
  invitedUserIds: string[];
  rescheduleReason: string;
  cancelReason: string;
  inconclusiveReason: string;
}

const EMPTY_FORM: AgendaFormData = {
  partnerId: "",
  date: format(new Date(), "yyyy-MM-dd"),
  time: "",
  period: "",
  type: "visita",
  medio: "presencial",
  status: "Planejada",
  structures: [],
  banks: [],
  products: [],
  summary: "",
  potentialValue: "",
  prospectEmail: "",
  prospectPartner: "",
  prospectCnpj: "",
  prospectAddress: "",
  prospectPhone: "",
  prospectContact: "",
  invitedUserIds: [],
  rescheduleReason: "",
  cancelReason: "",
  inconclusiveReason: "",
};

interface AgendaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingVisit: Visit | null;
  /** Pre-fill overrides when opening the form (e.g. from calendar cell click or map) */
  initialOverrides?: Partial<AgendaFormData>;
  onSave: (data: AgendaFormData, isEditing: boolean) => void;
}

export default function AgendaFormDialog({
  open,
  onOpenChange,
  editingVisit,
  initialOverrides,
  onSave,
}: AgendaFormDialogProps) {
  const { user } = useAuth();
  const { partners, getPartnerById } = usePartners();
  const { getActiveItems } = useSystemData();
  const { getActiveBanks } = useInfoData();
  const { filterPartners } = useVisibility();

  const infoBankNames = getActiveBanks().map((b) => b.name);
  const invitableUsers = mockUsers.filter((u) => u.active && u.id !== user?.id);

  const [formStep, setFormStep] = useState(0);
  const [formData, setFormData] = useState<AgendaFormData>({ ...EMPTY_FORM });
  const [showFinalStatusConfirm, setShowFinalStatusConfirm] = useState(false);
  const [pendingFormStatus, setPendingFormStatus] = useState<"Reagendada" | "Cancelada" | "Inconclusa" | null>(null);
  const [showJustificationModal, setShowJustificationModal] = useState(false);

  // Auto-suggest potential value
  const { value: suggestedPotential, sourceDate: suggestedSourceDate } = useLastVisitPotential(formData.partnerId, formData.date);
  const userEditedPotential = useRef(false);

  useEffect(() => {
    if (!editingVisit && !userEditedPotential.current && suggestedPotential) {
      setFormData(prev => ({ ...prev, potentialValue: suggestedPotential }));
    }
  }, [suggestedPotential, editingVisit]);

  useEffect(() => {
    userEditedPotential.current = false;
  }, [formData.partnerId, formData.date]);

  // Sync form state when dialog opens
  useEffect(() => {
    if (!open) return;
    setFormStep(0);
    setShowFinalStatusConfirm(false);
    userEditedPotential.current = false;

    if (editingVisit) {
      setFormData({
        partnerId: editingVisit.partnerId,
        date: editingVisit.date,
        time: editingVisit.time,
        period: editingVisit.period || "",
        type: editingVisit.type,
        medio: editingVisit.medio,
        status: editingVisit.status,
        structures: [...editingVisit.structures],
        banks: [...editingVisit.banks],
        products: [...editingVisit.products],
        summary: editingVisit.summary,
        potentialValue: editingVisit.potentialValue ? formatCentavos(editingVisit.potentialValue) : "",
        prospectEmail: editingVisit.prospectEmail || "",
        prospectPartner: editingVisit.prospectPartner || "",
        prospectCnpj: editingVisit.prospectCnpj || "",
        prospectAddress: editingVisit.prospectAddress || "",
        prospectPhone: editingVisit.prospectPhone || "",
        prospectContact: editingVisit.prospectContact || "",
        invitedUserIds: editingVisit.invitedUsers?.map((iu) => iu.userId) || [],
        rescheduleReason: editingVisit.rescheduleReason || "",
        cancelReason: editingVisit.cancelReason || "",
        inconclusiveReason: editingVisit.inconclusiveReason || "",
      });
    } else {
      setFormData({ ...EMPTY_FORM, ...initialOverrides });
    }
  }, [open, editingVisit, initialOverrides]);

  const FINAL_STATUSES: VisitStatus[] = ["Concluída", "Cancelada", "Inconclusa"];

  const canProceedStep1 = useMemo(() => {
    if (!formData.period) return false;
    if (!formData.date) return false;
    if (formData.type === "visita" && !formData.partnerId) return false;
    if (formData.type === "prospecção" && !formData.prospectPartner) return false;
    if (formData.type === "prospecção" && !formData.prospectEmail) return false;
    if (formData.status === "Reagendada" && !formData.rescheduleReason) return false;
    if (formData.status === "Cancelada" && !formData.cancelReason) return false;
    return true;
  }, [formData]);

  const handleSave = () => {
    if (user?.role === "comercial" && FINAL_STATUSES.includes(formData.status) && !showFinalStatusConfirm) {
      setShowFinalStatusConfirm(true);
      return;
    }
    onSave(formData, !!editingVisit);
  };

  const handleJustificationConfirm = (reason: string) => {
    if (pendingFormStatus) {
      const reasonField = pendingFormStatus === "Reagendada" ? "rescheduleReason" : pendingFormStatus === "Inconclusa" ? "inconclusiveReason" : "cancelReason";
      setFormData(prev => ({ ...prev, status: pendingFormStatus as VisitStatus, [reasonField]: reason }));
    }
    setPendingFormStatus(null);
    setShowJustificationModal(false);
  };

  const toggleArray = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  const typeBrand = getAgendaTypeBrand(formData.type);
  const TypeIcon = typeBrand.icon;
  const stepLabels = ["Identificação", "Contexto", "Resumo"];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[88vh] overflow-hidden p-0 gap-0 flex flex-col border-border/60">
          {/* Refined header with type tile + lateral gradient bar */}
          <div className="relative shrink-0 border-b border-border/60">
            <div className={cn("absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b", typeBrand.colorToken === "info" ? "from-info to-info/60" : "from-warning to-warning/60")} />
            <DialogHeader className="px-5 py-4 pl-6 space-y-0">
              <div className="flex items-start gap-3">
                <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", typeBrand.bgSoft, typeBrand.text)}>
                  <TypeIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-[10px] font-semibold uppercase tracking-wider", typeBrand.text)}>
                    {typeBrand.label}
                  </p>
                  <DialogTitle className="text-base font-semibold leading-tight mt-0.5">
                    {editingVisit ? "Editar compromisso" : "Novo compromisso"}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Etapa {formStep + 1} de 3 · <span className="font-medium text-foreground/80">{stepLabels[formStep]}</span>
                  </p>
                </div>
              </div>
              {/* Step indicator */}
              <div className="flex items-center gap-1.5 mt-4">
                {stepLabels.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-all",
                      i < formStep ? typeBrand.bg : i === formStep ? typeBrand.bg : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">

          {formStep === 0 && (
            <div className="space-y-5">
              {/* Identificação */}
              <SectionHeader icon={Info} label="Identificação" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        type: v as VisitType,
                        partnerId: "",
                        prospectPartner: "",
                        prospectCnpj: "",
                        prospectAddress: "",
                        prospectPhone: "",
                        prospectContact: "",
                        prospectEmail: "",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visita">Visita a Parceiro</SelectItem>
                      <SelectItem value="prospecção">Prospecção (oportunidade futura)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">Formato</Label>
                  <Select
                    value={formData.medio}
                    onValueChange={(v) => setFormData({ ...formData, medio: v as "presencial" | "remoto" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="remoto">Remoto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.type === "prospecção" && (
                <div className="relative overflow-hidden rounded-lg border border-warning/20 bg-warning/5">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-warning to-warning/60" />
                  <div className="flex items-start gap-2.5 px-3 py-2.5 pl-4">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                    <p className="text-xs text-warning leading-relaxed">
                      Prospecções são oportunidades futuras e não fazem parte da base de parceiros.
                    </p>
                  </div>
                </div>
              )}

              {formData.type === "visita" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">Parceiro *</Label>
                  <Select
                    value={formData.partnerId}
                    onValueChange={(v) => {
                      const partner = getPartnerById(v);
                      setFormData({ ...formData, partnerId: v, structures: partner?.structures || [] });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o parceiro" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterPartners(partners).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.partnerId && (
                    <div className="space-y-1.5 mt-2 p-2.5 rounded-md bg-muted/30 border border-border/60">
                      <p className="text-[11px] text-muted-foreground">{getPartnerById(formData.partnerId)?.address}</p>
                      <div className="flex flex-wrap gap-1">
                        {getPartnerById(formData.partnerId)?.structures.map((s) => (
                          <Badge key={s} variant="outline" className="text-[10px] font-medium bg-muted/40 text-muted-foreground border-border/60">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">Parceiro *</Label>
                    <Input
                      value={formData.prospectPartner}
                      onChange={(e) => setFormData({ ...formData, prospectPartner: e.target.value })}
                      placeholder="Nome do parceiro"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">CNPJ</Label>
                      <Input
                        value={formData.prospectCnpj}
                        onChange={(e) => setFormData({ ...formData, prospectCnpj: e.target.value })}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">E-mail *</Label>
                      <Input
                        type="email"
                        value={formData.prospectEmail}
                        onChange={(e) => setFormData({ ...formData, prospectEmail: e.target.value })}
                        placeholder="email@parceiro.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground/80">Endereço</Label>
                    <Input
                      value={formData.prospectAddress}
                      onChange={(e) => setFormData({ ...formData, prospectAddress: e.target.value })}
                      placeholder="Endereço completo"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Telefone</Label>
                      <Input
                        value={formData.prospectPhone}
                        onChange={(e) => setFormData({ ...formData, prospectPhone: e.target.value })}
                        placeholder="(00) 0000-0000"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground/80">Contato</Label>
                      <Input
                        value={formData.prospectContact}
                        onChange={(e) => setFormData({ ...formData, prospectContact: e.target.value })}
                        placeholder="Nome do contato"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Agendamento */}
              <SectionHeader icon={CalendarDays} label="Agendamento" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">Data *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">
                    Hora <span className="text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">Período da agenda *</Label>
                <Select
                  value={formData.period}
                  onValueChange={(v) => setFormData({ ...formData, period: v as VisitPeriod })}
                >
                  <SelectTrigger className={cn(!formData.period && "text-muted-foreground")}>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    {getActiveItems("periods").map((p) => (
                      <SelectItem key={p} value={p.toLowerCase() as VisitPeriod}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  Potencial de produção
                </Label>
                <Input
                  value={formData.potentialValue}
                  onChange={(e) => {
                    userEditedPotential.current = true;
                    setFormData({ ...formData, potentialValue: formatCurrencyInput(e.target.value) });
                  }}
                  placeholder="Ex: R$ 5.000,00"
                />
                {suggestedSourceDate && !userEditedPotential.current && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" /> Sugestão baseada na visita de {suggestedSourceDate}
                  </p>
                )}
              </div>

              {/* Convidados */}
              <SectionHeader icon={Users} label="Convidados" />
              <div className="space-y-1.5">
                <div className="space-y-1.5 max-h-44 overflow-y-auto rounded-md border border-border/60 bg-muted/20 p-2.5">
                  {allCargos.map((cargo) => {
                    const usersInCargo = invitableUsers.filter((u) => u.role === cargo);
                    if (usersInCargo.length === 0) return null;
                    return (
                      <div key={cargo} className="space-y-1">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-1">
                          {cargoLabels[cargo]}
                        </p>
                        {usersInCargo.map((c) => (
                          <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer rounded px-1 py-0.5 hover:bg-muted/50 transition-colors">
                            <Checkbox
                              checked={formData.invitedUserIds.includes(c.id)}
                              onCheckedChange={() =>
                                setFormData({
                                  ...formData,
                                  invitedUserIds: formData.invitedUserIds.includes(c.id)
                                    ? formData.invitedUserIds.filter((id) => id !== c.id)
                                    : [...formData.invitedUserIds, c.id],
                                })
                              }
                            />
                            <span className="text-foreground/90">{c.name}</span>
                          </label>
                        ))}
                      </div>
                    );
                  })}
                </div>
                {formData.invitedUserIds.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    {formData.invitedUserIds.length} convidado{formData.invitedUserIds.length > 1 ? "s" : ""} selecionado{formData.invitedUserIds.length > 1 ? "s" : ""}
                  </p>
                )}
              </div>

              {editingVisit && (
                <>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    {(() => {
                      const isComercial = user?.role === "comercial";
                      const isStatusLocked = isComercial && editingVisit && FINAL_STATUSES.includes(editingVisit.status);

                      if (isStatusLocked) {
                        return (
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border/50">
                            <Badge variant="outline" className={cn("text-xs capitalize", statusBgClasses[formData.status])}>
                              {formData.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">Status final — não pode ser alterado</span>
                          </div>
                        );
                      }

                      return (
                        <Select
                          value={formData.status}
                          onValueChange={(v) => {
                            const newStatus = v as VisitStatus;
                            if (newStatus === "Reagendada" || newStatus === "Cancelada" || newStatus === "Inconclusa") {
                              setPendingFormStatus(newStatus);
                              setShowJustificationModal(true);
                            } else {
                              setFormData({ ...formData, status: newStatus, rescheduleReason: "", cancelReason: "", inconclusiveReason: "" });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Planejada">Planejada</SelectItem>
                            <SelectItem value="Concluída">Concluída</SelectItem>
                            <SelectItem value="Reagendada">Reagendada</SelectItem>
                            <SelectItem value="Cancelada">Cancelada</SelectItem>
                            {formData.type === "prospecção" && (
                              <SelectItem value="Inconclusa">Inconclusa</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      );
                    })()}
                  </div>

                  <AnimatePresence>
                    {formData.status === "Reagendada" && formData.rescheduleReason && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-2.5 rounded-lg bg-warning/10 border border-warning/20 text-sm overflow-hidden"
                      >
                        <p className="text-xs font-medium text-warning">Motivo do reagendamento</p>
                        <p className="text-sm">{formData.rescheduleReason}</p>
                      </motion.div>
                    )}
                    {formData.status === "Cancelada" && formData.cancelReason && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-sm overflow-hidden"
                      >
                        <p className="text-xs font-medium text-destructive">Motivo do cancelamento</p>
                        <p className="text-sm">{formData.cancelReason}</p>
                      </motion.div>
                    )}
                    {formData.status === "Inconclusa" && formData.inconclusiveReason && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-sm overflow-hidden"
                      >
                        <p className="text-xs font-medium text-primary">Motivo da agenda inconclusa</p>
                        <p className="text-sm">{formData.inconclusiveReason}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          )}

          {formStep === 1 && (
            <div className="space-y-5">
              <SectionHeader icon={Landmark} label="Bancos" />
              <div className="rounded-md border border-border/60 bg-muted/20 p-3">
                <div className="grid grid-cols-2 gap-2">
                  {infoBankNames.map((b) => (
                    <label key={b} className="flex items-center gap-2 text-sm cursor-pointer rounded px-1 py-0.5 hover:bg-muted/50 transition-colors">
                      <Checkbox
                        checked={formData.banks.includes(b)}
                        onCheckedChange={() => setFormData({ ...formData, banks: toggleArray(formData.banks, b) })}
                      />
                      <span className="text-foreground/90">{b}</span>
                    </label>
                  ))}
                </div>
              </div>

              <SectionHeader icon={Package} label="Produtos" />
              <div className="rounded-md border border-border/60 bg-muted/20 p-3">
                <div className="grid grid-cols-2 gap-2">
                  {getActiveItems("products").map((p) => (
                    <label key={p} className="flex items-center gap-2 text-sm cursor-pointer rounded px-1 py-0.5 hover:bg-muted/50 transition-colors">
                      <Checkbox
                        checked={formData.products.includes(p)}
                        onCheckedChange={() => setFormData({ ...formData, products: toggleArray(formData.products, p) })}
                      />
                      <span className="text-foreground/90">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {formStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Resumo do compromisso
                </Label>
                <Textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Resumo geral do compromisso..."
                  className="min-h-[120px] resize-none"
                />
                <p className="text-[11px] text-muted-foreground">Você poderá editar o resumo a qualquer momento no detalhe do compromisso.</p>
              </div>
            </div>
          )}
          </div>

          <DialogFooter className="shrink-0 flex gap-2 px-5 py-3 border-t border-border/60 bg-muted/20">
            {formStep > 0 && (
              <Button variant="outline" size="sm" onClick={() => setFormStep(formStep - 1)}>
                Voltar
              </Button>
            )}
            {formStep < 2 ? (
              <Button size="sm" onClick={() => setFormStep(formStep + 1)} disabled={formStep === 0 && !canProceedStep1}>
                Próximo
              </Button>
            ) : (
              <Button size="sm" onClick={handleSave}>{editingVisit ? "Salvar alterações" : "Criar compromisso"}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <JustificationModal
        open={showJustificationModal}
        onOpenChange={(o) => {
          if (!o) {
            setPendingFormStatus(null);
            setShowJustificationModal(false);
          }
        }}
        targetStatus={pendingFormStatus || "Reagendada"}
        medio={formData.medio}
        onConfirm={handleJustificationConfirm}
      />

      <AlertDialog open={showFinalStatusConfirm} onOpenChange={setShowFinalStatusConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {formData.status === "Cancelada" && "Tem certeza que quer cancelar?"}
              {formData.status === "Concluída" && "Tem certeza que quer concluir?"}
              {formData.status === "Inconclusa" && "Tem certeza que quer inconcluir?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não poderá ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowFinalStatusConfirm(false)}>Recusar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowFinalStatusConfirm(false);
                onSave(formData, !!editingVisit);
              }}
            >
              Aceitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
