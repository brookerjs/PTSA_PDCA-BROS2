import { db } from './db';
import type { PdcaFile, Workstream, Action, ParsedWorkstream, ReleaseNote } from '../types';

export async function upsertFile(file: PdcaFile): Promise<void> {
  await db.files.put(file);
}

export async function upsertWorkstreamsForFile(
  fileId: string,
  memberCode: string,
  parsed: ParsedWorkstream[]
): Promise<void> {
  await db.transaction('rw', db.workstreams, db.actions, async () => {
    // Get existing workstream IDs for this file to clean up actions
    const existing = await db.workstreams.where('file_id').equals(fileId).toArray();
    const existingIds = existing.map((w) => w.id!).filter(Boolean);

    // Delete old actions for these workstreams
    if (existingIds.length > 0) {
      await db.actions.where('workstream_id').anyOf(existingIds).delete();
    }

    // Delete old workstreams
    await db.workstreams.where('file_id').equals(fileId).delete();

    // Insert new workstreams and their actions
    for (const ws of parsed) {
      const wsId = await db.workstreams.add({
        file_id: fileId,
        ws_number: ws.ws_number,
        title: ws.title,
        lead: '',
        member_code: memberCode,
        accountable: 'BROS2',
        status: ws.status,
        echeance: '',
        comment: '',
        phase_p: ws.phase_p,
        phase_d: ws.phase_d,
        phase_c: ws.phase_c,
        phase_a: ws.phase_a,
        lien_ga: ws.lien_ga,
        dependances: ws.dependances,
        note_politique: ws.note_politique,
      });

      for (const action of ws.actions) {
        await db.actions.add({
          workstream_id: wsId,
          text: action.text,
          responsible: action.responsible,
          echeance: action.echeance,
          label: action.label,
        });
      }
    }
  });
}

export async function getAllWorkstreams(): Promise<(Workstream & { actions: Action[] })[]> {
  const workstreams = await db.workstreams.toArray();
  const result: (Workstream & { actions: Action[] })[] = [];

  for (const ws of workstreams) {
    const actions = ws.id
      ? await db.actions.where('workstream_id').equals(ws.id).toArray()
      : [];
    result.push({ ...ws, actions });
  }

  return result;
}

export async function getWorkstreamsByFile(
  fileId: string
): Promise<(Workstream & { actions: Action[] })[]> {
  const workstreams = await db.workstreams.where('file_id').equals(fileId).toArray();
  const result: (Workstream & { actions: Action[] })[] = [];

  for (const ws of workstreams) {
    const actions = ws.id
      ? await db.actions.where('workstream_id').equals(ws.id).toArray()
      : [];
    result.push({ ...ws, actions });
  }

  return result;
}

export async function updateWorkstream(
  wsId: number,
  updates: Partial<Workstream>
): Promise<void> {
  await db.workstreams.update(wsId, updates);
}

export async function replaceActionsForWorkstream(
  wsId: number,
  actions: Action[]
): Promise<void> {
  await db.transaction('rw', db.actions, async () => {
    await db.actions.where('workstream_id').equals(wsId).delete();
    for (const action of actions) {
      await db.actions.add({ ...action, workstream_id: wsId });
    }
  });
}

export async function markFileDirty(fileId: string): Promise<void> {
  await db.files.update(fileId, {
    is_dirty: 1,
    last_edited_at: new Date().toISOString(),
  });
}

export async function markFileClean(fileId: string): Promise<void> {
  await db.files.update(fileId, {
    is_dirty: 0,
    last_synced_at: new Date().toISOString(),
  });
}

export async function getDirtyFiles(): Promise<PdcaFile[]> {
  return db.files.where('is_dirty').equals(1).toArray();
}

export async function getFile(fileId: string): Promise<PdcaFile | undefined> {
  return db.files.get(fileId);
}

export async function getAllFiles(): Promise<PdcaFile[]> {
  return db.files.toArray();
}

// === Temperature operations ===

export async function getTemperature(memberCode: string): Promise<string> {
  const temp = await db.temperatures.get(memberCode);
  return temp?.value ?? '';
}

export async function setTemperature(memberCode: string, value: string): Promise<void> {
  await db.temperatures.put({ member_code: memberCode, value });
}

// === Release notes operations ===

export async function upsertReleaseNote(note: ReleaseNote): Promise<void> {
  await db.release_notes.put(note);
}

export async function getAllReleaseNotes(): Promise<ReleaseNote[]> {
  return db.release_notes.toArray();
}
