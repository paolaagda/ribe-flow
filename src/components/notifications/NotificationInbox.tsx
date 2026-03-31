import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useToast } from '@/hooks/use-toast';
import { getRandomMessage } from '@/data/notification-messages';
import InviteCard from './InviteCard';
import InviteRejectionModal from '@/components/agenda/InviteRejectionModal';
import { cn } from '@/lib/utils';
import { getEmptyStateMessage } from '@/data/notification-messages';

const NotificationInbox = React.forwardRef<HTMLDivElement>(function NotificationInbox(_props, ref) {
  const {
    pendingInvites,
    recentNotifications,
    history,
    unreadCount,
    acceptInvite,
    rejectInvite,
    markAllAsRead,
    clearHistory,
    ensureInitialized,
  } = useNotifications();
  const { toast } = useToast();

  const prevCountRef = useRef(unreadCount);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    ensureInitialized();
  }, [ensureInitialized]);

  // Bounce badge when count increases
  const badgeRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (unreadCount > prevCountRef.current && badgeRef.current) {
      badgeRef.current.classList.remove('badge-bounce');
      void badgeRef.current.offsetWidth; // force reflow
      badgeRef.current.classList.add('badge-bounce');
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  const handleAccept = (id: string) => {
    acceptInvite(id);
    toast({
      title: getRandomMessage('accept'),
      description: getRandomMessage('toast_invite'),
    });
  };

  const handleReject = (id: string) => {
    setRejectingId(id);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = (reason: string) => {
    if (rejectingId) {
      rejectInvite(rejectingId, reason);
      toast({ title: getRandomMessage('reject'), description: `Motivo: ${reason}` });
    }
    setRejectModalOpen(false);
    setRejectingId(null);
  };

  return (
    <>
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              ref={badgeRef}
              className={cn(
                'absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center',
              )}
            >
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0 overflow-hidden flex flex-col" align="end" sideOffset={8} style={{ maxHeight: 'min(70vh, 520px)' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={markAllAsRead}>
              <CheckCheck className="h-3 w-3" />
              Marcar tudo como lido
            </Button>
          )}
        </div>

        <Tabs defaultValue="invites" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-center rounded-none border-b bg-transparent h-9">
            <TabsTrigger value="invites" className="flex-1 text-xs data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Convites {pendingInvites.length > 0 && `(${pendingInvites.length})`}
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex-1 text-xs data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Recentes
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 text-xs data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invites" className="mt-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full" style={{ maxHeight: 'calc(min(70vh, 520px) - 100px)' }}>
              {pendingInvites.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">{getEmptyStateMessage()}</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {pendingInvites.map(n => (
                    <InviteCard
                      key={n.id}
                      notification={n}
                      onAccept={handleAccept}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="recent" className="mt-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full" style={{ maxHeight: 'calc(min(70vh, 520px) - 100px)' }}>
              {recentNotifications.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">Nenhuma notificação recente</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {recentNotifications.map(n => (
                    <InviteCard
                      key={n.id}
                      notification={n}
                      onAccept={handleAccept}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="mt-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full" style={{ maxHeight: 'calc(min(70vh, 520px) - 100px)' }}>
              {history.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">Histórico limpo</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {history.map(n => (
                    <InviteCard
                      key={n.id}
                      notification={n}
                      onAccept={handleAccept}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
            {history.length > 0 && (
              <div className="px-3 py-2 border-t border-border">
                <Button variant="ghost" size="sm" className="w-full h-7 text-xs gap-1 text-muted-foreground" onClick={clearHistory}>
                  <Trash2 className="h-3 w-3" />
                  Limpar histórico
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
    <InviteRejectionModal
      open={rejectModalOpen}
      onOpenChange={setRejectModalOpen}
      onConfirm={handleConfirmReject}
    />
    </>
  );
});
NotificationInbox.displayName = 'NotificationInbox';

export default NotificationInbox;
