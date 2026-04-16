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
import { DollarSign } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVisit ? "Editar Compromisso" : "Novo Compromisso"} — Etapa {formStep + 1}/3
            </DialogTitle>
          </DialogHeader>

          {formStep === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
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
                <div className="space-y-2">
                  <Label>Meio</Label>
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
                <p className="text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2">
                  ⚠ Prospecções são oportunidades futuras e não fazem parte da base de parceiros.
                </p>
              )}

              <div className="space-y-2">
                <Label>Período da agenda *</Label>
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

              {formData.type === "visita" ? (
                <div className="space-y-2">
                  <Label>Parceiro</Label>
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
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{getPartnerById(formData.partnerId)?.address}</p>
                      <div className="flex flex-wrap gap-1">
                        {getPartnerById(formData.partnerId)?.structures.map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px]">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Parceiro</Label>
                    <Input
                      value={formData.prospectPartner}
                      onChange={(e) => setFormData({ ...formData, prospectPartner: e.target.value })}
                      placeholder="Nome do parceiro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input
                      value={formData.prospectCnpj}
                      onChange={(e) => setFormData({ ...formData, prospectCnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail *</Label>
                    <Input
                      type="email"
                      value={formData.prospectEmail}
                      onChange={(e) => setFormData({ ...formData, prospectEmail: e.target.value })}
                      placeholder="email@parceiro.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Endereço</Label>
                    <Input
                      value={formData.prospectAddress}
                      onChange={(e) => setFormData({ ...formData, prospectAddress: e.target.value })}
                      placeholder="Endereço completo"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input
                        value={formData.prospectPhone}
                        onChange={(e) => setFormData({ ...formData, prospectPhone: e.target.value })}
                        placeholder="(00) 0000-0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contato</Label>
                      <Input
                        value={formData.prospectContact}
                        onChange={(e) => setFormData({ ...formData, prospectContact: e.target.value })}
                        placeholder="Nome do contato"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Hora <span className="text-muted-foreground text-xs">(opcional)</span>
                  </Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  Potencial de Produção
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
                  <p className="text-[11px] text-muted-foreground">Sugestão baseada na visita de {suggestedSourceDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Convidados</Label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto border rounded-md p-2">
                  {allCargos.map((cargo) => {
                    const usersInCargo = invitableUsers.filter((u) => u.role === cargo);
                    if (usersInCargo.length === 0) return null;
                    return (
                      <div key={cargo} className="space-y-1">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide pt-1">
                          {cargoLabels[cargo]}
                        </p>
                        {usersInCargo.map((c) => (
                          <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
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
                        className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm overflow-hidden"
                      >
                        <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Motivo da agenda inconclusa</p>
                        <p className="text-sm">{formData.inconclusiveReason}</p>
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
                  {infoBankNames.map((b) => (
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
                  {getActiveItems("products").map((p) => (
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
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Resumo geral da visita..."
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {formStep > 0 && (
              <Button variant="outline" onClick={() => setFormStep(formStep - 1)}>
                Voltar
              </Button>
            )}
            {formStep < 2 ? (
              <Button onClick={() => setFormStep(formStep + 1)} disabled={formStep === 0 && !canProceedStep1}>
                Próximo
              </Button>
            ) : (
              <Button onClick={handleSave}>Salvar agenda</Button>
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
