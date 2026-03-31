import { useState, useMemo } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import PageTransition from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, FileText, Clock, CheckCircle2, AlertCircle, PauseCircle, XCircle, PenLine, ShieldAlert } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useRegistrations } from '@/hooks/useRegistrations';
import { useSystemData } from '@/hooks/useSystemData';
import RegistrationCard from '@/components/cadastro/RegistrationCard';
import RegistrationModal from '@/components/cadastro/RegistrationModal';
import { Registration } from '@/data/registrations';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useNavigate } from 'react-router-dom';

const statusKpiConfig: Record<string, { icon: any; color: string }> = {
  'Não iniciado': { icon: FileText, color: 'text-muted-foreground' },
  'Colhendo documentação': { icon: Clock, color: 'text-info' },
  'Em análise': { icon: AlertCircle, color: 'text-warning' },
  'Colhendo assinaturas': { icon: PenLine, color: 'text-violet-500' },
  'Concluído': { icon: CheckCircle2, color: 'text-success' },
  'Em pausa': { icon: PauseCircle, color: 'text-orange-500' },
  'Cancelado': { icon: XCircle, color: 'text-destructive' },
};

export default function CadastroPage() {
  const { registrations, updateRegistration, deleteRegistration } = useRegistrations();
  const { getActiveItems } = useSystemData();
  const { canRead, canWrite } = usePermission();
  const { toast } = useToast();
  const { addLog } = useAuditLog();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBank, setFilterBank] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null);

  const statuses = getActiveItems('registrationStatuses');
  const banks = getActiveItems('registrationBanks');

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    registrations.forEach(r => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
  }, [registrations]);

  const filtered = useMemo(() => {
    return registrations.filter(r => {
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (filterBank !== 'all' && r.bank !== filterBank) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesSearch = r.observation.toLowerCase().includes(q) ||
          r.bank.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          r.handlingWith.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [registrations, filterStatus, filterBank, search]);

  const handleCardClick = (reg: Registration) => {
    navigate(`/cadastro/${reg.id}`);
  };

  const handleNew = () => {
    setSelectedReg(null);
    setModalOpen(true);
  };

  const handleEdit = (reg: Registration) => {
    setSelectedReg(reg);
    setModalOpen(true);
  };

  const handleTogglePause = (reg: Registration) => {
    const newStatus = reg.status === 'Em pausa' ? 'Não iniciado' : 'Em pausa';
    updateRegistration(reg.id, { status: newStatus });
    addLog({
      module: 'Cadastro',
      action: 'status_change',
      entityId: reg.id,
      entityLabel: `Cadastro - ${reg.bank}`,
      field: 'Status',
      oldValue: reg.status,
      newValue: newStatus,
      description: `Alterou status de "${reg.status}" para "${newStatus}"`,
    });
    toast({ title: newStatus === 'Em pausa' ? 'Cadastro pausado' : 'Cadastro reativado' });
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteRegistration(deleteTarget.id);
      addLog({
        module: 'Cadastro',
        action: 'delete',
        entityId: deleteTarget.id,
        entityLabel: `Cadastro - ${deleteTarget.bank}`,
        description: `Excluiu cadastro do banco ${deleteTarget.bank}`,
      });
      toast({ title: 'Cadastro excluído' });
      setDeleteTarget(null);
    }
  };

  if (!canRead('registration.view')) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold text-foreground">Acesso Restrito</h2>
          <p className="text-sm text-muted-foreground max-w-md">Você não tem permissão para acessar esta página.</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-ds-lg">
        <PageHeader title="Cadastro" description="Gerencie o credenciamento de parceiros com bancos.">
          {canWrite('registration.create') && (
            <Button onClick={handleNew} className="gap-2">
              <Plus className="h-4 w-4" /> Novo Cadastro
            </Button>
          )}
        </PageHeader>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          <AnimatedKpiCard
            icon={FileText}
            label="Total"
            value={registrations.length}
            color="text-primary"
            delay={0}
            onClick={() => setFilterStatus('all')}
            active={filterStatus === 'all'}
          />
          {Object.entries(statusKpiConfig).map(([status, config], i) => (
            <AnimatedKpiCard
              key={status}
              icon={config.icon}
              label={status}
              value={statusCounts[status] || 0}
              color={config.color}
              delay={(i + 1) * 0.05}
              onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
              active={filterStatus === status}
              pulse={status === 'Em análise' && (statusCounts[status] || 0) > 0}
            />
          ))}
        </div>


        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por observação, banco, código..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-44 h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {statuses.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterBank} onValueChange={setFilterBank}>
            <SelectTrigger className="w-full sm:w-36 h-9">
              <SelectValue placeholder="Banco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os bancos</SelectItem>
              {banks.map(b => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">Nenhum cadastro encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(reg => (
              <RegistrationCard
                key={reg.id}
                registration={reg}
                onClick={() => handleCardClick(reg)}
                onEdit={() => handleEdit(reg)}
                onChangeStatus={() => handleEdit(reg)}
                onTogglePause={() => handleTogglePause(reg)}
                onDelete={() => setDeleteTarget(reg)}
              />
            ))}
          </div>
        )}

        <RegistrationModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          registration={selectedReg}
          canEdit={canWrite('registration.edit')}
          canChangeStatus={canWrite('registration.changeStatus')}
          canEditObservation={canWrite('registration.editObservation')}
        />

        <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir cadastro</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este cadastro? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}
