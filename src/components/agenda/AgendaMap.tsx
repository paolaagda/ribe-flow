import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Route } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Visit, Partner } from '@/data/mock-data';
import { cn } from '@/lib/utils';

interface AgendaMapProps {
  visits: Visit[];
  getPartnerById: (id: string) => Partner | undefined;
}

export default function AgendaMap({ visits, getPartnerById }: AgendaMapProps) {
  const visitPartners = useMemo(() => {
    return visits
      .map(v => ({ visit: v, partner: getPartnerById(v.partnerId) }))
      .filter((p): p is { visit: Visit; partner: Partner } => !!p.partner && p.partner.lat !== 0);
  }, [visits, getPartnerById]);

  const points = useMemo(() => {
    if (visitPartners.length === 0) return [];

    const lats = visitPartners.map(p => p.partner.lat);
    const lngs = visitPartners.map(p => p.partner.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const latRange = maxLat - minLat || 1;
    const lngRange = maxLng - minLng || 1;
    const padding = 0.1;

    // Deduplicate by partner to avoid stacking
    const seen = new Set<string>();
    return visitPartners.reduce<{ x: number; y: number; name: string; city: string; count: number; index: number }[]>((acc, p, i) => {
      if (seen.has(p.partner.id)) {
        const existing = acc.find(a => a.name === p.partner.name);
        if (existing) existing.count++;
        return acc;
      }
      seen.add(p.partner.id);
      acc.push({
        x: padding * 100 + ((p.partner.lng - minLng) / lngRange) * (100 - padding * 200),
        y: padding * 100 + ((maxLat - p.partner.lat) / latRange) * (100 - padding * 200),
        name: p.partner.name,
        city: p.partner.address.split('—')[1]?.trim() || '',
        count: 1,
        index: acc.length,
      });
      return acc;
    }, []);
  }, [visitPartners]);

  if (points.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Mapa de Compromissos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <Navigation className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum compromisso com localização</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Mapa de Compromissos
          <span className="text-xs font-normal text-muted-foreground ml-auto">{visitPartners.length} compromissos • {points.length} locais</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider delayDuration={200}>
          <div className="relative w-full h-[280px] bg-muted/30 rounded-lg border border-border overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground)) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }} />

            {points.map((p) => (
              <Tooltip key={p.index}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: p.index * 0.05, type: 'spring', stiffness: 400 }}
                    className="absolute flex items-center justify-center cursor-pointer"
                    style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="relative">
                      <div className={cn(
                        'w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shadow-md border-2 border-background',
                        p.count > 2 && 'w-8 h-8',
                      )}>
                        {p.count}
                      </div>
                    </div>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium text-xs">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.city} • {p.count} compromisso{p.count > 1 ? 's' : ''}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>

        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Route className="h-3 w-3" />{points.length} locais</span>
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{visitPartners.length} compromissos mapeados</span>
        </div>
      </CardContent>
    </Card>
  );
}
