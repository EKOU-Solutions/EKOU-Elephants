// Contract detail (TASK-12): docs/design/pages/contract-detail/contract.md.

export type ContractSource = 'secop_i' | 'secop_ii';

export type ContractStatus =
  | 'not_started'
  | 'active'
  | 'suspended'
  | 'finished'
  /** The end date has passed and the entity has not closed the contract in SECOP. */
  | 'expired_unclosed';

/**
 * Who signed with the entity. Only a company is identified: a natural person has no name, no
 * document and no pseudonym (TASK-08).
 */
export type Supplier =
  | { kind: 'company'; name: string; taxId: string | null }
  | { kind: 'natural_person' }
  /** SECOP does not bring the supplier's document. */
  | { kind: 'unknown' };

export interface Place {
  /** DIVIPOLA code, with its leading zero. */
  code: string;
  name: string;
}

/** A contract as the pipeline publishes it. Missing data is null, never 0. */
export interface ContractRecord {
  /** The SECOP contract id, untouched: "CO1.PCCNTR.7954915". */
  id: string;
  source: ContractSource;
  /** The process record in SECOP. */
  sourceUrl: string | null;
  /** What the contract is for, as SECOP brings it. */
  description: string | null;
  type: string | null;
  isPublicWorks: boolean;
  procurementMethod: string | null;
  methodJustification: string | null;
  status: ContractStatus;
  /** The status as SECOP writes it. */
  sourceStatus: string | null;
  /** Signed recently: SECOP may not have loaded it completely yet. */
  provisional: boolean;
  buyer: { name: string; taxId: string | null };
  supplier: Supplier;
  location: { municipality: Place; department: Place };
  dates: {
    /** ISO dates. */
    signed: string;
    start: string | null;
    /** Current end date, with extensions. */
    end: string | null;
    /** Null when no added days are reported. */
    addedDays: number | null;
  };
  amounts: {
    /** Current value, with additions, in cents of a peso. */
    currentCents: number | null;
    /** Value when signed. */
    initialCents: number | null;
    /** 0.21 = 21 % more than when signed; negative if it went down; null if it cannot be computed. */
    changePct: number | null;
    /** It went up more than 50 % (Ley 80, art. 40). */
    exceedsLegalAdditionLimit: boolean;
    /** False: the value has a magnitude alert and must not be read as certain. */
    reliable: boolean;
    /** Null = payment not reported. Never 0 by default. */
    paidCents: number | null;
  };
}

export interface ContractDetail extends ContractRecord {
  /** Monthly cut the data belongs to, "AAAA-MM". */
  cut: string;
}

/** SECOP II ("CO1.PCCNTR.7954915") or SECOP I ("25-12-14382349-13325351"). */
export const CONTRACT_ID = /^(CO\d{1,3}\.PCCNTR\.\d{1,12}|\d{1,12}(-\d{1,12}){3})$/;

export class ContractNotFound extends Error {
  constructor(readonly id: string) {
    super(`Contract not found: ${id}`);
    this.name = 'ContractNotFound';
  }
}

/** A published contract file is unreadable or fails its schema. */
export class ContractDataUnavailable extends Error {
  constructor(reason: string) {
    super(`Contract data unavailable: ${reason}`);
    this.name = 'ContractDataUnavailable';
  }
}
