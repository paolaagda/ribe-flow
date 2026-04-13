import { useState, useMemo, useCallback, useRef, WheelEvent, TouchEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { MapPin, Navigation, Eye, EyeOff, Handshake, UserPlus, ExternalLink, CalendarPlus, Clock, ArrowRight, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Visit, Partner, getUserById } from '@/data/mock-data';
import { usePartners } from '@/hooks/usePartners';
import { useVisits } from '@/hooks/useVisits';
import { cn } from '@/lib/utils';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCentavos } from '@/lib/currency';
import { useNavigate } from 'react-router-dom';

interface AgendaMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visits?: Visit[];
  currentDate?: Date;
  view?: 'day' | 'week' | 'month';
  onOpenVisitDetail?: (visit: Visit) => void;
  onCreateVisitFromSuggestion?: (partnerId: string, suggestedDate: string) => void;
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

function getPeriodLabel(date: Date, view: 'day' | 'week' | 'month'): string {
  if (view === 'day') return format(date, 'dd/MM/yyyy');
  if (view === 'week') {
    const s = startOfWeek(date, { locale: ptBR });
    const e = endOfWeek(date, { locale: ptBR });
    return `${format(s, 'dd/MM/yyyy')} a ${format(e, 'dd/MM/yyyy')}`;
  }
  return format(date, "MMMM 'de' yyyy", { locale: ptBR }).replace(/^./, c => c.toUpperCase());
}

export default function AgendaMapModal({
  open,
  onOpenChange,
  visits: visitsProp,
  currentDate: currentDateProp,
  view: viewProp,
  onOpenVisitDetail,
  onCreateVisitFromSuggestion,
}: AgendaMapModalProps) {
  const { partners, getPartnerById } = usePartners();
  const { visits: allVisits } = useVisits();
  const navigate = useNavigate();
  const [navDate, setNavDate] = useState<Date>(() => currentDateProp ?? new Date());
  const [mapView, setMapView] = useState<'day' | 'week' | 'month'>(viewProp ?? 'week');
  const visits = visitsProp ?? allVisits;
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Zoom & pan state — zoom affects canvas coordinates, NOT marker sizes
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const pinchStart = useRef<number | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const clampZoom = (v: number) => Math.min(5, Math.max(0.5, v));

  const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setZoom(prev => clampZoom(prev - e.deltaY * 0.002));
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStart.current = Math.sqrt(dx * dx + dy * dy);
    } else if (e.touches.length === 1) {
      isPanning.current = true;
      panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, panX: pan.x, panY: pan.y };
    }
  }, [pan]);

  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchStart.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / pinchStart.current;
      setZoom(prev => clampZoom(prev * scale));
      pinchStart.current = dist;
    } else if (e.touches.length === 1 && isPanning.current) {
      const dx = e.touches[0].clientX - panStart.current.x;
      const dy = e.touches[0].clientY - panStart.current.y;
      setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy });
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    pinchStart.current = null;
    isPanning.current = false;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy });
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Navigation
  const goBack = useCallback(() => {
    setSelectedPoint(null);
    resetView();
    setNavDate(prev => mapView === 'day' ? subDays(prev, 1) : mapView === 'week' ? subWeeks(prev, 1) : subMonths(prev, 1));
  }, [mapView, resetView]);

  const goForward = useCallback(() => {
    setSelectedPoint(null);
    resetView();
    setNavDate(prev => mapView === 'day' ? addDays(prev, 1) : mapView === 'week' ? addWeeks(prev, 1) : addMonths(prev, 1));
  }, [mapView, resetView]);

  const [selectedPoint, setSelectedPoint] = useState<null | { type: 'visit'; visit: Visit; partner?: Partner; index: number } | { type: 'suggestion'; partner: Partner }>(null);

  // Filter visits by selected period
  const periodVisits = useMemo(() => {
    let start: Date, end: Date;
    if (mapView === 'month') {
      start = startOfMonth(navDate);
      end = endOfMonth(navDate);
    } else if (mapView === 'week') {
      start = startOfWeek(navDate, { locale: ptBR });
      end = endOfWeek(navDate, { locale: ptBR });
    } else {
      start = new Date(navDate); start.setHours(0, 0, 0, 0);
      end = new Date(navDate); end.setHours(23, 59, 59, 999);
    }
    return visits.filter(v => {
      const d = parseISO(v.date);
      return isWithinInterval(d, { start, end });
    });
  }, [visits, mapView, navDate]);

  // Visit points sorted chronologically for route
  const visitPoints = useMemo(() => {
    return periodVisits
      .map(v => ({ visit: v, partner: getPartnerById(v.partnerId) }))
      .filter((p): p is { visit: Visit; partner: Partner } => !!p.partner && p.partner.lat !== 0)
      .sort((a, b) => {
        const dateComp = a.visit.date.localeCompare(b.visit.date);
        if (dateComp !== 0) return dateComp;
        return (a.visit.time || '99:99').localeCompare(b.visit.time || '99:99');
      });
  }, [periodVisits, getPartnerById]);

  // Suggestions within 100km
  const suggestions = useMemo(() => {
    if (!showSuggestions || visitPoints.length === 0) return [];
    const visitPartnerIds = new Set(visitPoints.map(vp => vp.partner.id));
    const suggested = new Map<string, Partner>();
    for (const vp of visitPoints) {
      for (const p of partners) {
        if (visitPartnerIds.has(p.id) || suggested.has(p.id) || p.lat === 0) continue;
        if (haversineDistance(vp.partner.lat, vp.partner.lng, p.lat, p.lng) <= RADIUS_KM) {
          suggested.set(p.id, p);
        }
      }
    }
    return Array.from(suggested.values());
  }, [showSuggestions, visitPoints, partners]);

  // Map bounds → coordinate conversion
  const allMapPoints = useMemo(() => {
    const pts: { lat: number; lng: number }[] = visitPoints.map(vp => ({ lat: vp.partner.lat, lng: vp.partner.lng }));
    if (showSuggestions) suggestions.forEach(s => pts.push({ lat: s.lat, lng: s.lng }));
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
    const pad = 0.12;
    return {
      x: pad * 100 + ((lng - minLng) / lngRange) * (100 - pad * 200),
      y: pad * 100 + ((maxLat - lat) / latRange) * (100 - pad * 200),
    };
  }, [allMapPoints]);

  // Marker inverse scale to keep fixed size regardless of zoom
  const markerInverseScale = 1 / zoom;

  const getLastVisitDate = useCallback((partnerId: string) => {
    const concluded = allVisits
      .filter(v => v.partnerId === partnerId && v.status === 'Concluída')
      .sort((a, b) => b.date.localeCompare(a.date));
    return concluded[0]?.date || null;
  }, [allVisits]);

  const getClosestVisitDate = useCallback((partner: Partner) => {
    if (visitPoints.length === 0) return format(new Date(), 'yyyy-MM-dd');
    let closest = visitPoints[0];
    let minDist = Infinity;
    for (const vp of visitPoints) {
      const dist = haversineDistance(partner.lat, partner.lng, vp.partner.lat, vp.partner.lng);
      if (dist < minDist) { minDist = dist; closest = vp; }
    }
    return closest.visit.date;
  }, [visitPoints]);

  // Build SVG route path as quadratic curves for a smoother simulated route
  const routeSvgPath = useMemo(() => {
    if (visitPoints.length < 2) return '';
    const pts = visitPoints.map(vp => toXY(vp.partner.lat, vp.partner.lng));
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      // offset control point perpendicular to segment for a slight curve
      const mx = (prev.x + curr.x) / 2;
      const my = (prev.y + curr.y) / 2;
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const offset = Math.min(len * 0.15, 4); // subtle curve
      const cpx = mx + (-dy / len) * offset;
      const cpy = my + (dx / len) * offset;
      d += ` Q ${cpx} ${cpy}, ${curr.x} ${curr.y}`;
    }
    return d;
  }, [visitPoints, toXY]);

  // Arrow positions along route segments
  const routeArrows = useMemo(() => {
    if (visitPoints.length < 2) return [];
    const arrows: { x: number; y: number; angle: number }[] = [];
    for (let i = 0; i < visitPoints.length - 1; i++) {
      const p1 = toXY(visitPoints[i].partner.lat, visitPoints[i].partner.lng);
      const p2 = toXY(visitPoints[i + 1].partner.lat, visitPoints[i + 1].partner.lng);
      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2;
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
      arrows.push({ x: mx, y: my, angle });
    }
    return arrows;
  }, [visitPoints, toXY]);

  // Container dimensions ref for pixel position calc
  const [containerSize, setContainerSize] = useState({ w: 800, h: 400 });
  const containerObserver = useCallback((node: HTMLDivElement | null) => {
    mapContainerRef.current = node;
    if (node) {
      const rect = node.getBoundingClientRect();
      setContainerSize({ w: rect.width, h: rect.height });
    }
  }, []);

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
          <Select value={mapView} onValueChange={v => { setMapView(v as any); setSelectedPoint(null); resetView(); }}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dia</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goBack}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium text-foreground min-w-[120px] text-center whitespace-nowrap">
              {getPeriodLabel(navDate, mapView)}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goForward}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

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
            <div
              ref={containerObserver}
              className="relative w-full h-[400px] bg-muted/30 rounded-lg border border-border overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Zoomable canvas layer (grid + route lines) — markers are OUTSIDE this */}
              <div
                className="absolute inset-0 origin-center"
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
              >
                {/* Dot grid */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground)) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }} />

                {/* Route line — curved path */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <marker id="routeArrow" markerWidth="6" markerHeight="4" refX="3" refY="2" orient="auto">
                      <polygon points="0 0, 6 2, 0 4" fill="hsl(var(--primary))" opacity="0.5" />
                    </marker>
                  </defs>
                  {routeSvgPath && (
                    <motion.path
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1.2, ease: 'easeInOut' }}
                      d={routeSvgPath}
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth={0.4 / zoom}
                      strokeDasharray={`${2 / zoom} ${1 / zoom}`}
                      strokeLinecap="round"
                    />
                  )}
                </svg>
              </div>

              {/* FIXED-SIZE markers layer — positioned via pixel math, not CSS transform */}

              {/* Route direction arrows (mid-segment, fixed size) */}
              {routeArrows.map((arrow, i) => {
                const { px, py } = getPixelPos(arrow.x, arrow.y, containerSize.w, containerSize.h);
                return (
                  <div
                    key={`arrow-${i}`}
                    className="absolute z-[5] pointer-events-none"
                    style={{
                      left: px,
                      top: py,
                      transform: `translate(-50%, -50%) rotate(${arrow.angle}deg)`,
                    }}
                  >
                    <ArrowRight className="h-3 w-3 text-primary/50" />
                  </div>
                );
              })}

              {/* Suggestion markers (fixed size) */}
              {showSuggestions && suggestions.map((s, i) => {
                const { x, y } = toXY(s.lat, s.lng);
                const { px, py } = getPixelPos(x, y, containerSize.w, containerSize.h);
                return (
                  <Tooltip key={`sug-${s.id}`}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.85 }}
                        transition={{ delay: i * 0.02, type: 'spring', stiffness: 300 }}
                        className="absolute cursor-pointer z-[8]"
                        style={{ left: px, top: py, transform: 'translate(-50%, -50%)' }}
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

              {/* Visit markers (fixed size) */}
              {visitPoints.map((vp, i) => {
                const { x, y } = toXY(vp.partner.lat, vp.partner.lng);
                const { px, py } = getPixelPos(x, y, containerSize.w, containerSize.h);
                const isVisita = vp.visit.type === 'visita';
                return (
                  <Tooltip key={`vis-${vp.visit.id}`}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.05, type: 'spring', stiffness: 400 }}
                        className="absolute cursor-pointer z-10"
                        style={{ left: px, top: py, transform: 'translate(-50%, -50%)' }}
                        onClick={() => setSelectedPoint({ type: 'visit', visit: vp.visit, partner: vp.partner, index: i })}
                      >
                        <div className="relative">
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-background',
                            isVisita ? 'bg-primary text-primary-foreground' : 'bg-violet-600 text-white',
                          )}>
                            {isVisita ? <Handshake className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                          </div>
                          <span className={cn(
                            'absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center border border-background shadow-sm',
                            isVisita ? 'bg-primary text-primary-foreground' : 'bg-violet-600 text-white',
                          )}>
                            {i + 1}
                          </span>
                        </div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium text-xs">{i + 1}º — {vp.partner.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {isVisita ? 'Visita' : 'Prospecção'} • {format(parseISO(vp.visit.date), 'dd/MM')} {vp.visit.time || ''}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}

              {/* Zoom controls */}
              <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7 bg-card/90 backdrop-blur-sm" onClick={() => setZoom(prev => clampZoom(prev + 0.3))}>
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7 bg-card/90 backdrop-blur-sm" onClick={() => setZoom(prev => clampZoom(prev - 0.3))}>
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
                  <Button variant="outline" size="icon" className="h-7 w-7 bg-card/90 backdrop-blur-sm" onClick={resetView}>
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                )}
                {zoom !== 1 && (
                  <span className="bg-card/90 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] text-muted-foreground border border-border">
                    {Math.round(zoom * 100)}%
                  </span>
                )}
              </div>
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
          <span className="flex items-center gap-1.5">
            <ArrowRight className="h-3 w-3 text-primary/60" />
            Percurso
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
                      <p className="font-semibold text-sm flex items-center gap-1.5">
                        <span className={cn(
                          'w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center',
                          selectedPoint.visit.type === 'visita' ? 'bg-primary text-primary-foreground' : 'bg-violet-600 text-white',
                        )}>
                          {selectedPoint.index + 1}
                        </span>
                        {selectedPoint.partner?.name || selectedPoint.visit.partnerId}
                      </p>
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
                      {onCreateVisitFromSuggestion && (
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => {
                            const suggestedDate = getClosestVisitDate(selectedPoint.partner);
                            onCreateVisitFromSuggestion(selectedPoint.partner.id, suggestedDate);
                            onOpenChange(false);
                          }}
                        >
                          <CalendarPlus className="h-3 w-3" /> Criar compromisso
                        </Button>
                      )}
                    </div>
                    {(() => {
                      const closestDate = getClosestVisitDate(selectedPoint.partner);
                      return (
                        <p className="text-[10px] text-muted-foreground/70 italic">
                          Data sugerida: {format(parseISO(closestDate), 'dd/MM/yyyy')} (compromisso mais próximo)
                        </p>
                      );
                    })()}
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
