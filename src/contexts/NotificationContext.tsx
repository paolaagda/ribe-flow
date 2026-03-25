import React, { createContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getRandomMessage } from '@/data/notification-messages';
import { mockUsers, mockPartners } from '@/data/mock-data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export type NotificationType = 'invite' | 'accept' | 'reject' | 'remove' | 'update';
export type InviteStatus = 'pending' | 'accepted' | 'rejected';

export interface AppNotification {
  id: string;
  type: NotificationType;
  visitId: string;
  fromUserId: string;
  toUserId: string;
  partnerId: string;
  partnerName: string;
  date: string;
  time: string;
  read: boolean;
  status: InviteStatus;
  createdAt: string;
  message: string;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  pendingInvites: AppNotification[];
  recentNotifications: AppNotification[];
  history: AppNotification[];
  addNotification: (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => AppNotification;
  acceptInvite: (notifId: string) => void;
  rejectInvite: (notifId: string) => void;
  markAsRead: (notifId: string) => void;
  markAllAsRead: () => void;
  clearHistory: () => void;
  ensureInitialized: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

function loadFromStorage(): AppNotification[] {
  try {
    const raw = localStorage.getItem('ribercred_notifications');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function generateMockNotifications(userId: string): AppNotification[] {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const today = format(now, 'yyyy-MM-dd');
  const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');

  const gestorUser = mockUsers.find(u => u.role === 'gestor');
  const gerenteUser = mockUsers.find(u => u.role === 'gerente');
  if (!gestorUser || !gerenteUser) return [];

  const p1 = mockPartners[0];
  const p2 = mockPartners[1];
  const p3 = mockPartners[2];

  return [
    {
      id: 'notif-1', type: 'invite', visitId: 'v1',
      fromUserId: gestorUser.id, toUserId: userId,
      partnerId: p1.id, partnerName: p1.name,
      date: tomorrowStr, time: '10:00',
      read: false, status: 'pending',
      createdAt: new Date(now.getTime() - 30 * 60000).toISOString(),
      message: getRandomMessage('invite_detail', { parceiro: p1.name, nome: gestorUser.name, data: format(tomorrow, "dd 'de' MMMM", { locale: ptBR }), hora: '10:00' }),
    },
    {
      id: 'notif-2', type: 'invite', visitId: 'v2',
      fromUserId: gerenteUser.id, toUserId: userId,
      partnerId: p2.id, partnerName: p2.name,
      date: today, time: '14:30',
      read: false, status: 'pending',
      createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      message: getRandomMessage('invite_detail', { parceiro: p2.name, nome: gerenteUser.name, data: 'hoje', hora: '14:30' }),
    },
    {
      id: 'notif-3', type: 'invite', visitId: 'v3',
      fromUserId: gestorUser.id, toUserId: userId,
      partnerId: p3.id, partnerName: p3.name,
      date: format(new Date(now.getTime() + 3 * 86400000), 'yyyy-MM-dd'), time: '09:00',
      read: true, status: 'accepted',
      createdAt: new Date(now.getTime() - 24 * 3600000).toISOString(),
      message: getRandomMessage('invite_detail', { parceiro: p3.name, nome: gestorUser.name, data: format(new Date(now.getTime() + 3 * 86400000), "dd 'de' MMMM", { locale: ptBR }), hora: '09:00' }),
    },
    {
      id: 'notif-4', type: 'invite', visitId: 'v4',
      fromUserId: gerenteUser.id, toUserId: userId,
      partnerId: p1.id, partnerName: p1.name,
      date: format(new Date(now.getTime() - 2 * 86400000), 'yyyy-MM-dd'), time: '11:00',
      read: true, status: 'rejected',
      createdAt: new Date(now.getTime() - 48 * 3600000).toISOString(),
      message: getRandomMessage('invite_detail', { parceiro: p1.name, nome: gerenteUser.name, data: format(new Date(now.getTime() - 2 * 86400000), "dd 'de' MMMM", { locale: ptBR }), hora: '11:00' }),
    },
  ];
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [allNotifications, setAllNotifications] = useState<AppNotification[]>(loadFromStorage);
  const initializedRef = useRef(false);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('ribercred_notifications', JSON.stringify(allNotifications));
  }, [allNotifications]);

  const notifications = useMemo(() => {
    if (!user) return [];
    return allNotifications.filter(n => n.toUserId === user.id);
  }, [allNotifications, user]);

  const ensureInitialized = useCallback(() => {
    if (initializedRef.current) return;
    if (allNotifications.length === 0 && user?.role === 'comercial') {
      const mocks = generateMockNotifications(user.id);
      setAllNotifications(mocks);
    }
    initializedRef.current = true;
  }, [allNotifications.length, user]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const pendingInvites = useMemo(() => notifications.filter(n => n.type === 'invite' && n.status === 'pending'), [notifications]);
  const recentNotifications = useMemo(() =>
    notifications
      .filter(n => n.type !== 'invite' || n.status !== 'pending')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20),
    [notifications]
  );
  const history = useMemo(() =>
    notifications
      .filter(n => n.read)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notifications]
  );

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setAllNotifications(prev => [newNotif, ...prev]);

    // Auto toast
    toast({
      title: '🔔 Nova notificação',
      description: notif.message.slice(0, 100),
    });

    return newNotif;
  }, [toast]);

  const acceptInvite = useCallback((notifId: string) => {
    setAllNotifications(prev => prev.map(n =>
      n.id === notifId ? { ...n, status: 'accepted' as InviteStatus, read: true } : n
    ));
  }, []);

  const rejectInvite = useCallback((notifId: string) => {
    setAllNotifications(prev => prev.map(n =>
      n.id === notifId ? { ...n, status: 'rejected' as InviteStatus, read: true } : n
    ));
  }, []);

  const markAsRead = useCallback((notifId: string) => {
    setAllNotifications(prev => prev.map(n =>
      n.id === notifId ? { ...n, read: true } : n
    ));
  }, []);

  const markAllAsRead = useCallback(() => {
    if (!user) return;
    setAllNotifications(prev => prev.map(n =>
      n.toUserId === user.id ? { ...n, read: true } : n
    ));
  }, [user]);

  const clearHistory = useCallback(() => {
    if (!user) return;
    setAllNotifications(prev => prev.filter(n =>
      n.toUserId !== user.id || (n.type === 'invite' && n.status === 'pending')
    ));
  }, [user]);

  const value = useMemo<NotificationContextValue>(() => ({
    notifications, unreadCount, pendingInvites, recentNotifications, history,
    addNotification, acceptInvite, rejectInvite, markAsRead, markAllAsRead, clearHistory, ensureInitialized,
  }), [notifications, unreadCount, pendingInvites, recentNotifications, history,
    addNotification, acceptInvite, rejectInvite, markAsRead, markAllAsRead, clearHistory, ensureInitialized]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const ctx = React.useContext(NotificationContext);
  if (!ctx) throw new Error('useNotificationContext must be used within NotificationProvider');
  return ctx;
}
