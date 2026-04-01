import Dexie, { type Table } from 'dexie';
import type { PdcaFile, Workstream, Action, ReleaseNote, Temperature } from '../types';

export class PdcaDatabase extends Dexie {
  files!: Table<PdcaFile, string>;
  workstreams!: Table<Workstream, number>;
  actions!: Table<Action, number>;
  release_notes!: Table<ReleaseNote, string>;
  temperatures!: Table<Temperature, string>;

  constructor() {
    super('pdca-bros2');
    this.version(1).stores({
      files: 'id, s3_key, is_dirty',
      workstreams: '++id, file_id, member_code, status',
      actions: '++id, workstream_id',
    });
    this.version(2).stores({
      files: 'id, s3_key, is_dirty',
      workstreams: '++id, file_id, member_code, accountable, status',
      actions: '++id, workstream_id',
      release_notes: 'id, version',
      temperatures: 'member_code',
    });
  }
}

export const db = new PdcaDatabase();
