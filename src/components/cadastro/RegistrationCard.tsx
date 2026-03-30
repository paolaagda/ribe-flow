import { Registration, statusColors } from '@/data/registrations';
import { mockUsers } from '@/data/mock-data';
import { usePartners } from '@/hooks/usePartners';
import { useUserAvatars } from '@/hooks/useUserAvatars';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  registration: Registration;
  onClick: () => void;
}

export default function RegistrationCard({ registration, onClick }: Props) {
  const { getPartnerById } = usePartners();
  const { getAvatar } = useUserAvatars();
  const partner = getPartnerById(registration.partnerId);
  const commercial = mockUsers.find(u => u.id === registration.commercialUserId);
  const lastUpdate = registration.updates.length > 0 ? registration.updates[registration.updates.length - 1] : null;
  const lastUpdateUser = lastUpdate ? mockUsers.find(u => u.id === lastUpdate.userId) : null;

  return (
    <Card
      className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Partner name */}
        <h3 className="font-semibold text-sm truncate">{partner?.name || 'Parceiro removido'}</h3>

        {/* Commercial */}
        {commercial && (
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              {getAvatar(commercial.id) && <AvatarImage src={getAvatar(commercial.id)} />}
              <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                {commercial.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">{commercial.name}</span>
          </div>
        )}

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{registration.bank}</Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{registration.solicitation}</Badge>
          <Badge className={cn('text-[10px] px-1.5 py-0 border-0', statusColors[registration.status] || 'bg-muted text-muted-foreground')}>
            {registration.status}
          </Badge>
        </div>

        {/* Handling with */}
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Tratando com:</span> {registration.handlingWith}
        </p>

        {/* Observation truncated */}
        {registration.observation && (
          <p className="text-xs text-muted-foreground line-clamp-2">{registration.observation}</p>
        )}

        {/* Last update */}
        {lastUpdate && lastUpdateUser && (
          <div className="flex items-center gap-2 pt-1 border-t border-border">
            <Avatar className="h-4 w-4">
              {getAvatar(lastUpdate.userId) && <AvatarImage src={getAvatar(lastUpdate.userId)} />}
              <AvatarFallback className="text-[7px] bg-muted">
                {lastUpdateUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[10px] text-muted-foreground truncate">
              {lastUpdateUser.name.split(' ')[0]} · {format(new Date(lastUpdate.date), "dd/MM/yy", { locale: ptBR })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
