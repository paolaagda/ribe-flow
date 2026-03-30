import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { AuditLogEntry, AuditModule, AuditAction, mockAuditLogs } from '@/data/audit-log';

export function useAuditLog() {
  const [logs, setLogs] = useLocalStorage<AuditLogEntry[]>('ribercred_audit_logs_v1', mockAuditLogs);
  const { user } = useAuth();

  const addLog = useCallback((entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'userId' | 'userName'>) => {
    const newLog: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: user?.id || 'u1',
      userName: user?.name || 'Usuário',
    };
    setLogs(prev => [newLog, ...prev]);
    return newLog;
  }, [setLogs, user]);

  const getLogsForEntity = useCallback((entityId: string) => {
    return logs.filter(l => l.entityId === entityId);
  }, [logs]);

  const getLogsForModule = useCallback((module: AuditModule) => {
    return logs.filter(l => l.module === module);
  }, [logs]);

  const getLogsForUser = useCallback((userId: string) => {
    return logs.filter(l => l.userId === userId);
  }, [logs]);

  return { logs, addLog, getLogsForEntity, getLogsForModule, getLogsForUser };
}
