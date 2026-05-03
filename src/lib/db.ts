import Dexie, { type Table } from 'dexie';
import type { PdcaFile, Workstream, Action, ReleaseNote, Temperature, HelpArticle } from '../types';

export class PdcaDatabase extends Dexie {
  files!: Table<PdcaFile, string>;
  workstreams!: Table<Workstream, number>;
  actions!: Table<Action, number>;
  release_notes!: Table<ReleaseNote, string>;
  temperatures!: Table<Temperature, string>;
  help_articles!: Table<HelpArticle, number>;

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
    this.version(3).stores({
      files: 'id, s3_key, is_dirty',
      workstreams: '++id, file_id, member_code, accountable, status',
      actions: '++id, workstream_id',
      release_notes: 'id, version',
      temperatures: 'member_code',
      help_articles: '++id, category',
    });
  }
}

export const db = new PdcaDatabase();
