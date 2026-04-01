import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSystemData, SystemCategory, categoryLabels } from '@/hooks/useSystemData';
import { Plus, Package, AlertTriangle, XCircle, Store, Clock, FileCheck, FileText, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import InfoDataSection from './InfoDataSection';

const categoryIcons: Record<string, React.ElementType> = {
  products: Package,
  rescheduleReasons: AlertTriangle,
  cancelReasons: XCircle,
  storeStructures: Store,
  periods: Clock,
  registrationStatuses: FileCheck,
  registrationSolicitations: FileText,
  registrationHandlers: Users,
  inviteRejectionReasons: XCircle,
};

interface CategorySection {
  title: string;
  description: string;
  categories: SystemCategory[];
}

const sections: CategorySection[] = [
  {
    title: 'Agenda',
    description: 'Dados utilizados nos formulários e filtros da página Agenda.',
    categories: ['periods', 'rescheduleReasons', 'cancelReasons', 'inviteRejectionReasons'],
  },
  {
    title: 'Cadastro',
    description: 'Dados utilizados nos formulários e filtros da página Cadastro.',
    categories: ['registrationStatuses', 'registrationSolicitations', 'registrationHandlers'],
  },
  {
    title: 'Geral',
    description: 'Dados compartilhados entre diversas páginas do sistema.',
    categories: ['products', 'storeStructures'],
  },
];

const allCategories = sections.flatMap(s => s.categories);

export default function SystemDataTab() {
  const { getItems, addItem, toggleItem } = useSystemData();
  const { toast } = useToast();
  const [newValues, setNewValues] = useState<Record<string, string>>(
    () => Object.fromEntries(allCategories.map(c => [c, ''])) as Record<string, string>
  );

  const handleAdd = (category: SystemCategory) => {
    const val = (newValues[category] || '').trim();
    if (!val) return;
    const items = getItems(category);
    if (items.some(i => i.label.toLowerCase() === val.toLowerCase())) {
      toast({ title: 'Item já existe', description: `"${val}" já está cadastrado.`, variant: 'destructive' });
      return;
    }
    addItem(category, val);
    setNewValues(prev => ({ ...prev, [category]: '' }));
    toast({ title: 'Item adicionado', description: `"${val}" foi adicionado com sucesso.` });
  };

  const handleToggle = (category: SystemCategory, id: string, label: string, currentActive: boolean) => {
    toggleItem(category, id);
    toast({
      title: currentActive ? 'Item inativado' : 'Item ativado',
      description: `"${label}" foi ${currentActive ? 'inativado' : 'ativado'}.`,
    });
  };

  const renderCategory = (category: SystemCategory) => {
    const items = getItems(category);
    const Icon = categoryIcons[category] || Package;
    const activeCount = items.filter(i => i.active).length;

    return (
      <AccordionItem key={category} value={category} className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{categoryLabels[category]}</span>
            <Badge variant="secondary" className="text-xs">
              {activeCount}/{items.length}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Novo item..."
                value={newValues[category] || ''}
                onChange={e => setNewValues(prev => ({ ...prev, [category]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleAdd(category)}
                className="h-9"
              />
              <Button size="sm" onClick={() => handleAdd(category)} className="h-9 gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </Button>
            </div>
            <div className="space-y-1">
              {items.map(item => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center justify-between rounded-md px-3 py-2 transition-colors',
                    item.active ? 'bg-muted/50' : 'bg-muted/20 opacity-60'
                  )}
                >
                  <span className={cn('text-sm', !item.active && 'line-through text-muted-foreground')}>
                    {item.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{item.active ? 'Ativo' : 'Inativo'}</span>
                    <Switch
                      checked={item.active}
                      onCheckedChange={() => handleToggle(category, item.id, item.label, item.active)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <div className="space-y-8">
      {/* Informações Úteis section */}
      <InfoDataSection />

      {/* Grouped system data sections */}
      {sections.map(section => (
        <div key={section.title} className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{section.title}</h3>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </div>
          <Accordion type="multiple" className="space-y-2">
            {section.categories.map(renderCategory)}
          </Accordion>
        </div>
      ))}
    </div>
  );
}
