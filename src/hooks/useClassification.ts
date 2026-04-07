import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PartnerClass, Partner } from '@/data/mock-data';

export interface ClassificationRuleRanges {
  A: { min: number };
  B: { min: number; max: number };
  C: { min: number; max: number };
  D: { max: number };
}

export interface ClassificationRule {
  id: string;
  effectiveFrom: string;
  createdBy: string;
  ranges: ClassificationRuleRanges;
}

export interface ClassChangeRecord {
  id: string;
  partnerId: string;
  previousClass: PartnerClass;
  newClass: PartnerClass;
  reason: 'rule_change' | 'production_update';
  changedAt: string;
  ruleId?: string;
}

const DEFAULT_RULE: ClassificationRule = {
  id: 'rule-initial',
  effectiveFrom: '2025-01-01T00:00:00.000Z',
  createdBy: 'system',
  ranges: {
    A: { min: 7500000 },
    B: { min: 5000000, max: 7499999 },
    C: { min: 2500000, max: 4999999 },
    D: { max: 2499999 },
  },
};

export function classifyPartner(production: number | undefined | null, ranges: ClassificationRuleRanges): PartnerClass {
  const value = production || 0;
  if (value >= ranges.A.min) return 'A';
  if (value >= ranges.B.min) return 'B';
  if (value >= ranges.C.min) return 'C';
  return 'D';
}

export interface RuleValidationError {
  field: string;
  message: string;
}

export function validateRanges(ranges: ClassificationRuleRanges): RuleValidationError[] {
  const errors: RuleValidationError[] = [];

  if (ranges.A.min <= 0) errors.push({ field: 'A.min', message: 'Limite de A deve ser maior que zero' });
  if (ranges.B.min <= 0) errors.push({ field: 'B.min', message: 'Limite inferior de B deve ser maior que zero' });
  if (ranges.C.min <= 0) errors.push({ field: 'C.min', message: 'Limite inferior de C deve ser maior que zero' });

  // Contiguity: B.max = A.min - 1, C.max = B.min - 1, D.max = C.min - 1
  if (ranges.B.max !== ranges.A.min - 1) errors.push({ field: 'B.max', message: 'Teto de B deve ser contíguo ao piso de A' });
  if (ranges.C.max !== ranges.B.min - 1) errors.push({ field: 'C.max', message: 'Teto de C deve ser contíguo ao piso de B' });
  if (ranges.D.max !== ranges.C.min - 1) errors.push({ field: 'D.max', message: 'Teto de D deve ser contíguo ao piso de C' });

  // Order
  if (ranges.B.min >= ranges.A.min) errors.push({ field: 'B.min', message: 'Piso de B deve ser menor que piso de A' });
  if (ranges.C.min >= ranges.B.min) errors.push({ field: 'C.min', message: 'Piso de C deve ser menor que piso de B' });

  return errors;
}

/** Build contiguous ranges from 3 thresholds (all in centavos) */
export function buildRangesFromThresholds(aMin: number, bMin: number, cMin: number): ClassificationRuleRanges {
  return {
    A: { min: aMin },
    B: { min: bMin, max: aMin - 1 },
    C: { min: cMin, max: bMin - 1 },
    D: { max: cMin - 1 },
  };
}

export function useClassification() {
  const [rules, setRules] = useLocalStorage<ClassificationRule[]>('ribercred_classification_rules_v1', [DEFAULT_RULE]);
  const [classChanges, setClassChanges] = useLocalStorage<ClassChangeRecord[]>('ribercred_class_changes_v1', []);

  const activeRule = rules[0] || DEFAULT_RULE;

  const saveNewRule = (
    ranges: ClassificationRuleRanges,
    createdBy: string,
    partners: Partner[],
    setPartners: (p: Partner[]) => void,
  ) => {
    const errors = validateRanges(ranges);
    if (errors.length > 0) return { success: false, errors };

    const newRule: ClassificationRule = {
      id: `rule-${Date.now()}`,
      effectiveFrom: new Date().toISOString(),
      createdBy,
      ranges,
    };

    const newRules = [newRule, ...rules];
    setRules(newRules);

    // Reclassify
    const changes: ClassChangeRecord[] = [];
    const updatedPartners = partners.map(p => {
      const newClass = classifyPartner(p.averageProduction, ranges);
      if (newClass !== p.partnerClass) {
        changes.push({
          id: `cc-${Date.now()}-${p.id}`,
          partnerId: p.id,
          previousClass: p.partnerClass,
          newClass,
          reason: 'rule_change',
          changedAt: newRule.effectiveFrom,
          ruleId: newRule.id,
        });
        return { ...p, partnerClass: newClass };
      }
      return p;
    });

    if (changes.length > 0) {
      setPartners(updatedPartners);
      setClassChanges(prev => [...changes, ...prev]);
    }

    return { success: true, errors: [], changesCount: changes.length };
  };

  const updatePartnerProduction = (
    partner: Partner,
    newProduction: number,
    partners: Partner[],
    setPartners: (p: Partner[]) => void,
  ) => {
    const newClass = classifyPartner(newProduction, activeRule.ranges);
    const changes: ClassChangeRecord[] = [];

    if (newClass !== partner.partnerClass) {
      changes.push({
        id: `cc-${Date.now()}-${partner.id}`,
        partnerId: partner.id,
        previousClass: partner.partnerClass,
        newClass,
        reason: 'production_update',
        changedAt: new Date().toISOString(),
      });
      setClassChanges(prev => [...changes, ...prev]);
    }

    const updatedPartners = partners.map(p =>
      p.id === partner.id ? { ...p, averageProduction: newProduction, partnerClass: newClass } : p,
    );
    setPartners(updatedPartners);
  };

  const getClassChangesForPartner = (partnerId: string) =>
    classChanges.filter(c => c.partnerId === partnerId);

  return {
    rules,
    activeRule,
    classChanges,
    saveNewRule,
    updatePartnerProduction,
    getClassChangesForPartner,
    classifyPartner,
  };
}
