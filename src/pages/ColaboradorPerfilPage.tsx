import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import PageTransition from '@/components/PageTransition';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useUsersData } from '@/hooks/useUsersData';
import { useVisits } from '@/hooks/useVisits';
import { usePartners } from '@/hooks/usePartners';
import { useTasks } from '@/hooks/useTasks';
import { useUserAvatars } from '@/hooks/useUserAvatars';
import { useTeamFilter } from '@/hooks/useTeamFilter';
import { useRegistrations } from '@/hooks/useRegistrations';
import { cargoLabels, cargoColors, profileLabels, getPartnerById } from '@/data/mock-data';
import { statusColors } from '@/data/registrations';
import { format, parseISO, differenceInDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft, Mail, Briefcase, Shield, Calendar, CheckCircle2,
  Clock, Target, TrendingUp, Users2, MapPin, AlertTriangle,
  Handshake, UserPlus, ListTodo, FileText, Landmark, User
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ColaboradorPerfilPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { users } = useUsersData();
  const { visits } = useVisits();
  const { partners } = usePartners();
  const { allTasks } = useTasks();
  const { getAvatar } = useUserAvatars();
  const { teams } = useTeamFilter();

  const user = users.find(u => u.id === id);

  const stats = useMemo(() => {
    if (!user) return null;

    const userVisits = visits.filter(v => v.userId === user.id);
    const concluded = userVisits.filter(v => v.status === 'Concluída');
    const planned = userVisits.filter(v => v.status === 'Planejada');
    const cancelled = userVisits.filter(v => v.status === 'Cancelada');
    const rescheduled = userVisits.filter(v => v.status === 'Reagendada');
    const visitType = userVisits.filter(v => v.type === 'visita');
    const prospType = userVisits.filter(v => v.type === 'prospecção');
    const visitsConcluded = concluded.filter(v => v.type === 'visita');
    const prospConcluded = concluded.filter(v => v.type === 'prospecção');

    const userTasks = allTasks.filter(t => t.visit.userId === user.id);
    const tasksPending = userTasks.filter(t => !t.task.taskCompleted);
    const tasksDone = userTasks.filter(t => t.task.taskCompleted);
    const tasksOverdue = tasksPending.filter(t =>
      differenceInDays(new Date(), parseISO(t.task.createdAt)) >= 10
    );

    const totalPotential = concluded.reduce((sum, v) => sum + (v.potentialValue || 0), 0);

    const partnersAttended = [...new Set(userVisits.map(v => v.partnerId))];

    const last30 = userVisits.filter(v => {
      const d = parseISO(v.date);
      return differenceInDays(new Date(), d) <= 30;
    });

    const completionRate = userVisits.length > 0
      ? Math.round((concluded.length / userVisits.length) * 100)
      : 0;

    return {
      totalVisits: userVisits.length,
      concluded: concluded.length,
      planned: planned.length,
      cancelled: cancelled.length,
      rescheduled: rescheduled.length,
      visitType: visitType.length,
      prospType: prospType.length,
      visitsConcluded: visitsConcluded.length,
      prospConcluded: prospConcluded.length,
      totalTasks: userTasks.length,
      tasksPending: tasksPending.length,
      tasksDone: tasksDone.length,
      tasksOverdue: tasksOverdue.length,
      totalPotential,
      partnersAttended: partnersAttended.length,
      partnerIds: partnersAttended,
      last30Days: last30.length,
      completionRate,
      recentVisits: userVisits
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 10),
    };
  }, [user, visits, allTasks]);

  const userTeam = useMemo(() => {
    if (!user) return null;
    return teams.find(t =>
      t.managerId === user.id ||
      t.directorId === user.id ||
      t.ascomIds.includes(user.id) ||
      t.commercialIds.includes(user.id)
    );
  }, [user, teams]);

  if (!user) {
    return (
      <PageTransition className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <Users2 className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium text-muted-foreground">Colaborador não encontrado</p>
        <Button variant="outline" onClick={() => navigate('/configuracoes')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
      </PageTransition>
    );
  }

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const avatarUrl = getAvatar(user.id);

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/configuracoes')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Perfil do Colaborador</h1>
          <p className="text-muted-foreground text-sm">Dados detalhados e histórico de atividades</p>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              {avatarUrl && <AvatarImage src={avatarUrl} />}
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold">{user.name}</h2>
                <Badge className={cn('text-xs capitalize', cargoColors[user.role])} variant="secondary">
                  {cargoLabels[user.role]}
                </Badge>
                <Badge variant={user.active ? 'default' : 'destructive'} className="text-[10px]">
                  {user.active ? 'Ativo' : 'Bloqueado'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 shrink-0" />
                  <span>{cargoLabels[user.role]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 shrink-0" />
                  <span>Perfil: {profileLabels[user.profile]}</span>
                </div>
                {userTeam && (
                  <div className="flex items-center gap-2">
                    <Users2 className="h-4 w-4 shrink-0" />
                    <span>Equipe: {userTeam.name}</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground italic">{user.bio}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {stats && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard icon={<Calendar className="h-4 w-4" />} label="Total Agendas" value={stats.totalVisits} />
            <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Concluídas" value={stats.concluded} color="text-success" />
            <StatCard icon={<Handshake className="h-4 w-4" />} label="Visitas" value={`${stats.visitsConcluded}/${stats.visitType}`} color="text-info" />
            <StatCard icon={<UserPlus className="h-4 w-4" />} label="Prospecções" value={`${stats.prospConcluded}/${stats.prospType}`} color="text-warning" />
            <StatCard icon={<ListTodo className="h-4 w-4" />} label="Tarefas" value={`${stats.tasksDone}/${stats.totalTasks}`} color="text-primary" />
            <StatCard icon={<Target className="h-4 w-4" />} label="Parceiros" value={stats.partnersAttended} color="text-accent-foreground" />
          </div>

          {/* Stats Detail */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Performance */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Desempenho
                </h3>
                <Separator />
                <div className="space-y-3">
                  <StatRow label="Taxa de conclusão" value={`${stats.completionRate}%`} />
                  <StatRow label="Agendas nos últimos 30 dias" value={stats.last30Days} />
                  <StatRow label="Reagendadas" value={stats.rescheduled} />
                  <StatRow label="Canceladas" value={stats.cancelled} />
                  <StatRow label="Valor potencial (concluídas)" value={`R$ ${(stats.totalPotential / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                </div>
              </CardContent>
            </Card>

            {/* Tasks */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-primary" /> Tarefas
                </h3>
                <Separator />
                <div className="space-y-3">
                  <StatRow label="Total de tarefas" value={stats.totalTasks} />
                  <StatRow label="Concluídas" value={stats.tasksDone} />
                  <StatRow label="Pendentes" value={stats.tasksPending} />
                  {stats.tasksOverdue > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5" /> Atrasadas (+10 dias)
                      </span>
                      <span className="font-semibold text-destructive">{stats.tasksOverdue}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Partners Attended */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Parceiros Atendidos
              </h3>
              <Separator />
              <div className="flex flex-wrap gap-2">
                {stats.partnerIds.map(pid => {
                  const partner = getPartnerById(pid);
                  if (!partner) return null;
                  return (
                    <Badge key={pid} variant="outline" className="text-xs">
                      {partner.name}
                    </Badge>
                  );
                })}
                {stats.partnerIds.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum parceiro atendido</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Histórico Recente
              </h3>
              <Separator />
              {stats.recentVisits.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentVisits.map(visit => {
                    const partner = getPartnerById(visit.partnerId);
                    const statusClass: Record<string, string> = {
                      'Planejada': 'bg-info/10 text-info',
                      'Concluída': 'bg-success/10 text-success',
                      'Reagendada': 'bg-warning/10 text-warning',
                      'Cancelada': 'bg-destructive/10 text-destructive',
                    };
                    return (
                      <div key={visit.id} className="flex items-center gap-3 text-sm">
                        <div className="w-20 text-xs text-muted-foreground shrink-0">
                          {format(parseISO(visit.date), 'dd/MM/yyyy')}
                        </div>
                        <Badge variant="outline" className={cn('text-[10px] shrink-0', statusClass[visit.status])}>
                          {visit.status}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {visit.type === 'visita' ? 'Visita' : 'Prospecção'}
                        </Badge>
                        <span className="truncate text-muted-foreground">
                          {partner?.name || 'Parceiro desconhecido'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PageTransition>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col items-center text-center gap-1">
        <div className={cn('text-muted-foreground', color)}>{icon}</div>
        <span className={cn('text-xl font-bold', color)}>{value}</span>
        <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
      </CardContent>
    </Card>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
