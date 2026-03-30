import { db } from './db';
import * as s3 from './s3Service';
import * as dbService from './dbService';
import { parseIndividualPdca, parseRegister } from './markdownParser';
import { serializeIndividualPdca } from './markdownSerializer';
import type { S3Config, SyncResult, PushResult, PdcaFile } from '../types';

function fileIdFromKey(key: string): string {
  // "BROS2-Team-Ops/TEAM-OPS-PDCA-BARA2.md" → "TEAM-OPS-PDCA-BARA2"
  const filename = key.split('/').pop() ?? key;
  return filename.replace(/\.md$/, '');
}

function isRegisterFile(fileId: string): boolean {
  return fileId.toLowerCase().includes('register');
}

// === Pull: S3 → local ===

export async function pullFromS3(config: S3Config): Promise<SyncResult> {
  const result: SyncResult = { pulled: 0, skipped: 0, conflicts: [], errors: [] };

  let remoteFiles: s3.S3FileEntry[];
  try {
    remoteFiles = await s3.listFiles(config);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur de connexion S3';
    result.errors.push(msg);
    return result;
  }

  for (const remote of remoteFiles) {
    try {
      const fileId = fileIdFromKey(remote.key);
      const localFile = await dbService.getFile(fileId);

      // Conflict: local is dirty and S3 has content
      if (localFile?.is_dirty === 1) {
        result.conflicts.push(fileId);
        result.skipped++;
        continue;
      }

      // Download and parse
      const markdown = await s3.getFileContent(config, remote.key);

      const file: PdcaFile = {
        id: fileId,
        s3_key: remote.key,
        raw_markdown: markdown,
        last_synced_at: new Date().toISOString(),
        last_edited_at: localFile?.last_edited_at ?? null,
        is_dirty: 0,
      };
      await dbService.upsertFile(file);

      // Parse and store structured data
      if (isRegisterFile(fileId)) {
        // Register data is accessed via re-parsing raw_markdown when needed
        parseRegister(markdown); // validate it parses cleanly
      } else {
        const parsed = parseIndividualPdca(markdown);
        await dbService.upsertWorkstreamsForFile(fileId, parsed.member_code, parsed.workstreams);
      }

      result.pulled++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de parsing';
      result.errors.push(`${remote.key}: ${msg}`);
    }
  }

  // Clean up local entries for files no longer in the filtered S3 listing
  const remoteFileIds = new Set(remoteFiles.map((f) => fileIdFromKey(f.key)));
  const localFiles = await dbService.getAllFiles();
  for (const local of localFiles) {
    if (!remoteFileIds.has(local.id) && local.is_dirty !== 1) {
      // Remove orphaned workstreams/actions, then the file record
      const orphanedWs = await db.workstreams.where('file_id').equals(local.id).toArray();
      const orphanedWsIds = orphanedWs.map((w) => w.id!).filter(Boolean);
      if (orphanedWsIds.length > 0) {
        await db.actions.where('workstream_id').anyOf(orphanedWsIds).delete();
      }
      await db.workstreams.where('file_id').equals(local.id).delete();
      await db.files.delete(local.id);
    }
  }

  return result;
}

// === Push: local → S3 ===

export async function pushToS3(config: S3Config): Promise<PushResult> {
  const result: PushResult = { pushed: 0, errors: [] };

  const dirtyFiles = await dbService.getDirtyFiles();

  for (const file of dirtyFiles) {
    try {
      if (isRegisterFile(file.id)) {
        // Register file: push raw_markdown as-is for now
        await s3.putFileContent(config, file.s3_key, file.raw_markdown);
      } else {
        // Individual PDCA file: rebuild from structured data
        const workstreams = await dbService.getWorkstreamsByFile(file.id);
        const original = parseIndividualPdca(file.raw_markdown);

        // Update workstreams from DB state
        const updatedWorkstreams = workstreams.map((ws) => ({
          ws_number: ws.ws_number,
          title: ws.title,
          status: ws.status,
          phase_p: ws.phase_p,
          phase_d: ws.phase_d,
          phase_c: ws.phase_c,
          phase_a: ws.phase_a,
          lien_ga: ws.lien_ga,
          dependances: ws.dependances,
          note_politique: ws.note_politique,
          actions: ws.actions,
        }));

        const data = {
          ...original,
          workstreams: updatedWorkstreams,
        };

        const markdown = serializeIndividualPdca(data);

        await s3.putFileContent(config, file.s3_key, markdown);

        // Update raw_markdown and clear dirty flag
        await db.files.update(file.id, {
          raw_markdown: markdown,
          is_dirty: 0,
          last_synced_at: new Date().toISOString(),
        });
      }

      result.pushed++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de push';
      result.errors.push(`${file.id}: ${msg}`);
    }
  }

  return result;
}

// === Conflict resolution ===

export async function resolveConflictKeepLocal(
  config: S3Config,
  fileId: string
): Promise<void> {
  const file = await dbService.getFile(fileId);
  if (!file) return;

  // Push local version to S3
  const workstreams = await dbService.getWorkstreamsByFile(fileId);
  const original = parseIndividualPdca(file.raw_markdown);
  const updatedWorkstreams = workstreams.map((ws) => ({
    ws_number: ws.ws_number,
    title: ws.title,
    status: ws.status,
    phase_p: ws.phase_p,
    phase_d: ws.phase_d,
    phase_c: ws.phase_c,
    phase_a: ws.phase_a,
    lien_ga: ws.lien_ga,
    dependances: ws.dependances,
    note_politique: ws.note_politique,
    actions: ws.actions,
  }));

  const markdown = serializeIndividualPdca({ ...original, workstreams: updatedWorkstreams });
  await s3.putFileContent(config, file.s3_key, markdown);
  await dbService.markFileClean(fileId);
}

export async function resolveConflictTakeRemote(
  config: S3Config,
  fileId: string
): Promise<void> {
  const file = await dbService.getFile(fileId);
  if (!file) return;

  // Download S3 version and overwrite local
  const markdown = await s3.getFileContent(config, file.s3_key);
  const parsed = parseIndividualPdca(markdown);

  await dbService.upsertFile({
    ...file,
    raw_markdown: markdown,
    is_dirty: 0,
    last_synced_at: new Date().toISOString(),
  });
  await dbService.upsertWorkstreamsForFile(fileId, parsed.member_code, parsed.workstreams);
}
