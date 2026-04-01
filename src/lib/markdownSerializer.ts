import {
  REVERSE_STATUS_MAP,
  REVERSE_ACTION_LABEL_MAP,
  type IndividualPdcaData,
  type ParsedWorkstream,
  type ReleaseNote,
} from '../types';

export function serializeIndividualPdca(data: IndividualPdcaData): string {
  const lines: string[] = [];

  // Header
  lines.push(`# PDCA — ${data.member_code} (${data.member_name})`);
  lines.push('');
  lines.push(`## Suivi Operationnel | Direct Report — ${data.role}`);
  lines.push('');
  lines.push(`Derniere mise a jour: ${data.last_updated}`);
  lines.push('R principal: BROS2');
  lines.push(`Statut global: ${REVERSE_STATUS_MAP[data.global_status]}`);
  lines.push('');
  lines.push('---');

  // Role context
  if (data.role_context) {
    lines.push('');
    lines.push('## Contexte du role');
    lines.push('');
    lines.push(data.role_context);
    lines.push('');
    lines.push('---');
  }

  // Workstreams
  for (const ws of data.workstreams) {
    lines.push('');
    lines.push(serializeWorkstream(ws));
  }

  // Footer
  lines.push('');
  lines.push(`*Cree: ${data.last_updated} | Mis a jour: ${data.last_updated}*`);
  lines.push('');

  return lines.join('\n');
}

function serializeWorkstream(ws: ParsedWorkstream): string {
  const lines: string[] = [];

  const statusText = REVERSE_STATUS_MAP[ws.status];
  lines.push(`## ${ws.ws_number}. ${ws.title} | Statut: ${statusText}`);
  lines.push('');

  // PDCA phase table
  lines.push('| Phase | Contenu |');
  lines.push('|---|---|');
  if (ws.phase_p !== null) lines.push(`| PLANIFIER | ${ws.phase_p} |`);
  if (ws.phase_d !== null) lines.push(`| DEPLOYER | ${ws.phase_d} |`);
  if (ws.phase_c !== null) lines.push(`| CONTROLER | ${ws.phase_c} |`);
  if (ws.phase_a !== null) lines.push(`| AGIR | ${ws.phase_a} |`);
  lines.push('');

  // Action table
  if (ws.actions.length > 0) {
    lines.push('| Action | R | Echeance | Statut |');
    lines.push('|---|---|---|---|');
    for (const action of ws.actions) {
      const labelText = REVERSE_ACTION_LABEL_MAP[action.label];
      lines.push(
        `| ${action.text} | ${action.responsible} | ${action.echeance} | ${labelText} |`
      );
    }
    lines.push('');
  }

  // Metadata lines
  if (ws.lien_ga) {
    lines.push(`Lien GA: ${ws.lien_ga}`);
  }
  if (ws.dependances) {
    lines.push(`Dependances: ${ws.dependances}`);
  }
  if (ws.note_politique) {
    lines.push(`Acteurs politiques: ${ws.note_politique}`);
  }

  lines.push('');
  lines.push('---');

  return lines.join('\n');
}

export function serializeReleaseNotes(note: ReleaseNote): string {
  const lines: string[] = [];

  lines.push(`# Notes de version — v${note.version}`);
  lines.push('');
  lines.push(`Date: ${note.date}`);
  lines.push(`Version: ${note.version}`);
  lines.push('');
  lines.push('## Resume');
  lines.push('');
  lines.push(note.summary);
  lines.push('');
  lines.push('## Details');
  lines.push('');
  lines.push(note.details);
  lines.push('');

  return lines.join('\n');
}
