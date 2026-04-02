import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useInfoData } from '@/hooks/useInfoData';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useVisits } from '@/hooks/useVisits';
import { FileCheck, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Props {
  partnerId: string;
}

export default function PartnerDocuments({ partnerId }: Props) {
  const { getActiveDocuments } = useInfoData();
  const documents = getActiveDocuments();
  const { visits, setVisits } = useVisits();

  const [checkedDocs, setCheckedDocs] = useLocalStorage<Record<string, string[]>>(
    'ribercred_partner_docs_v1',
    {}
  );

  const partnerChecked = checkedDocs[partnerId] || [];

  const toggleDoc = (docId: string) => {
    const isNowChecked = !partnerChecked.includes(docId);
    setCheckedDocs(prev => {
      const current = prev[partnerId] || [];
      const updated = current.includes(docId)
        ? current.filter(id => id !== docId)
        : [...current, docId];
      return { ...prev, [partnerId]: updated };
    });

    // Sync: auto-complete/uncomplete document tasks linked to this doc
    if (isNowChecked) {
      setVisits(prev => prev.map(v => {
        if (v.partnerId !== partnerId) return v;
        const hasMatch = v.comments.some(c => c.type === 'task' && c.taskCategory === 'document' && c.taskSourceId === docId && !c.taskCompleted);
        if (!hasMatch) return v;
        return {
          ...v,
          comments: v.comments.map(c =>
            c.type === 'task' && c.taskCategory === 'document' && c.taskSourceId === docId
              ? { ...c, taskCompleted: true }
              : c
          ),
        };
      }));
    }
  };

  if (documents.length === 0) return null;

  const completedCount = partnerChecked.filter(id => documents.some(d => d.id === id)).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Documentação
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            {completedCount}/{documents.length} recebidos
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {documents.map((doc, i) => {
          const isChecked = partnerChecked.includes(doc.id);
          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => toggleDoc(doc.id)}
              className={cn(
                'flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200 border',
                isChecked
                  ? 'bg-success/10 border-success/30'
                  : 'border-transparent hover:bg-muted/50'
              )}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => toggleDoc(doc.id)}
                onClick={e => e.stopPropagation()}
                className={cn(isChecked && 'border-success bg-success text-success-foreground')}
              />
              <span className={cn(
                'text-sm flex-1 transition-colors',
                isChecked ? 'text-success font-medium' : 'text-foreground'
              )}>
                {doc.name}
              </span>
              {isChecked && <FileCheck className="h-4 w-4 text-success" />}
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
