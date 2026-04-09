import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedKpiCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  secondaryValue?: number | string;
  color?: string;
  suffix?: string;
  delay?: number;
  onClick?: () => void;
  active?: boolean;
  pulse?: boolean;
  progressPercent?: number | null;
}

export default function AnimatedKpiCard({ icon: Icon, label, value, secondaryValue, color = 'text-primary', suffix, delay = 0, onClick, active, pulse, progressPercent }: AnimatedKpiCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : null;

  useEffect(() => {
    if (numericValue === null) return;
    const duration = 800;
    const steps = 30;
    const increment = numericValue / steps;
    let current = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
          setDisplayValue(numericValue);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [numericValue, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="h-full"
    >
      <Card
        className={cn(
          'h-full border-border/50 overflow-hidden relative group',
          onClick ? 'card-interactive cursor-pointer' : 'card-flat',
          active && 'ring-2 ring-primary/30 border-primary/20 card-glow',
        )}
        onClick={onClick}
      >
        {/* Subtle gradient overlay on hover */}
        <div className={cn(
          'absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none',
          onClick && 'group-hover:opacity-100',
        )} style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.03) 0%, transparent 60%)' }} />
        
        <CardContent className="h-full p-3 sm:p-4 flex flex-col items-center justify-center gap-1 relative">
          {/* Icon */}
          <div className={cn(
            'icon-container-sm relative transition-transform duration-300 shrink-0',
            onClick && 'group-hover:scale-105',
            active ? 'icon-container-primary' : '',
            color
          )}>
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {pulse && (
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive animate-pulse ring-2 ring-card" />
            )}
          </div>
          {/* Label + Value */}
          <p className="text-[10px] sm:text-[11px] font-semibold text-foreground tracking-wide uppercase leading-tight text-center w-full" title={label}>{label}</p>
          <p className="text-lg sm:text-xl font-bold tabular-nums leading-none tracking-tight text-muted-foreground whitespace-nowrap">
            {numericValue !== null ? displayValue : value}
            {secondaryValue !== undefined && (
              <span className="text-xs font-normal text-muted-foreground/70 ml-0.5">/ {secondaryValue}</span>
            )}
            {suffix && !secondaryValue && <span className="text-[10px] font-normal text-muted-foreground/70 ml-0.5">{suffix}</span>}
          </p>
          {/* Progress */}
          {progressPercent != null && (
            <div className="w-full flex flex-col gap-0.5 mt-1">
              <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700 ease-out',
                    progressPercent >= 100 ? 'bg-success' : progressPercent >= 60 ? 'bg-primary' : 'bg-warning',
                  )}
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
              </div>
              <span className={cn(
                'text-[9px] font-semibold tabular-nums text-center',
                progressPercent >= 100 ? 'text-success' : progressPercent >= 60 ? 'text-primary' : 'text-warning',
              )}>
                {progressPercent}%
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
