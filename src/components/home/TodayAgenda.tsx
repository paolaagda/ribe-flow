import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarCheck, Check, Clock, MapPin, CalendarX, Handshake, UserPlus } from 'lucide-react';
import { mockUsers, statusBgClasses, Visit } from '@/data/mock-data';
import { useAuth } from '@/contexts/AuthContext';
import { usePartners } from '@/hooks/usePartners';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTeamFilter } from '@/hooks/useTeamFilter';

const potentialColors: Record<string, string> = {
  alto: 'bg-success/10 text-success border-success/20',
  médio: 'bg-warning/10 text-warning border-warning/20',
  baixo: 'bg-muted text-muted-foreground border-border',
};

interface TodayAgendaProps {
  viewMode: 'personal' | 'team';
  visits: Visit[];
}

export default function TodayAgenda({ viewMode }: TodayAgendaProps) {
  const { user } = useAuth();
  const { getPartnerById } = usePartners();
  const { toast } = useToast();
  const { getVisibleUserIds } = useTeamFilter();
  const today = new Date().toISOString().split('T')[0];
  const [completedIds, setCompletedIds] = useLocalStorage<string[]>('ribercred_completed_visits', []);

  const todayVisits = useMemo(() => {
    return mockVisits
      .filter(v => {
        if (v.date !== today) return false;
        if (viewMode === 'personal') return v.userId === user?.id;
        return getVisibleUserIds.includes(v.userId);
      })
      .map(v => completedIds.includes(v.id) ? { ...v, status: 'Concluída' as const } : v)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [today, user, completedIds, viewMode, getVisibleUserIds]);

  const now = new Date();
  const currentTime = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

  const nextVisitIndex = todayVisits.findIndex(
    v => v.status === 'Planejada' && v.time >= currentTime
  );

  const handleComplete = (visitId: string) => {
    setCompletedIds(prev => [...prev, visitId]);
    toast({ title: '✅ Visita concluída!', description: 'Bom trabalho, continue assim!' });
  };

  if (todayVisits.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" /> Agenda do dia
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <CalendarX className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">Nenhuma visita hoje</p>
          <p className="text-muted-foreground/70 text-sm mt-1">Que tal prospectar novos parceiros?</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarCheck className="h-4 w-4" /> Agenda do dia
          <Badge variant="secondary" className="ml-auto tabular-nums">{todayVisits.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {todayVisits.map((v, i) => {
          const partner = getPartnerById(v.partnerId);
          const isNext = i === nextVisitIndex;
          const isDone = v.status === 'Concluída';

          return (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
                isNext ? 'border-primary bg-primary/5 ring-1 ring-primary/20' :
                isDone ? 'opacity-70' : 'border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 min-w-[48px]">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-mono font-semibold">{v.time}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {v.type === 'visita' ? <Handshake className="h-3 w-3 text-info shrink-0" /> : <UserPlus className="h-3 w-3 text-warning shrink-0" />}
                    <p className="text-sm font-medium truncate">{partner?.name || v.prospectPartner || 'Parceiro'}</p>
                    {viewMode === 'team' && (
                      <Badge variant="secondary" className="text-[10px]">
                        {mockUsers.find(u => u.id === v.userId)?.name?.split(' ')[0] || ''}
                      </Badge>
                    )}
                    <Badge variant="outline" className={`text-[10px] ${statusBgClasses[v.status]}`}>
                      {v.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {v.medio === 'presencial' ? <><MapPin className="h-2.5 w-2.5 mr-0.5" />Presencial</> : '💻 Remoto'}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] capitalize">{v.type}</Badge>
                    {partner && (
                      <Badge variant="outline" className={`text-[10px] ${potentialColors[partner.potential]}`}>
                        {partner.potential}
                      </Badge>
                    )}
                  </div>
                </div>
                {!isDone && v.status === 'Planejada' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-success hover:bg-success/10"
                    onClick={() => handleComplete(v.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                {isDone && <Check className="h-4 w-4 text-success shrink-0" />}
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
