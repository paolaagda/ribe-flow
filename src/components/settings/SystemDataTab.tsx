import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSystemData, SystemCategory, categoryLabels } from '@/hooks/useSystemData';
import { Plus, Landmark, Package, AlertTriangle, XCircle, Store, Clock, Building2, FileCheck, FileText, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import InfoDataSection from './InfoDataSection';

const categoryIcons: Record<SystemCategory, React.ElementType> = {
  banks: Landmark,
  products: Package,
  rescheduleReasons: AlertTriangle,
  cancelReasons: XCircle,
  storeStructures: Store,
  periods: Clock,
  registrationBanks: Building2,
  registrationStatuses: FileCheck,
  registrationSolicitations: FileText,
  registrationHandlers: Users,
  inviteRejectionReasons: XCircle,
};

const categories: SystemCategory[] = ['banks', 'products', 'rescheduleReasons', 'cancelReasons', 'storeStructures', 'periods', 'registrationBanks', 'registrationStatuses', 'registrationSolicitations', 'registrationHandlers', 'inviteRejectionReasons'];

export default function SystemDataTab() {
  const { getItems, addItem, toggleItem } = useSystemData();
  const { toast } = useToast();
  const [newValues, setNewValues] = useState<Record<SystemCategory, string>>(
    () => Object.fromEntries(categories.map(c => [c, ''])) as Record<SystemCategory, string>
  );

  const handleAdd = (category: SystemCategory) => {
    const val = newValues[category].trim();
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

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Dados do Sistema</h3>
        <p className="text-sm text-muted-foreground">Gerencie as listas utilizadas nos formulários do sistema. Itens inativos não aparecem para seleção, mas são preservados no histórico.</p>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {categories.map(category => {
          const items = getItems(category);
          const Icon = categoryIcons[category];
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
                  {/* Add new */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Novo item..."
                      value={newValues[category]}
                      onChange={e => setNewValues(prev => ({ ...prev, [category]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleAdd(category)}
                      className="h-9"
                    />
                    <Button size="sm" onClick={() => handleAdd(category)} className="h-9 gap-1.5">
                      <Plus className="h-3.5 w-3.5" /> Adicionar
                    </Button>
                  </div>

                  {/* Items list */}
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
        })}
      </Accordion>

      <div className="border-t pt-6 mt-6">
        <InfoDataSection />
      </div>
    </div>
  );
}
