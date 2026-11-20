// Sample data of the contract detail page (TASK-12), with the exact shape of the API contract.
// SAMPLE: cut 2026-11, data as of 2026-11-07 (docs/design/pages/contract-detail/data.md).
// Two contracts are real (Pasto and Providencia); of the Bogotá one, the fields named in its comment.
// Everything under «Sample variants» is derived from them to show a state: it is not a real contract.
// No natural person is named anywhere: the API never sends their name or document (TASK-08).
import type { SignalLevel } from '../../../../components/ui/SignalItem/SignalItem';
import type { ContractDetail } from '../../domain/contract';

/** `fechaCorte` of the sample cut, as `/api/mapa/corte` gives it. */
export const SAMPLE_CUT_DATE = '2026-11-07';

/** Real contract: a company, SECOP II, the value went up and 273 days were added. */
export const pastoContract: ContractDetail = {
  cut: '2026-11',
  id: 'CO1.PCCNTR.7954915',
  source: 'secop_ii',
  sourceUrl:
    'https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=CO1.NTC.8249008&isFromPublicArea=True&isModal=true&asPopupView=true',
  description:
    'Aunar esfuerzos administrativos; técnicos y financieros entre el MUNICIPIO DE PASTO y JUNTA DE ACCIÓN COMUNAL DE LA VEREDA MOJONDINOY para la ejecución del mantenimiento rutinario de las vías rurales del Corregimiento de El Encano mediante el proyecto denominado camineros del municipio de Pasto. (SRC-0005-062)',
  type: 'Obra',
  isPublicWorks: true,
  procurementMethod: 'Contratación directa',
  methodJustification: 'Convenios Solidarios Regimen articulo 92 Ley 2166 de 2021',
  status: 'expired_unclosed',
  sourceStatus: 'Modificado',
  provisional: false,
  buyer: { name: 'ALCALDIA DE PASTO', taxId: '891280000' },
  supplier: { kind: 'company', name: 'JAC Mojondinoy', taxId: '800167184' },
  location: {
    municipality: { code: '52001', name: 'Pasto' },
    department: { code: '52', name: 'Nariño' },
  },
  dates: { signed: '2025-06-09', start: '2025-07-09', end: '2026-09-30', addedDays: 273 },
  amounts: {
    currentCents: 6781538313,
    initialCents: 5609556600,
    changePct: 0.2089,
    exceedsLegalAdditionLimit: false,
    reliable: true,
    paidCents: null,
  },
};

/**
 * Real contract, the typical case: a natural person, SECOP I, a long entity name, the same value as
 * when signed. `sourceStatus` and `isPublicWorks` are not shown by the page; they are sample values.
 */
export const providenciaContract: ContractDetail = {
  cut: '2026-11',
  id: '25-12-14382349-13325351',
  source: 'secop_i',
  sourceUrl:
    'https://www.contratos.gov.co/consultas/detalleProceso.do?numConstancia=25-12-14382349',
  description:
    'PRESTAR SUS SERVICIOS ASISTENCIALES CON PLENA AUTONOMiA E INDEPENDENCIA AL MUNICIPIO DE PROVIDENCIA Y SANTA CATALINA ISLAS EN EL aREA DONDE SEA DESIGNADO ACORDE A LAS OBLIGACIONES CONTRACTUALES Y/O NECESIDADES DEL ENTE TERRITORIAL.',
  type: 'Prestación de Servicios',
  isPublicWorks: false,
  procurementMethod: 'Contratación Directa (Ley 1150 de 2007)',
  methodJustification: 'Prestación de Servicios Profesionales y de Apoyo a la Gestión (Literal H)',
  status: 'expired_unclosed',
  sourceStatus: null,
  provisional: false,
  buyer: {
    name: 'SAN ANDRÉS; PROVIDENCIA Y SANTA CATALINA - ALCALDÍA MUNICIPIO DE PROVIDENCIA Y SANTA CATALINA',
    taxId: '8002224989',
  },
  supplier: { kind: 'natural_person' },
  location: {
    municipality: { code: '88564', name: 'Providencia' },
    department: {
      code: '88',
      name: 'Archipiélago de San Andrés, Providencia y Santa Catalina',
    },
  },
  dates: { signed: '2025-02-17', start: '2025-03-05', end: '2025-09-05', addedDays: null },
  amounts: {
    currentCents: 1092000000,
    initialCents: 1092000000,
    changePct: 0,
    exceedsLegalAdditionLimit: false,
    reliable: true,
    paidCents: null,
  },
};

/**
 * Value with a magnitude alert. Real: the id, the place, the type, the entity, the kind of supplier
 * and the two values (SECOP registers $ 2.185.208.667; it was signed for $ 1.464.677).
 * Sample variant: every other field (dates, method, object, status, link).
 */
export const unreliableValueContract: ContractDetail = {
  ...pastoContract,
  id: 'CO1.PCCNTR.2242576',
  sourceUrl: 'https://community.secop.gov.co/Public/Tendering/ContractNoticeManagement/Index',
  description:
    'Aunar esfuerzos administrativos; técnicos y financieros para el desarrollo de actividades de apoyo a la prestación de servicios de salud.',
  type: 'Decreto 092 de 2017',
  isPublicWorks: false,
  procurementMethod: 'Contratación régimen especial',
  methodJustification: null,
  buyer: {
    name: 'SUBRED INTEGRADA DE SERVICIOS DE SALUD NORTE E.S.E. (OFICIAL)',
    taxId: null,
  },
  supplier: { kind: 'natural_person' },
  location: {
    municipality: { code: '11001', name: 'Bogotá, D.C.' },
    department: { code: '11', name: 'Bogotá, D.C.' },
  },
  dates: { signed: '2021-03-01', start: '2021-03-01', end: '2021-12-31', addedDays: null },
  amounts: {
    currentCents: 218520866700,
    initialCents: 146467700,
    changePct: 1490.9389,
    exceedsLegalAdditionLimit: true,
    reliable: false,
    paidCents: null,
  },
};

// ---- Sample variants: derived from the real contracts above, one per state of the spec ----

/** Sample variant: signed days before the cut, so SECOP may not have loaded it completely. */
export const recentContract: ContractDetail = {
  ...providenciaContract,
  provisional: true,
  status: 'active',
  dates: { signed: '2026-10-28', start: '2026-11-03', end: '2027-04-30', addedDays: null },
};

/** Sample variant: the value went down. */
export const loweredValueContract: ContractDetail = {
  ...pastoContract,
  dates: { ...pastoContract.dates, end: '2025-12-31', addedDays: null },
  amounts: { ...pastoContract.amounts, currentCents: 4500000000, changePct: -0.1978 },
};

/** Sample variant: SECOP registers the contract with value $ 0. */
export const zeroValueContract: ContractDetail = {
  ...providenciaContract,
  amounts: { ...providenciaContract.amounts, currentCents: 0, initialCents: 0, changePct: null },
};

/** Sample variant: no value when signed. */
export const noInitialValueContract: ContractDetail = {
  ...providenciaContract,
  amounts: { ...providenciaContract.amounts, initialCents: null, changePct: null },
};

/** Sample variant: no value at all («Sin datos», never 0). */
export const noValueContract: ContractDetail = {
  ...providenciaContract,
  amounts: {
    ...providenciaContract.amounts,
    currentCents: null,
    initialCents: null,
    changePct: null,
    reliable: false,
  },
};

/** Sample variant: SECOP does not bring the supplier's document. */
export const unknownSupplierContract: ContractDetail = {
  ...providenciaContract,
  supplier: { kind: 'unknown' },
};

/** Sample variant: no object, no method justification, no entity NIT, no link to SECOP. */
export const noDescriptionContract: ContractDetail = {
  ...pastoContract,
  description: null,
  methodJustification: null,
  buyer: { ...pastoContract.buyer, taxId: null },
  sourceUrl: null,
};

/** Sample variant: the entity reported payments. */
export const paidContract: ContractDetail = {
  ...pastoContract,
  amounts: { ...pastoContract.amounts, paidCents: 3390769100 },
};

/** Sample variant: still running. */
export const activeContract: ContractDetail = {
  ...pastoContract,
  status: 'active',
  dates: { signed: '2026-06-09', start: '2026-07-09', end: '2027-09-30', addedDays: 273 },
};

/** Sample variant: finished and closed in SECOP. */
export const finishedContract: ContractDetail = {
  ...providenciaContract,
  status: 'finished',
};

/** Sample variant: a method the page does not recognise goes as SECOP writes it, without explanation. */
export const unknownMethodContract: ContractDetail = {
  ...pastoContract,
  procurementMethod: 'Asociación Público Privada',
  methodJustification: null,
};

/** Sample variant: SECOP does not bring the method, so the page has no «¿Cómo se eligió…?» band. */
export const noMethodContract: ContractDetail = {
  ...pastoContract,
  procurementMethod: null,
  methodJustification: null,
};

/** Sample variant: suspended, without an end date. */
export const suspendedContract: ContractDetail = {
  ...pastoContract,
  status: 'suspended',
  dates: { signed: '2026-06-09', start: '2026-07-09', end: null, addedDays: null },
};

/**
 * Sample variant, extreme lengths of the cut (data.md): an entity name of about 161 characters and
 * an object of 1,450. Both texts are composed from the real ones to reach those lengths, and the
 * supplier is a made-up company name in one unbroken word, to test how it wraps.
 */
export const extremeContract: ContractDetail = {
  ...pastoContract,
  type: 'Arrendamiento de inmuebles',
  procurementMethod: 'Selección Abreviada de Menor Cuantía (con ofertas)',
  buyer: {
    name: 'SAN ANDRÉS; PROVIDENCIA Y SANTA CATALINA - ALCALDÍA MUNICIPIO DE PROVIDENCIA Y SANTA CATALINA - SECRETARÍA DE INFRAESTRUCTURA; OBRAS PÚBLICAS Y SERVICIOS PÚBLICOS',
    taxId: '8002224989',
  },
  supplier: {
    kind: 'company',
    name: 'CONSORCIOMANTENIMIENTOVIASRURALESCORREGIMIENTOELENCANO2025-JUNTADEACCIONCOMUNALVEREDAMOJONDINOY',
    taxId: '800167184',
  },
  location: providenciaContract.location,
  description: Array(5).fill(pastoContract.description).join(' ').slice(0, 1450),
  amounts: {
    ...pastoContract.amounts,
    currentCents: 880_000_000_000_000,
    initialCents: 560_955_660_000_000,
    changePct: 0.5687,
    exceedsLegalAdditionLimit: true,
  },
};

/**
 * PREVIEW of TASK-13, only for Storybook: the API has no signals yet. The two approved examples;
 * their facts come from the real Pasto contract; the levels are examples to show the design, not a result of the methodology.
 */
export const previewSignals: { title: string; fact: string; level: SignalLevel }[] = [
  {
    title: 'Ya cuesta 20,9 % más de lo firmado',
    fact: 'Pasó de $ 56,1 a $ 67,8 millones.',
    level: 'high',
  },
  {
    title: 'Al plazo se le agregaron 273 días',
    fact: 'Terminaba el 31 dic 2025; ahora, el 30 sep 2026.',
    level: 'medium',
  },
];
