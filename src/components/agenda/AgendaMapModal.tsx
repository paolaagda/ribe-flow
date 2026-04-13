import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { MapPin, Navigation, Route, Eye, EyeOff, Handshake, UserPlus, ExternalLink, CalendarPlus, Clock } from 'lucide-react';
import { Visit, Partner, getUserById, cargoLabels } from '@/data/mock-data';
import { usePartners } from '@/hooks/usePartners';
import { useVisits } from '@/hooks/useVisits';
import { cn } from '@/lib/utils';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCentavos } from '@/lib/currency';
import { useNavigate } from 'react-router-dom';

interface AgendaMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visits: Visit[];
  currentDate: Date;
  view: 'day' | 'week' | 'month';
  onOpenVisitDetail?: (visit: Visit) => void;
}

const RADIUS_KM = 100;

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const CLASS_COLORS: Record<string, string> = {
  A: 'bg-green-500/20 text-green-700 border-green-400/50',
  B: 'bg-blue-500/20 text-blue-700 border-blue-400/50',
  C: 'bg-yellow-500/20 text-yellow-700 border-yellow-400/50',
  D: 'bg-muted text-muted-foreground border-border',
};

export default function AgendaMapModal({
  open,
  onOpenChange,
  visits,
  currentDate,
  view,
  onOpenVisitDetail,
}: AgendaMapModalProps) {
  const { partners, getPartnerById } = usePartners();
  const { visits: allVisits } = useVisits();
  const navigate = useNavigate();
  const [mapView, setMapView] = useState<'day' | 'week' | 'month'>(view);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<null | { type: 'visit'; visit: Visit; partner?: Partner } | { type: 'suggestion'; partner: Partner }>(null);

  // Filter visits by the selected period
  const periodVisits = useMemo(() => {
    let start: Date, end: Date;
    if (mapView === 'month') {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    } else if (mapView === 'week') {
      start = startOfWeek(currentDate, { locale: ptBR });
      end = endOfWeek(currentDate, { locale: ptBR });
    } else {
      start = new Date(currentDate); start.setHours(0, 0, 0, 0);
      end = new Date(currentDate); end.setHours(23, 59, 59, 999);
    }
    return visits.filter(v => {
      const d = parseISO(v.date);
      return isWithinInterval(d, { start, end });
    });
  }, [visits, mapView, currentDate]);

  // Visit points with coordinates
  const visitPoints = useMemo(() => {
    return periodVisits
      .map(v => {
        const partner = getPartnerById(v.partnerId);
        return { visit: v, partner };
      })
      .filter((p): p is { visit: Visit; partner: Partner } => !!p.partner && p.partner.lat !== 0);
  }, [periodVisits, getPartnerById]);

  // Suggested partners within 100km of any visit
  const suggestions = useMemo(() => {
    if (!showSuggestions || visitPoints.length === 0) return [];
    const visitPartnerIds = new Set(visitPoints.map(vp => vp.partner.id));
    const suggested = new Map<string, Partner>();

    for (const vp of visitPoints) {
      for (const p of partners) {
        if (visitPartnerIds.has(p.id) || suggested.has(p.id) || p.lat === 0) continue;
        const dist = haversineDistance(vp.partner.lat, vp.partner.lng, p.lat, p.lng);
        if (dist <= RADIUS_KM) {
          suggested.set(p.id, p);
        }
      }
    }
    return Array.from(suggested.values());
  }, [showSuggestions, visitPoints, partners]);

  // Compute map bounds
  const allMapPoints = useMemo(() => {
    const pts: { lat: number; lng: number }[] = visitPoints.map(vp => ({ lat: vp.partner.lat, lng: vp.partner.lng }));
    if (showSuggestions) {
      suggestions.forEach(s => pts.push({ lat: s.lat, lng: s.lng }));
    }
    return pts;
  }, [visitPoints, suggestions, showSuggestions]);

  const toXY = useCallback((lat: number, lng: number) => {
    if (allMapPoints.length === 0) return { x: 50, y: 50 };
    const lats = allMapPoints.map(p => p.lat);
    const lngs = allMapPoints.map(p => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const latRange = maxLat - minLat || 1;
    const lngRange = maxLng - minLng || 1;
    const pad = 0.1;
    return {
      x: pad * 100 + ((lng - minLng) / lngRange) * (100 - pad * 200),
      y: pad * 100 + ((maxLat - lat) / latRange) * (100 - pad * 200),
    };
  }, [allMapPoints]);

  // Last visit date for a partner
  const getLastVisitDate = useCallback((partnerId: string) => {
    const concluded = allVisits
      .filter(v => v.partnerId === partnerId && v.status === 'Concluída')
      .sort((a, b) => b.date.localeCompare(a.date));
    return concluded[0]?.date || null;
  }, [allVisits]);

  const periodLabel = mapView === 'day' ? 'Dia' : mapView === 'week' ? 'Semana' : 'Mês';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" /> Mapa de Compromissos
          </DialogTitle>
        </DialogHeader>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={mapView} onValueChange={v => { setMapView(v as any); setSelectedPoint(null); }}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dia</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={showSuggestions ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs gap-1.5 relative"
            onClick={() => { setShowSuggestions(!showSuggestions); setSelectedPoint(null); }}
          >
            {showSuggestions ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            Sugestões
            {showSuggestions && suggestions.length > 0 && (
              <Badge className="h-4 min-w-[16px] px-1 text-[9px] ml-1">{suggestions.length}</Badge>
            )}
          </Button>

          <span className="text-xs text-muted-foreground ml-auto">
            {visitPoints.length} compromisso{visitPoints.length !== 1 ? 's' : ''}
            {showSuggestions && ` • ${suggestions.length} sugestão(ões)`}
          </span>
        </div>

        {/* Map area */}
        {visitPoints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Navigation className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum compromisso com localização neste período</p>
          </div>
        ) : (
          <TooltipProvider delayDuration={200}>
            <div className="relative w-full h-[400px] bg-muted/30 rounded-lg border border-border overflow-hidden">
              {/* Dot grid background */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground)) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }} />

              {/* Route lines for visits */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {visitPoints.length > 1 && (
                  <motion.polyline
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                    points={visitPoints.map(vp => {
                      const { x, y } = toXY(vp.partner.lat, vp.partner.lng);
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="0.4"
                    strokeDasharray="2 1"
                    strokeLinecap="round"
                  />
                )}
              </svg>

              {/* Suggestion markers */}
              {showSuggestions && suggestions.map((s, i) => {
                const { x, y } = toXY(s.lat, s.lng);
                return (
                  <Tooltip key={`sug-${s.id}`}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.02, type: 'spring', stiffness: 300 }}
                        className="absolute cursor-pointer"
                        style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                        onClick={() => setSelectedPoint({ type: 'suggestion', partner: s })}
                      >
                        <div className={cn(
                          'w-6 h-6 rounded border-2 flex items-center justify-center text-[10px] font-bold shadow-sm',
                          CLASS_COLORS[s.partnerClass] || CLASS_COLORS.D,
                        )}>
                          {s.partnerClass}
                        </div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium text-xs">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">Classe {s.partnerClass} • Sugestão</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}

              {/* Visit markers */}
              {visitPoints.map((vp, i) => {
                const { x, y } = toXY(vp.partner.lat, vp.partner.lng);
                const isVisita = vp.visit.type === 'visita';
                return (
                  <Tooltip key={`vis-${vp.visit.id}`}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.05, type: 'spring', stiffness: 400 }}
                        className="absolute cursor-pointer z-10"
                        style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                        onClick={() => setSelectedPoint({ type: 'visit', visit: vp.visit, partner: vp.partner })}
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-background',
                          isVisita ? 'bg-primary text-primary-foreground' : 'bg-violet-600 text-white',
                        )}>
                          {isVisita ? <Handshake className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                        </div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium text-xs">{vp.partner.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {isVisita ? 'Visita' : 'Prospecção'} • {vp.visit.date} {vp.visit.time || ''}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-primary inline-flex items-center justify-center">
              <Handshake className="h-2.5 w-2.5 text-primary-foreground" />
            </span>
            Visita
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-violet-600 inline-flex items-center justify-center">
              <UserPlus className="h-2.5 w-2.5 text-white" />
            </span>
            Prospecção
          </span>
          {showSuggestions && (
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded border-2 border-muted-foreground/30 inline-flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                A
              </span>
              Sugestão (classe)
            </span>
          )}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedPoint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 rounded-lg border bg-card space-y-2">
                {selectedPoint.type === 'visit' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{selectedPoint.partner?.name || selectedPoint.visit.partnerId}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {selectedPoint.visit.type === 'visita' ? 'Visita' : 'Prospecção'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                      <span>📅 {format(parseISO(selectedPoint.visit.date), "dd/MM/yyyy")}</span>
                      <span>🕐 {selectedPoint.visit.time || selectedPoint.visit.period || '—'}</span>
                      <span>📍 {selectedPoint.visit.medio === 'presencial' ? 'Presencial' : 'Remoto'}</span>
                      <span>📊 {selectedPoint.visit.status}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => {
                        onOpenVisitDetail?.(selectedPoint.visit);
                        onOpenChange(false);
                      }}
                    >
                      <ExternalLink className="h-3 w-3" /> Ver detalhe
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{selectedPoint.partner.name}</p>
                      <Badge variant="outline" className={cn('text-[10px]', CLASS_COLORS[selectedPoint.partner.partnerClass])}>
                        Classe {selectedPoint.partner.partnerClass}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                      <span>📍 {selectedPoint.partner.address.split('—')[1]?.trim() || selectedPoint.partner.address}</span>
                      <span>👤 {getUserById(selectedPoint.partner.responsibleUserId)?.name || '—'}</span>
                      {(() => {
                        const lastDate = getLastVisitDate(selectedPoint.partner.id);
                        return lastDate ? (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Última: {format(parseISO(lastDate), 'dd/MM/yyyy')}</span>
                        ) : (
                          <span className="text-muted-foreground/60">Sem visitas anteriores</span>
                        );
                      })()}
                      {selectedPoint.partner.averageProduction > 0 && (
                        <span>💰 {formatCentavos(selectedPoint.partner.averageProduction)}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => {
                          navigate(`/parceiros?partner=${selectedPoint.partner.id}`);
                          onOpenChange(false);
                        }}
                      >
                        <ExternalLink className="h-3 w-3" /> Ver parceiro
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
