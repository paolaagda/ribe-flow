import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface DetailListEditorProps {
  icon: LucideIcon;
  label: string;
  items: string[];
  availableItems: { key: string; label: string }[];
  emptyText: string;
  allAddedText: string;
  popoverWidth?: string;
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
}

export default function DetailListEditor({
  icon: Icon, label, items, availableItems, emptyText, allAddedText,
  popoverWidth = 'w-48', onAdd, onRemove,
}: DetailListEditorProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleAdd = (item: string) => {
    onAdd(item);
    setPopoverOpen(false);
  };

  return (
    <div className="px-5 pb-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-5 w-5 rounded-full border-dashed border-muted-foreground/40 text-muted-foreground hover:text-foreground">
              <Plus className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className={`${popoverWidth} p-1.5 max-h-52 overflow-y-auto`} align="end">
            {availableItems.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">{allAddedText}</p>
            ) : (
              availableItems.map(item => (
                <button
                  key={item.key}
                  className="flex items-center w-full px-2 py-1.5 text-xs rounded-md hover:bg-accent text-left transition-colors"
                  onClick={() => handleAdd(item.key)}
                >
                  {item.label}
                </button>
              ))
            )}
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 ? (
          <span className="text-xs text-muted-foreground italic">{emptyText}</span>
        ) : (
          items.map(item => (
            <Badge
              key={item}
              variant="secondary"
              className="text-xs gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors group px-2 py-0.5"
              onClick={() => onRemove(item)}
            >
              {item}
              <X className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}
