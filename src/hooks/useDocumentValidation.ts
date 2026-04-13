import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationContextSafe } from '@/contexts/NotificationContext';
import { mockUsers, mockPartners } from '@/data/mock-data';
import { getRandomMessage } from '@/data/notification-messages';
import { useInfoData } from '@/hooks/useInfoData';

export type DocValidationStatus = 'pending' | 'in_validation' | 'validated' | 'rejected';

export interface DocValidationEntry {
  status: DocValidationStatus;
  rejectionReason?: string;
  rejectedBy?: string;
  validatedBy?: string;
  submittedBy?: string;
  updatedAt: string;
}

type ValidationStore = Record<string, Record<string, DocValidationEntry>>;

export function useDocumentValidation() {
  const { user } = useAuth();
  const { addNotification } = useNotificationContextSafe();
  const [store, setStore] = useLocalStorage<ValidationStore>('ribercred_partner_doc_validation_v1', {});
  const { getActiveDocuments } = useInfoData();

  // Migration: read old checkedDocs and merge as 'validated' on first use
  const [oldCheckedDocs] = useLocalStorage<Record<string, string[]>>('ribercred_partner_docs_v1', {});

  const resolvedStore = useMemo(() => {
    const merged: ValidationStore = { ...store };
    Object.entries(oldCheckedDocs).forEach(([partnerId, docIds]) => {
      if (!merged[partnerId]) merged[partnerId] = {};
      docIds.forEach(docId => {
        if (!merged[partnerId][docId]) {
          merged[partnerId][docId] = {
            status: 'validated',
            updatedAt: new Date().toISOString(),
          };
        }
      });
    });
    return merged;
  }, [store, oldCheckedDocs]);

  const getDocStatus = useCallback((partnerId: string, docId: string): DocValidationEntry => {
    return resolvedStore[partnerId]?.[docId] || { status: 'pending', updatedAt: '' };
  }, [resolvedStore]);

  const getDocsForPartner = useCallback((partnerId: string): Record<string, DocValidationEntry> => {
    return resolvedStore[partnerId] || {};
  }, [resolvedStore]);

  // Helper to get doc name by id
  const getDocName = useCallback((docId: string): string => {
    const docs = getActiveDocuments();
    return docs.find(d => d.id === docId)?.name || docId;
  }, [getActiveDocuments]);

  // Helper to notify all Cadastro users
  const notifyCadastroUsers = useCallback((partnerId: string, docId: string) => {
    const partner = mockPartners.find(p => p.id === partnerId);
    const cadastroUsers = mockUsers.filter(u => u.role === 'cadastro' && u.active);
    const docName = getDocName(docId);
    const today = new Date().toISOString().split('T')[0];

    cadastroUsers.forEach(cadastroUser => {
      addNotification({
        type: 'doc_validation_submitted',
        visitId: '',
        fromUserId: user?.id || '',
        toUserId: cadastroUser.id,
        partnerId,
        partnerName: partner?.name || '',
        date: today,
        time: '',
        status: 'pending',
        message: getRandomMessage('doc_validation_submitted', {
          parceiro: partner?.name || '',
          nome: user?.name || '',
          documento: docName,
        }),
        docName,
      });
    });
  }, [addNotification, user, getDocName]);

  // Helper to notify submitter on rejection
  const notifySubmitterRejection = useCallback((partnerId: string, docId: string, reason: string, submittedBy?: string) => {
    if (!submittedBy) return;
    const partner = mockPartners.find(p => p.id === partnerId);
    const docName = getDocName(docId);
    const today = new Date().toISOString().split('T')[0];

    addNotification({
      type: 'doc_validation_rejected',
      visitId: '',
      fromUserId: user?.id || '',
      toUserId: submittedBy,
      partnerId,
      partnerName: partner?.name || '',
      date: today,
      time: '',
      status: 'pending',
      message: getRandomMessage('doc_validation_rejected', {
        parceiro: partner?.name || '',
        documento: docName,
        motivo: reason,
      }),
      docName,
      rejectionReason: reason,
    });
  }, [addNotification, user, getDocName]);

  const submitForValidation = useCallback((partnerId: string, docId: string) => {
    setStore(prev => ({
      ...prev,
      [partnerId]: {
        ...(prev[partnerId] || {}),
        [docId]: {
          status: 'in_validation' as const,
          submittedBy: user?.id,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    // Notify Cadastro users — single dispatch from domain hook
    notifyCadastroUsers(partnerId, docId);
  }, [setStore, user, notifyCadastroUsers]);

  const validateDoc = useCallback((partnerId: string, docId: string) => {
    setStore(prev => ({
      ...prev,
      [partnerId]: {
        ...(prev[partnerId] || {}),
        [docId]: {
          status: 'validated' as const,
          validatedBy: user?.id,
          submittedBy: prev[partnerId]?.[docId]?.submittedBy,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    // No notification on approval per requirements
  }, [setStore, user]);

  const rejectDoc = useCallback((partnerId: string, docId: string, reason: string) => {
    const entry = resolvedStore[partnerId]?.[docId];
    setStore(prev => ({
      ...prev,
      [partnerId]: {
        ...(prev[partnerId] || {}),
        [docId]: {
          status: 'rejected' as const,
          rejectionReason: reason,
          rejectedBy: user?.id,
          submittedBy: prev[partnerId]?.[docId]?.submittedBy,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    // Notify the Comercial who submitted — single dispatch
    notifySubmitterRejection(partnerId, docId, reason, entry?.submittedBy);
  }, [setStore, user, resolvedStore, notifySubmitterRejection]);

  const revokeValidation = useCallback((partnerId: string, docId: string, reason: string) => {
    const entry = resolvedStore[partnerId]?.[docId];
    setStore(prev => ({
      ...prev,
      [partnerId]: {
        ...(prev[partnerId] || {}),
        [docId]: {
          status: 'rejected' as const,
          rejectionReason: reason,
          rejectedBy: user?.id,
          submittedBy: prev[partnerId]?.[docId]?.submittedBy,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    // Notify the Comercial who submitted — single dispatch
    notifySubmitterRejection(partnerId, docId, reason, entry?.submittedBy);
  }, [setStore, user, resolvedStore, notifySubmitterRejection]);

  const resetToPending = useCallback((partnerId: string, docId: string) => {
    setStore(prev => ({
      ...prev,
      [partnerId]: {
        ...(prev[partnerId] || {}),
        [docId]: {
          status: 'pending' as const,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  }, [setStore]);

  const getValidatedCount = useCallback((partnerId: string, docIds: string[]): number => {
    const partnerDocs = resolvedStore[partnerId] || {};
    return docIds.filter(id => partnerDocs[id]?.status === 'validated').length;
  }, [resolvedStore]);

  const getPendingValidationCount = useCallback((partnerId: string, docIds: string[]): number => {
    const partnerDocs = resolvedStore[partnerId] || {};
    return docIds.filter(id => {
      const status = partnerDocs[id]?.status || 'pending';
      return status !== 'validated';
    }).length;
  }, [resolvedStore]);

  return {
    getDocStatus,
    getDocsForPartner,
    submitForValidation,
    validateDoc,
    rejectDoc,
    revokeValidation,
    resetToPending,
    getValidatedCount,
    getPendingValidationCount,
  };
}
