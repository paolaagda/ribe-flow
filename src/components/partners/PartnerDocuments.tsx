import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useInfoData } from '@/hooks/useInfoData';
import { useDocumentValidation, DocValidationStatus } from '@/hooks/useDocumentValidation';
import { useAuth } from '@/contexts/AuthContext';
import { useVisits } from '@/hooks/useVisits';
import { useTasks } from '@/hooks/useTasks';
import { usePartners } from '@/hooks/usePartners';
import DocumentRejectModal from './DocumentRejectModal';
import { FileText, FileCheck, Clock, XCircle, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Props {
  partnerId: string;
}

const statusConfig: Record<DocValidationStatus, { label: string; color: string; icon: React.ElementType; bgClass: string; borderClass: string }> = {
  pending: { label: 'Pendente', color: 'text-muted-foreground', icon: FileText, bgClass: '', borderClass: 'border-transparent' },
  in_validation: { label: 'Em validação', color: 'text-warning', icon: Clock, bgClass: 'bg-warning/10', borderClass: 'border-warning/30' },
  validated: { label: 'Validado', color: 'text-success', icon: CheckCircle2, bgClass: 'bg-success/10', borderClass: 'border-success/30' },
  rejected: { label: 'Devolvido', color: 'text-destructive', icon: XCircle, bgClass: 'bg-destructive/5', borderClass: 'border-destructive/30' },
};

export default function PartnerDocuments({ partnerId }: Props) {
  const { getActiveDocuments } = useInfoData();
  const documents = getActiveDocuments();
  const { getDocStatus, validateDoc, rejectDoc, revokeValidation } = useDocumentValidation();
  const { returnTaskForCorrection, markTaskValidated, createDocPendingTask } = useTasks();
  const { visits } = useVisits();
  const { getPartnerById } = usePartners();
  const { user } = useAuth();

  const [rejectModal, setRejectModal] = useState<{ open: boolean; docId: string; docName: string }>({ open: false, docId: '', docName: '' });

  const isCadastro = user && ['cadastro', 'diretor', 'gerente'].includes(user.role);

  // Find the task linked to a document for syncing
  const findDocTask = (docId: string) => {
    for (const visit of visits) {
      if (visit.partnerId !== partnerId) continue;
      const comment = visit.comments.find(c => c.type === 'task' && c.taskCategory === 'document' && c.taskSourceId === docId);
      if (comment) return { visitId: visit.id, commentId: comment.id };
    }
    return null;
  };

  const handleApprove = (docId: string) => {
    validateDoc(partnerId, docId);
    // Sync task to validated
    const taskRef = findDocTask(docId);
    if (taskRef) markTaskValidated(taskRef.visitId, taskRef.commentId);
  };

  const handleReject = (docId: string, reason: string) => {
    rejectDoc(partnerId, docId, reason);
    // Sync existing task back to returned
    const taskRef = findDocTask(docId);
    if (taskRef) {
      returnTaskForCorrection(taskRef.visitId, taskRef.commentId, reason);
    } else {
      // No existing task — auto-create pending doc task for Comercial
      const partner = getPartnerById(partnerId);
      const docName = documents.find(d => d.id === docId)?.name || docId;
      if (partner) {
        createDocPendingTask(partnerId, docId, docName, reason, partner.responsibleUserId);
      }
    }
  };

  const handleRevoke = (docId: string, reason: string) => {
    revokeValidation(partnerId, docId, reason);
    // Sync existing task back to returned
    const taskRef = findDocTask(docId);
    if (taskRef) {
      returnTaskForCorrection(taskRef.visitId, taskRef.commentId, reason);
    } else {
      // No existing task — auto-create pending doc task for Comercial
      const partner = getPartnerById(partnerId);
      const docName = documents.find(d => d.id === docId)?.name || docId;
      if (partner) {
        createDocPendingTask(partnerId, docId, docName, reason, partner.responsibleUserId);
      }
    }
  };

  if (documents.length === 0) return null;

  const validatedCount = documents.filter(d => getDocStatus(partnerId, d.id).status === 'validated').length;
  const inValidationCount = documents.filter(d => getDocStatus(partnerId, d.id).status === 'in_validation').length;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Documentação
            <div className="ml-auto flex items-center gap-2">
              {inValidationCount > 0 && (
                <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/20">
                  {inValidationCount} em validação
                </Badge>
              )}
              <span className="text-xs font-normal text-muted-foreground">
                {validatedCount}/{documents.length} validados
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {documents.map((doc, i) => {
            const entry = getDocStatus(partnerId, doc.id);
            const config = statusConfig[entry.status];
            const StatusIcon = config.icon;

            // Cadastro can validate any non-validated doc directly
            const canApprove = isCadastro && ['pending', 'in_validation', 'rejected'].includes(entry.status);
            // Cadastro can reject in_validation or pending docs
            const canReject = isCadastro && ['pending', 'in_validation', 'rejected'].includes(entry.status);
            // Cadastro can revoke validated docs
            const canRevoke = isCadastro && entry.status === 'validated';

            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 border',
                  config.bgClass,
                  config.borderClass,
                  entry.status === 'pending' && 'hover:bg-muted/50'
                )}
              >
                <StatusIcon className={cn('h-4 w-4 shrink-0', config.color)} />
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    'text-sm transition-colors block',
                    entry.status === 'validated' ? 'text-success font-medium' : 'text-foreground'
                  )}>
                    {doc.name}
                  </span>

                  {/* Rejection reason visible to all */}
                  {entry.status === 'rejected' && entry.rejectionReason && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                      <span className="text-xs text-destructive font-medium">
                        {entry.rejectionReason}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status badge */}
                <Badge
                  variant="outline"
                  className={cn('text-[9px] px-1.5 py-0 shrink-0', config.color, config.borderClass)}
                >
                  {config.label}
                </Badge>

                {/* Cadastro actions: approve/reject for non-validated docs */}
                {(canApprove || canReject) && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-success hover:text-success hover:bg-success/10"
                          onClick={() => handleApprove(doc.id)}
                        >
                          <FileCheck className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Validar documento</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setRejectModal({ open: true, docId: doc.id, docName: doc.name })}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Devolver documento</TooltipContent>
                    </Tooltip>
                  </div>
                )}

                {/* Cadastro can revoke validated docs */}
                {canRevoke && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setRejectModal({ open: true, docId: doc.id, docName: doc.name })}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Revogar validação</TooltipContent>
                  </Tooltip>
                )}
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      <DocumentRejectModal
        open={rejectModal.open}
        onOpenChange={(open) => setRejectModal(prev => ({ ...prev, open }))}
        docName={rejectModal.docName}
        onConfirm={(reason) => {
          const entry = getDocStatus(partnerId, rejectModal.docId);
          if (entry.status === 'validated') {
            handleRevoke(rejectModal.docId, reason);
          } else {
            handleReject(rejectModal.docId, reason);
          }
        }}
      />
    </>
  );
}
