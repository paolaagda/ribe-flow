import { Separator } from '@/components/ui/separator';

interface Props {
  title: string;
  description?: string;
}

export default function BlockSectionHeader({ title, description }: Props) {
  return (
    <div className="space-y-1.5 pt-2">
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 shrink-0">
          {title}
        </span>
        <Separator className="flex-1" />
      </div>
      {description && (
        <p className="text-[11px] text-muted-foreground/60 text-center">{description}</p>
      )}
    </div>
  );
}
