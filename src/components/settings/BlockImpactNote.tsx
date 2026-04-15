import { cn } from '@/lib/utils';

interface Props {
  items: string[];
  className?: string;
}

export default function BlockImpactNote({ items, className }: Props) {
  return (
    <div className={cn('flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground/70 mt-1', className)}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
          {item}
        </span>
      ))}
    </div>
  );
}
