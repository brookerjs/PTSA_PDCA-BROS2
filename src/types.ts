// === Status types ===

export type WorkstreamStatus = 'ok' | 'att' | 'blk';
export type ActionLabel = 'todo' | 'inprogress' | 'waiting' | 'done';

// === Status mapping constants ===

export const STATUS_MAP: Record<string, WorkstreamStatus> = {
  'en controle': 'ok',
  'en contrôle': 'ok',
  'attention requise': 'att',
  'a clarifier': 'att',
  'à clarifier': 'att',
  'bloque': 'blk',
  'bloqué': 'blk',
  'a risque': 'blk',
  'à risque': 'blk',
};

export const REVERSE_STATUS_MAP: Record<WorkstreamStatus, string> = {
  ok: 'En controle',
  att: 'Attention requise',
  blk: 'Bloque',
};

export const ACTION_LABEL_MAP: Record<string, ActionLabel> = {
  'a faire': 'todo',
  'à faire': 'todo',
  'a planifier': 'todo',
  'à planifier': 'todo',
  'en cours': 'inprogress',
  'en attente': 'waiting',
  'complete': 'done',
  'completé': 'done',
  'complété': 'done',
  'completée': 'done',
  'complétée': 'done',
};

export const REVERSE_ACTION_LABEL_MAP: Record<ActionLabel, string> = {
  todo: 'A faire',
  inprogress: 'En cours',
  waiting: 'En attente',
  done: 'Complete',
};

// === Pastille display ===

export const PASTILLE_COLORS: Record<WorkstreamStatus, string> = {
  ok: '#4caf50',
  att: '#ff9800',
  blk: '#e53935',
};

export const PASTILLE_LABELS: Record<WorkstreamStatus, string> = {
  ok: 'En controle',
  att: 'Attention requise',
  blk: 'Bloque',
};

export const ACTION_BADGE_COLORS: Record<ActionLabel, string> = {
  todo: '#ff9800',
  inprogress: '#0055A5',
  waiting: '#9e9e9e',
  done: '#4caf50',
};

// === Data model interfaces ===

export interface PdcaFile {
  id: string;
  s3_key: string;
  raw_markdown: string;
  last_synced_at: string | null;
  last_edited_at: string | null;
  is_dirty: number; // 0 | 1
}

export interface Workstream {
  id?: number;
  file_id: string;
  ws_number: number;
  title: string;
  lead: string;
  member_code: string;
  status: WorkstreamStatus;
  echeance: string;
  comment: string;
  phase_p: string | null;
  phase_d: string | null;
  phase_c: string | null;
  phase_a: string | null;
  lien_ga: string | null;
  dependances: string | null;
  note_politique: string | null;
}

export interface Action {
  id?: number;
  workstream_id?: number;
  text: string;
  responsible: string;
  echeance: string;
  label: ActionLabel;
}

export interface TeamMember {
  code: string;
  name: string;
  role: string;
  temperature: string;
}

// === Parsed file types ===

export interface IndividualPdcaData {
  file_id: string;
  member_code: string;
  member_name: string;
  role: string;
  global_status: WorkstreamStatus;
  last_updated: string;
  role_context: string | null;
  temperature: string | null;
  temperature_status: string | null;
  workstreams: ParsedWorkstream[];
}

export interface ParsedWorkstream {
  ws_number: number;
  title: string;
  status: WorkstreamStatus;
  phase_p: string | null;
  phase_d: string | null;
  phase_c: string | null;
  phase_a: string | null;
  lien_ga: string | null;
  dependances: string | null;
  note_politique: string | null;
  actions: Action[];
}

export interface RegisterData {
  file_id: string;
  last_updated: string;
  team: TeamMember[];
  workstreams: RegisterWorkstream[];
}

export interface RegisterWorkstream {
  ws_number: number;
  title: string;
  lead: string;
  member_code: string;
  status: WorkstreamStatus;
  echeance: string;
  comment: string;
}

// === Sync types ===

export interface S3Config {
  bucket: string;
  prefix: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface SyncResult {
  pulled: number;
  skipped: number;
  conflicts: string[];
  errors: string[];
}

export interface PushResult {
  pushed: number;
  errors: string[];
}

export type SyncState = 'offline' | 'clean' | 'dirty' | 'syncing';
