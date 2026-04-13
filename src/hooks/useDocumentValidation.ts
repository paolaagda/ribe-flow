import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';

export type DocValidationStatus = 'pending' | 'in_validation' | 'validated' | 'rejected';

export interface DocValidationEntry {
  status: DocValidationStatus;
  rejectionReason?: string;
  rejectedBy?: string;
  validatedBy?: string;
  updatedAt: string;
}

type ValidationStore = Record<string, Record<string, DocValidationEntry>>;

export function useDocumentValidation() {
  const { user } = useAuth();
  const [store, setStore] = useLocalStorage<ValidationStore>('ribercred_partner_doc_validation_v1', {});

  // Migration: read old checkedDocs and merge as 'validated' on first use
  const [oldCheckedDocs] = useLocalStorage<Record<string, string[]>>('ribercred_partner_docs_v1', {});

  const resolvedStore = useMemo(() => {
    const merged: ValidationStore = { ...store };
    // Migrate old data: any doc in old store that isn't in new store gets 'validated'
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

  const submitForValidation = useCallback((partnerId: string, docId: string) => {
    setStore(prev => ({
      ...prev,
      [partnerId]: {
        ...(prev[partnerId] || {}),
        [docId]: {
          status: 'in_validation' as const,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  }, [setStore]);

  const validateDoc = useCallback((partnerId: string, docId: string) => {
    setStore(prev => ({
      ...prev,
      [partnerId]: {
        ...(prev[partnerId] || {}),
        [docId]: {
          status: 'validated' as const,
          validatedBy: user?.id,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  }, [setStore, user]);

  const rejectDoc = useCallback((partnerId: string, docId: string, reason: string) => {
    setStore(prev => ({
      ...prev,
      [partnerId]: {
        ...(prev[partnerId] || {}),
        [docId]: {
          status: 'rejected' as const,
          rejectionReason: reason,
          rejectedBy: user?.id,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  }, [setStore, user]);

  const revokeValidation = useCallback((partnerId: string, docId: string, reason: string) => {
    setStore(prev => ({
      ...prev,
      [partnerId]: {
        ...(prev[partnerId] || {}),
        [docId]: {
          status: 'rejected' as const,
          rejectionReason: reason,
          rejectedBy: user?.id,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  }, [setStore, user]);

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
