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
}

export default function AnimatedKpiCard({ icon: Icon, label, value, secondaryValue, color = 'text-primary', suffix, delay = 0, onClick, active, pulse }: AnimatedKpiCardProps) {
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
          'transition-all duration-300 h-full border-border/60',
          onClick && 'cursor-pointer hover:-translate-y-0.5',
          active && 'ring-2 ring-primary shadow-[var(--shadow-glow)]',
          !active && 'hover:shadow-[var(--shadow-md)]'
        )}
        onClick={onClick}
      >
        <CardContent className="p-3.5 sm:p-4 flex items-center gap-3 h-full min-h-[76px]">
          <div className={cn(
            'p-2.5 rounded-xl bg-gradient-to-br from-muted to-muted/60 shrink-0 relative transition-transform duration-300',
            onClick && 'group-hover:scale-105',
            color
          )}>
            <Icon className="h-4.5 w-4.5" style={{ width: '18px', height: '18px' }} />
            {pulse && (
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive animate-pulse ring-2 ring-card" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xl sm:text-2xl font-bold tabular-nums leading-tight truncate tracking-tight">
              {numericValue !== null ? displayValue : value}
              {secondaryValue !== undefined && (
                <span className="text-xs sm:text-sm font-normal text-muted-foreground">/{secondaryValue}</span>
              )}
              {suffix && !secondaryValue && <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-0.5">{suffix}</span>}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
