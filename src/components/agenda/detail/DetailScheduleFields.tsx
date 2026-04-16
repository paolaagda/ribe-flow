import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Visit, VisitPeriod, VisitMedio } from '@/data/mock-data';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock, Check, X, DollarSign } from 'lucide-react';
import { formatCentavos, formatCurrencyInput, parseCurrencyToNumber } from '@/lib/currency';

interface DetailScheduleFieldsProps {
  visit: Visit;
  canEditFields: boolean;
  activePeriods: string[];
  onDateChange: (date: Date | undefined) => void;
  onPeriodChange: (period: string) => void;
  onMedioChange: (medio: string) => void;
  onTimeChange: (time: string) => void;
  onPotentialChange: (centavos: number | undefined) => void;
}

export default function DetailScheduleFields({
  visit, canEditFields, activePeriods,
  onDateChange, onPeriodChange, onMedioChange, onTimeChange, onPotentialChange,
}: DetailScheduleFieldsProps) {
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [timeDraft, setTimeDraft] = useState('');
  const [editingPotential, setEditingPotential] = useState(false);
  const [potentialDraft, setPotentialDraft] = useState('');

  const handleStartEditTime = () => {
    setTimeDraft(visit.time || '');
    setEditingTime(true);
  };

  const handleSaveTime = () => {
    onTimeChange(timeDraft.trim());
    setEditingTime(false);
  };

  const handleStartEditPotential = () => {
    setPotentialDraft(visit.potentialValue ? formatCentavos(visit.potentialValue) : '');
    setEditingPotential(true);
  };

  const handleSavePotential = () => {
    const centavos = parseCurrencyToNumber(potentialDraft);
    onPotentialChange(centavos || undefined);
    setEditingPotential(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
      setDatePopoverOpen(false);
    }
  };

  return (
    <>
      {/* Date / Period / Time / Medio */}
      <div className="px-5 py-2.5 flex items-center gap-2 flex-wrap">
        {/* Date */}
        {canEditFields ? (
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md px-1.5 py-0.5 hover:bg-muted/50">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>{format(parseISO(visit.date), "dd/MM/yyyy")}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={parseISO(visit.date)} onSelect={handleDateSelect} className="p-3 pointer-events-auto" locale={ptBR} />
            </PopoverContent>
          </Popover>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground px-1.5 py-0.5">
            <CalendarIcon className="h-3.5 w-3.5" />
            {format(parseISO(visit.date), "dd/MM/yyyy")}
          </span>
        )}

        <span className="text-muted-foreground/30">·</span>

        {/* Period */}
        {canEditFields ? (
          <Select value={visit.period} onValueChange={onPeriodChange}>
            <SelectTrigger className="h-6 w-auto min-w-0 gap-1 border-0 bg-transparent px-1.5 text-xs text-muted-foreground hover:text-foreground capitalize shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {activePeriods.map(p => (
                <SelectItem key={p} value={p.toLowerCase()} className="text-xs capitalize">{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-xs text-muted-foreground capitalize px-1.5">{visit.period}</span>
        )}

        <span className="text-muted-foreground/30">·</span>

        {/* Time */}
        {canEditFields && editingTime ? (
          <div className="flex items-center gap-1">
            <Input type="time" value={timeDraft} onChange={e => setTimeDraft(e.target.value)} className="h-6 w-24 text-xs px-1.5" autoFocus onKeyDown={e => { if (e.key === 'Enter') handleSaveTime(); if (e.key === 'Escape') setEditingTime(false); }} />
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleSaveTime}><Check className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setEditingTime(false)}><X className="h-3 w-3" /></Button>
          </div>
        ) : canEditFields ? (
          <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md px-1.5 py-0.5 hover:bg-muted/50" onClick={handleStartEditTime}>
            <Clock className="h-3 w-3" />
            {visit.time || 'Sem horário'}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground px-1.5 py-0.5">
            <Clock className="h-3 w-3" />
            {visit.time || 'Sem horário'}
          </span>
        )}

        <span className="text-muted-foreground/30">·</span>

        {/* Medio */}
        {canEditFields ? (
          <Select value={visit.medio} onValueChange={onMedioChange}>
            <SelectTrigger className="h-6 w-auto min-w-0 gap-1 border-0 bg-transparent px-1.5 text-xs text-muted-foreground hover:text-foreground capitalize shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="presencial" className="text-xs">Presencial</SelectItem>
              <SelectItem value="remoto" className="text-xs">Remoto</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <span className="text-xs text-muted-foreground capitalize px-1.5">{visit.medio}</span>
        )}
      </div>

      {/* Potential value */}
      <div className="px-5 pb-2.5 flex items-center gap-2">
        <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {canEditFields && editingPotential ? (
          <div className="flex items-center gap-1">
            <Input value={potentialDraft} onChange={e => setPotentialDraft(formatCurrencyInput(e.target.value))} className="h-7 w-36 text-xs" placeholder="R$ 0,00" autoFocus onKeyDown={e => { if (e.key === 'Enter') handleSavePotential(); if (e.key === 'Escape') setEditingPotential(false); }} />
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleSavePotential}><Check className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setEditingPotential(false)}><X className="h-3 w-3" /></Button>
          </div>
        ) : canEditFields ? (
          <button className="inline-flex items-center gap-1 hover:bg-muted/50 rounded-md px-1.5 py-0.5 transition-colors" onClick={handleStartEditPotential}>
            {visit.potentialValue ? (
              <Badge variant="outline" className={cn('text-xs font-semibold', visit.potentialValue >= 1000000 ? 'bg-warning/10 text-warning border-warning/20' : 'text-foreground')}>
                {formatCentavos(visit.potentialValue)}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground italic">Potencial não informado</span>
            )}
          </button>
        ) : (
          visit.potentialValue ? (
            <Badge variant="outline" className={cn('text-xs font-semibold', visit.potentialValue >= 1000000 ? 'bg-warning/10 text-warning border-warning/20' : 'text-foreground')}>
              {formatCentavos(visit.potentialValue)}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground italic">Potencial não informado</span>
          )
        )}
      </div>
    </>
  );
}
