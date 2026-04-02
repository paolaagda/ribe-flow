import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useInfoData, InfoBank } from '@/hooks/useInfoData';
import { FileText, Landmark, CheckCircle2, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function ProcessosCadastroTab() {
  const { getActiveBanks, getDocumentsForBank, getAllActiveDocuments, getOperationalFieldsForBank } = useInfoData();
  const [selectedBank, setSelectedBank] = useState<InfoBank | null>(null);
  const [showGeneral, setShowGeneral] = useState(false);

  const banks = getActiveBanks();
  const generalDocs = getAllActiveDocuments();

  return (
    <div className="space-y-ds-md">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-ds-sm">
        {/* General Documentation Card */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <Card
            className="cursor-pointer overflow-hidden group hover:shadow-lg transition-all duration-300 border-primary/30 bg-primary/5"
            onClick={() => setShowGeneral(true)}
          >
            <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 group-hover:from-primary/30 group-hover:to-accent/30 transition-all">
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="h-12 w-12 text-primary drop-shadow-sm" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-card/80 to-transparent" />
            </div>
            <div className="p-3 text-center">
              <p className="text-sm font-semibold text-foreground truncate">Documentação Geral</p>
              <Badge variant="secondary" className="text-[10px] mt-1">
                {generalDocs.length} docs
              </Badge>
            </div>
          </Card>
        </motion.div>

        {/* Bank Cards */}
        {banks.map((bank, i) => {
          const docs = getDocumentsForBank(bank.id);
          const ops = getOperationalFieldsForBank(bank.id);
          return (
            <motion.div
              key={bank.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="cursor-pointer overflow-hidden group hover:shadow-lg transition-all duration-300"
                onClick={() => setSelectedBank(bank)}
              >
                <div className="aspect-[4/3] flex items-center justify-center bg-muted/50 group-hover:bg-muted/80 transition-colors p-4">
                  {bank.imageUrl ? (
                    <img
                      src={bank.imageUrl}
                      alt={bank.name}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <Landmark className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div className="p-3 text-center">
                  <p className="text-sm font-medium text-foreground truncate">{bank.name}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {docs.length > 0 && (
                      <Badge variant="secondary" className="text-[10px]">
                        {docs.length} docs
                      </Badge>
                    )}
                    {ops.length > 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        {ops.length} campos
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Bank Detail Modal */}
      <Dialog open={!!selectedBank} onOpenChange={() => setSelectedBank(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              {selectedBank?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Documents section */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Documentos necessários
              </p>
              {selectedBank && getDocumentsForBank(selectedBank.id).length > 0 ? (
                <div className="space-y-1.5">
                  {getDocumentsForBank(selectedBank.id).map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="text-sm">{doc.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Nenhum documento vinculado.</p>
              )}
            </div>

            {/* Operational Fields section */}
            {selectedBank && getOperationalFieldsForBank(selectedBank.id).length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                    <Settings2 className="h-3.5 w-3.5" /> Informações Operacionais
                  </p>
                  <div className="space-y-1.5">
                    {getOperationalFieldsForBank(selectedBank.id).map(field => (
                      <div key={field.id} className="flex items-center gap-2 rounded-md bg-accent/50 px-3 py-2">
                        <Settings2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">{field.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* General Documentation Modal */}
      <Dialog open={showGeneral} onOpenChange={setShowGeneral}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Documentação Geral
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground font-medium">Todos os documentos ativos do sistema:</p>
            <div className="space-y-2">
              {generalDocs.map(doc => (
                <div key={doc.id} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-sm">{doc.name}</span>
                  {doc.bankIds.length > 0 && (
                    <Badge variant="outline" className="ml-auto text-[10px]">
                      {doc.bankIds.length} bancos
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
