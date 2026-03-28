import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { VisitComment, getUserById } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare, CheckSquare, Send, Reply, MessageCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  comments: VisitComment[];
  onAddComment: (text: string, type: 'observation' | 'task', parentId?: string) => void;
  onToggleTask: (commentId: string) => void;
}

export default function AgendaComments({ comments, onAddComment, onToggleTask }: Props) {
  const [text, setText] = useState('');
  const [commentType, setCommentType] = useState<'observation' | 'task'>('observation');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onAddComment(text.trim(), commentType, replyTo || undefined);
    setText('');
    setReplyTo(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const topLevel = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

  const renderComment = (comment: VisitComment, isReply = false) => {
    const author = getUserById(comment.userId);
    const initials = author?.name.split(' ').map(n => n[0]).join('').slice(0, 2) || '??';
    const replies = getReplies(comment.id);

    return (
      <div key={comment.id} className={cn('space-y-2', isReply && 'ml-8')}>
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'flex gap-2.5 p-2.5 rounded-lg border',
            comment.type === 'task' ? 'bg-primary/5 border-primary/15' : 'bg-muted/40 border-border',
          )}
        >
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium">{author?.name || 'Desconhecido'}</span>
              <span className="text-[10px] text-muted-foreground">
                {format(parseISO(comment.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
              </span>
              {comment.type === 'task' && (() => {
                const daysPending = !comment.taskCompleted
                  ? Math.floor((Date.now() - new Date(comment.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                  : 0;
                const isOverdue = daysPending >= 10;
                return (
                  <>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[9px] px-1.5 py-0',
                        comment.taskCompleted
                          ? 'bg-success/10 text-success border-success/20'
                          : isOverdue
                            ? 'bg-destructive/10 text-destructive border-destructive/20'
                            : 'bg-warning/10 text-warning border-warning/20',
                      )}
                    >
                      {comment.taskCompleted ? 'Concluída' : isOverdue ? 'Atrasada' : 'Aberta'}
                    </Badge>
                    {!comment.taskCompleted && daysPending > 0 && (
                      <span className={cn('text-[9px] flex items-center gap-0.5', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
                        <Clock className="h-2.5 w-2.5" /> há {daysPending}d
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="flex items-start gap-2">
              {comment.type === 'task' && (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="mt-0.5"
                >
                  <Checkbox
                    checked={comment.taskCompleted}
                    onCheckedChange={() => onToggleTask(comment.id)}
                    className="h-4 w-4"
                  />
                </motion.div>
              )}
              <p className={cn('text-sm', comment.type === 'task' && comment.taskCompleted && 'line-through text-muted-foreground')}>
                {comment.text}
              </p>
            </div>
            {!isReply && (
              <button
                onClick={() => {
                  setReplyTo(comment.id);
                  inputRef.current?.focus();
                }}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
              >
                <Reply className="h-3 w-3" /> Responder
              </button>
            )}
          </div>
        </motion.div>
        {replies.map(r => renderComment(r, true))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <MessageSquare className="h-3.5 w-3.5" />
        Comentários ({comments.length})
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum comentário ainda</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          <AnimatePresence>
            {topLevel.map(c => renderComment(c))}
          </AnimatePresence>
        </div>
      )}

      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
          <Reply className="h-3 w-3" />
          <span>Respondendo comentário</span>
          <button onClick={() => setReplyTo(null)} className="ml-auto text-destructive hover:underline">Cancelar</button>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2">
        <Select value={commentType} onValueChange={(v) => setCommentType(v as 'observation' | 'task')}>
          <SelectTrigger className="w-28 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="observation">
              <span className="flex items-center gap-1.5"><MessageSquare className="h-3 w-3" /> Nota</span>
            </SelectItem>
            <SelectItem value="task">
              <span className="flex items-center gap-1.5"><CheckSquare className="h-3 w-3" /> Tarefa</span>
            </SelectItem>
          </SelectContent>
        </Select>
        <Input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={commentType === 'task' ? 'Nova tarefa...' : 'Adicionar comentário...'}
          className="h-8 text-sm flex-1"
        />
        <Button size="sm" className="h-8 w-8 p-0" onClick={handleSubmit} disabled={!text.trim()}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
