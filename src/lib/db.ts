import Dexie, { type Table } from 'dexie';
import type { PdcaFile, Workstream, Action } from '../types';

export class PdcaDatabase extends Dexie {
  files!: Table<PdcaFile, string>;
  workstreams!: Table<Workstream, number>;
  actions!: Table<Action, number>;

  constructor() {
    super('pdca-bros2');
    this.version(1).stores({
      files: 'id, s3_key, is_dirty',
      workstreams: '++id, file_id, member_code, status',
      actions: '++id, workstream_id',
    });
  }
}

export const db = new PdcaDatabase();
