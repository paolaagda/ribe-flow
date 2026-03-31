import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInfoData, InfoUserProcess } from '@/hooks/useInfoData';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, Keyboard, FileText, Database, ListOrdered, Plus, X, Pencil, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ProcessosUsuariosTab() {
  const { getUserProcesses, updateUserProcess } = useInfoData();
  const { toast } = useToast();
  const [selected, setSelected] = useState<InfoUserProcess | null>(null);
  const [editing, setEditing] = useState(false);
  const [editDocs, setEditDocs] = useState<string[]>([]);
  const [editData, setEditData] = useState<string[]>([]);
  const [editSteps, setEditSteps] = useState<string[]>([]);
  const [newDoc, setNewDoc] = useState('');
  const [newData, setNewData] = useState('');
  const [newStep, setNewStep] = useState('');

  const processes = getUserProcesses();
  const icons: Record<string, React.ElementType> = { aprovador: UserCheck, digitador: Keyboard };

  const openDetail = (p: InfoUserProcess) => {
    setSelected(p);
    setEditing(false);
  };

  const startEdit = () => {
    if (!selected) return;
    setEditDocs([...selected.documents]);
    setEditData([...selected.data]);
    setEditSteps([...selected.steps]);
    setEditing(true);
  };

  const saveEdit = () => {
    if (!selected) return;
    updateUserProcess(selected.id, { documents: editDocs, data: editData, steps: editSteps });
    setSelected({ ...selected, documents: editDocs, data: editData, steps: editSteps });
    setEditing(false);
    toast({ title: 'Processo atualizado', description: `"${selected.title}" salvo com sucesso.` });
  };

  const addToList = (list: string[], setList: (v: string[]) => void, val: string, setVal: (v: string) => void) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    setList([...list, trimmed]);
    setVal('');
  };

  const removeFromList = (list: string[], setList: (v: string[]) => void, idx: number) => {
    setList(list.filter((_, i) => i !== idx));
  };

  const EditableList = ({ title, icon: Icon, items, setItems, newVal, setNewVal }: {
    title: string; icon: React.ElementType; items: string[]; setItems: (v: string[]) => void; newVal: string; setNewVal: (v: string) => void;
  }) => (
    <div className="space-y-2">
      <p className="text-sm font-medium flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /> {title}</p>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-1.5">
            <span className="text-sm flex-1">{item}</span>
            <button onClick={() => removeFromList(items, setItems, i)} className="text-muted-foreground hover:text-destructive">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={newVal} onChange={e => setNewVal(e.target.value)} placeholder="Adicionar..." className="h-8 text-sm"
          onKeyDown={e => e.key === 'Enter' && addToList(items, setItems, newVal, setNewVal)} />
        <Button size="sm" variant="outline" className="h-8" onClick={() => addToList(items, setItems, newVal, setNewVal)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-ds-md">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-ds-sm">
        {processes.filter(p => p.active).map((process, i) => {
          const Icon = icons[process.type] || UserCheck;
          return (
            <motion.div
              key={process.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="cursor-pointer overflow-hidden group hover:shadow-lg transition-all duration-300"
                onClick={() => openDetail(process)}
              >
                <div className="aspect-[4/3] flex items-center justify-center bg-muted/50 group-hover:bg-muted/80 transition-colors">
                  <Icon className="h-12 w-12 text-primary/70" />
                </div>
                <div className="p-3 text-center">
                  <p className="text-sm font-medium">{process.title}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setEditing(false); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                {selected && icons[selected.type] ? (() => { const I = icons[selected.type]; return <I className="h-5 w-5 text-primary" />; })() : null}
                {selected?.title}
              </DialogTitle>
              {!editing && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={startEdit}>
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
              )}
            </div>
          </DialogHeader>

          {selected && !editing && (
            <div className="space-y-4">
              <Section title="Documentos necessários" icon={FileText} items={selected.documents} />
              <Section title="Dados necessários" icon={Database} items={selected.data} />
              <Section title="Passo a passo" icon={ListOrdered} items={selected.steps} numbered />
            </div>
          )}

          {selected && editing && (
            <div className="space-y-4">
              <EditableList title="Documentos" icon={FileText} items={editDocs} setItems={setEditDocs} newVal={newDoc} setNewVal={setNewDoc} />
              <EditableList title="Dados" icon={Database} items={editData} setItems={setEditData} newVal={newData} setNewVal={setNewData} />
              <EditableList title="Passo a passo" icon={ListOrdered} items={editSteps} setItems={setEditSteps} newVal={newStep} setNewVal={setNewStep} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
                <Button onClick={saveEdit} className="gap-1.5"><Save className="h-3.5 w-3.5" /> Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ title, icon: Icon, items, numbered }: { title: string; icon: React.ElementType; items: string[]; numbered?: boolean }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /> {title}</p>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
            {numbered && <span className="text-xs font-bold text-primary w-5">{i + 1}.</span>}
            <span className="text-sm">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
