import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Clock, Route } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { mockVisits, Visit } from '@/data/mock-data';
import { useAuth } from '@/contexts/AuthContext';
import { usePartners } from '@/hooks/usePartners';
import { useTeamFilter } from '@/hooks/useTeamFilter';

interface VisitMapProps {
  viewMode: 'personal' | 'team';
  filteredVisits?: Visit[];
}

export default function VisitMap({ viewMode, filteredVisits }: VisitMapProps) {
  const { user } = useAuth();
  const { getPartnerById } = usePartners();
  const { getVisibleUserIds } = useTeamFilter();
  const today = new Date().toISOString().split('T')[0];

  const todayVisits = useMemo(() => {
    const source = filteredVisits || mockVisits;
    return source
      .filter(v => {
        if (v.date !== today) return false;
        if (!filteredVisits) {
          if (viewMode === 'personal') return v.userId === user?.id;
          return getVisibleUserIds.includes(v.userId);
        }
        return true;
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [today, user, viewMode, getVisibleUserIds, filteredVisits]);

  const points = useMemo(() => {
    if (todayVisits.length === 0) return [];
    const partners = todayVisits.map(v => ({
      visit: v,
      partner: getPartnerById(v.partnerId),
    })).filter(p => p.partner);

    if (partners.length === 0) return [];

    const lats = partners.map(p => p.partner!.lat);
    const lngs = partners.map(p => p.partner!.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const latRange = maxLat - minLat || 1;
    const lngRange = maxLng - minLng || 1;
    const padding = 0.15;

    return partners.map((p, i) => ({
      x: padding * 100 + ((p.partner!.lng - minLng) / lngRange) * (100 - padding * 200),
      y: padding * 100 + ((maxLat - p.partner!.lat) / latRange) * (100 - padding * 200),
      name: p.partner!.name,
      time: p.visit.time,
      index: i,
    }));
  }, [todayVisits, getPartnerById]);

  const mockDistance = (todayVisits.length * 12.5).toFixed(1);
  const mockTime = Math.round(todayVisits.length * 25);

  const googleMapsUrl = useMemo(() => {
    const partners = todayVisits.map(v => getPartnerById(v.partnerId)).filter(Boolean);
    if (partners.length < 2) return null;
    const origin = `${partners[0]!.lat},${partners[0]!.lng}`;
    const dest = `${partners[partners.length - 1]!.lat},${partners[partners.length - 1]!.lng}`;
    const waypoints = partners.slice(1, -1).map(p => `${p!.lat},${p!.lng}`).join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${waypoints ? `&waypoints=${waypoints}` : ''}`;
  }, [todayVisits, getPartnerById]);

  if (todayVisits.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Mapa do dia
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <Navigation className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">Sem rota para hoje</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4" /> Mapa do dia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <>
          <div className="relative w-full h-[220px] bg-muted/30 rounded-lg border border-border overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground)) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }} />

            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {points.length > 1 && (
                <motion.polyline
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                  points={points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="0.5"
                  strokeDasharray="2 1"
                  strokeLinecap="round"
                />
              )}
            </svg>

            {points.map((p) => (
              <Tooltip key={p.index}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: p.index * 0.15, type: 'spring', stiffness: 400 }}
                    className="absolute flex items-center justify-center cursor-pointer"
                    style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="relative">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shadow-md border-2 border-background">
                        {p.index + 1}
                      </div>
                    </div>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium text-xs">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.time}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </>

        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Route className="h-3 w-3" />{mockDistance} km</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />~{mockTime} min</span>
          </div>
          {googleMapsUrl && (
            <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                <Navigation className="h-3 w-3 mr-1" /> Ver rota
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
