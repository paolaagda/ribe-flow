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
}

export default function AnimatedKpiCard({ icon: Icon, label, value, secondaryValue, color = 'text-primary', suffix, delay = 0, onClick, active }: AnimatedKpiCardProps) {
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className={cn('hover:shadow-md transition-shadow', onClick && 'cursor-pointer', active && 'ring-2 ring-primary')} onClick={onClick}>
        <CardContent className="p-4 flex items-center gap-3">
          <div className={cn('p-2 rounded-lg bg-muted', color)}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums leading-tight">
              {numericValue !== null ? displayValue : value}
              {secondaryValue !== undefined && (
                <span className="text-sm font-normal text-muted-foreground">/{secondaryValue}</span>
              )}
              {suffix && !secondaryValue && <span className="text-sm font-normal text-muted-foreground ml-0.5">{suffix}</span>}
            </p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
