import {
  STATUS_MAP,
  ACTION_LABEL_MAP,
  type WorkstreamStatus,
  type ActionLabel,
  type Action,
  type ParsedWorkstream,
  type IndividualPdcaData,
  type RegisterData,
  type TeamMember,
  type RegisterWorkstream,
} from '../types';

// === Helpers ===

function parseStatus(text: string): WorkstreamStatus {
  const normalized = text.trim().toLowerCase();
  for (const [key, value] of Object.entries(STATUS_MAP)) {
    if (normalized.includes(key)) return value;
  }
  // Default to "att" for unknown statuses (e.g. "A clarifier")
  return 'att';
}

function parseActionLabel(text: string): ActionLabel {
  const normalized = text.trim().toLowerCase();
  for (const [key, value] of Object.entries(ACTION_LABEL_MAP)) {
    if (normalized === key) return value;
  }
  // Partial match fallback
  for (const [key, value] of Object.entries(ACTION_LABEL_MAP)) {
    if (normalized.includes(key)) return value;
  }
  return 'todo';
}

function trimCell(cell: string): string {
  return cell.trim().replace(/^\||\|$/g, '').trim();
}

function parseTableRows(tableBlock: string): string[][] {
  const lines = tableBlock.split('\n').filter((l) => l.trim().startsWith('|'));
  const rows: string[][] = [];
  for (const line of lines) {
    const cells = line
      .split('|')
      .slice(1, -1) // remove empty first/last from leading/trailing |
      .map((c) => c.trim());
    // Skip separator rows (all dashes)
    if (cells.every((c) => /^[-:]+$/.test(c))) continue;
    rows.push(cells);
  }
  return rows;
}

function extractStatusFromHeading(heading: string): { title: string; status: WorkstreamStatus } {
  // Pattern: ## N. Title | Statut: StatusText — optional suffix
  const statusMatch = heading.match(/\|\s*Statut\s*:\s*(.+)$/i);
  if (statusMatch) {
    const statusRaw = statusMatch[1].trim();
    // Strip suffixes like "— A activer"
    const statusClean = statusRaw.replace(/\s*—\s*.+$/, '').trim();
    const title = heading.replace(/\|\s*Statut\s*:.+$/, '').trim();
    // Remove the leading "## N. " prefix
    const titleClean = title.replace(/^##\s*\d+\.\s*/, '').trim();
    return { title: titleClean, status: parseStatus(statusClean) };
  }
  // Fallback: no status in heading
  const titleClean = heading.replace(/^##\s*\d+\.\s*/, '').trim();
  return { title: titleClean, status: 'att' };
}

function extractWsNumber(heading: string): number {
  const match = heading.match(/^##\s*(\d+)\./);
  return match ? parseInt(match[1], 10) : 0;
}

// === Individual PDCA Parser ===

export function parseIndividualPdca(markdown: string): IndividualPdcaData {
  const lines = markdown.split('\n');

  // Extract header fields
  let member_code = '';
  let member_name = '';
  let role = '';
  let global_status: WorkstreamStatus = 'att';
  let last_updated = '';

  // Parse first heading: # PDCA — CODE (Name)
  const h1Match = markdown.match(/^#\s+PDCA\s*—\s*(\w+)\s*\(([^)]+)\)/m);
  if (h1Match) {
    member_code = h1Match[1].trim();
    member_name = h1Match[2].trim();
  }

  // Parse role from ## Suivi Operationnel | Direct Report — ROLE
  const roleMatch = markdown.match(
    /^##\s+Suivi Operationnel\s*\|\s*Direct Report\s*—\s*(.+)$/m
  );
  if (roleMatch) {
    role = roleMatch[1].trim();
  }

  // Parse global status
  const statusLine = lines.find((l) =>
    l.toLowerCase().startsWith('statut global:')
  );
  if (statusLine) {
    const statusText = statusLine.replace(/^statut global:\s*/i, '').trim();
    global_status = parseStatus(statusText);
  }

  // Parse last updated
  const updateLine = lines.find((l) =>
    l.toLowerCase().startsWith('derniere mise a jour:')
  );
  if (updateLine) {
    last_updated = updateLine.replace(/^derniere mise a jour:\s*/i, '').trim();
  }

  // Split into sections by ## headings
  const sections = splitBySections(markdown);

  // Extract role context
  let role_context: string | null = null;
  let temperature: string | null = null;
  let temperature_status: string | null = null;

  const contextSection = sections.find((s) =>
    s.heading.toLowerCase().includes('contexte du role')
  );
  if (contextSection) {
    role_context = contextSection.body.trim() || null;

    // Extract temperature from prose
    const tempMatch = contextSection.body.match(
      /[Tt]emperature\s+cette\s+semaine\s*:\s*(.+)/
    );
    if (tempMatch) {
      const tempText = tempMatch[1].trim();
      temperature = tempText.replace(/\s*[.;]?\s*$/, '');
      // Determine temperature status
      if (tempText.toLowerCase().includes('watch')) {
        temperature_status = 'watch';
        // Extract just the grade portion for temperature
        const gradeMatch = tempText.match(/^([A-F][+-]?\s*\d+%)/i);
        if (gradeMatch) {
          temperature = gradeMatch[1].trim();
        }
      }
    }
  }

  // Parse workstreams (numbered sections only, skip non-workstream sections)
  const workstreams: ParsedWorkstream[] = [];

  for (const section of sections) {
    // Only parse numbered workstream sections: ## N. Title
    if (!/^##\s+\d+\./.test(section.heading)) continue;

    const ws = parseWorkstreamSection(section.heading, section.body);
    workstreams.push(ws);
  }

  return {
    file_id: `TEAM-OPS-PDCA-${member_code}`,
    member_code,
    member_name,
    role,
    global_status,
    last_updated,
    role_context,
    temperature,
    temperature_status,
    workstreams,
  };
}

interface Section {
  heading: string;
  body: string;
}

function splitBySections(markdown: string): Section[] {
  const sections: Section[] = [];
  const lines = markdown.split('\n');
  let currentHeading = '';
  let currentBody: string[] = [];

  for (const line of lines) {
    if (/^##\s+/.test(line) && !/^###/.test(line)) {
      if (currentHeading) {
        sections.push({ heading: currentHeading, body: currentBody.join('\n') });
      }
      currentHeading = line;
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }

  if (currentHeading) {
    sections.push({ heading: currentHeading, body: currentBody.join('\n') });
  }

  return sections;
}

function parseWorkstreamSection(heading: string, body: string): ParsedWorkstream {
  const ws_number = extractWsNumber(heading);
  const { title, status } = extractStatusFromHeading(heading);

  // Parse PDCA phase table
  let phase_p: string | null = null;
  let phase_d: string | null = null;
  let phase_c: string | null = null;
  let phase_a: string | null = null;

  // Find the PDCA table — look for | Phase | Contenu | header or PLANIFIER rows
  const bodyLines = body.split('\n');
  let inPhaseTable = false;
  let inActionTable = false;

  const phaseRows: string[] = [];
  const actionTableLines: string[] = [];
  const postTableLines: string[] = [];

  let pastPhaseTable = false;
  let pastActionTable = false;

  for (const line of bodyLines) {
    const trimmed = line.trim();

    // Detect phase table start
    if (
      trimmed.match(/^\|\s*Phase\s*\|\s*Contenu\s*\|/i) ||
      trimmed.match(/^\|\s*PLANIFIER\s*\|/i)
    ) {
      inPhaseTable = true;
      if (trimmed.match(/^\|\s*Phase\s*\|/i)) continue; // skip header
    }

    // Detect action table start
    if (trimmed.match(/^\|\s*Action\s*\|\s*R\s*\|/i)) {
      inPhaseTable = false;
      pastPhaseTable = true;
      inActionTable = true;
      continue; // skip header
    }

    // In phase table
    if (inPhaseTable && trimmed.startsWith('|')) {
      if (/^\|[-:|\s]+\|$/.test(trimmed)) continue; // separator
      phaseRows.push(trimmed);
      continue;
    }

    // Leaving phase table
    if (inPhaseTable && !trimmed.startsWith('|') && trimmed !== '') {
      inPhaseTable = false;
      pastPhaseTable = true;
    }

    // In action table
    if (inActionTable && trimmed.startsWith('|')) {
      if (/^\|[-:|\s]+\|$/.test(trimmed)) continue; // separator
      actionTableLines.push(trimmed);
      continue;
    }

    // Leaving action table
    if (inActionTable && !trimmed.startsWith('|')) {
      inActionTable = false;
      pastActionTable = true;
    }

    // Post-table lines (Lien GA, Dependances, etc.)
    if (pastActionTable || pastPhaseTable) {
      if (trimmed && trimmed !== '---') {
        postTableLines.push(trimmed);
      }
    }
  }

  // Extract phases from phase rows
  for (const row of phaseRows) {
    const cells = row.split('|').filter((c) => c.trim() !== '');
    if (cells.length < 2) continue;
    const phaseKey = cells[0].trim().toUpperCase();
    const content = cells.slice(1).join('|').trim();

    if (phaseKey === 'PLANIFIER') phase_p = content || null;
    else if (phaseKey === 'DEPLOYER' || phaseKey === 'DÉPLOYER') phase_d = content || null;
    else if (phaseKey === 'CONTROLER' || phaseKey === 'CONTRÔLER') phase_c = content || null;
    else if (phaseKey === 'AGIR') phase_a = content || null;
  }

  // Parse action rows
  const actions: Action[] = [];
  for (const line of actionTableLines) {
    const cells = line.split('|').filter((c) => c.trim() !== '');
    if (cells.length >= 4) {
      const text = cells[0].trim();
      const responsible = cells[1].trim();
      const echeance = cells[2].trim();
      const statusText = cells.slice(3).join('|').trim();
      actions.push({
        text,
        responsible,
        echeance,
        label: parseActionLabel(statusText),
      });
    }
  }

  // Parse post-table metadata
  let lien_ga: string | null = null;
  let dependances: string | null = null;
  let note_politique: string | null = null;

  for (const line of postTableLines) {
    if (line.toLowerCase().startsWith('lien ga:')) {
      lien_ga = line.replace(/^lien ga:\s*/i, '').trim() || null;
    } else if (line.toLowerCase().startsWith('dependances:') || line.toLowerCase().startsWith('dépendances:')) {
      dependances = line.replace(/^d[eé]pendances:\s*/i, '').trim() || null;
    } else if (line.toLowerCase().startsWith('acteurs politiques:') || line.toLowerCase().startsWith('note politique:')) {
      note_politique = line.replace(/^(acteurs politiques|note politique):\s*/i, '').trim() || null;
    }
  }

  return {
    ws_number,
    title,
    status,
    phase_p,
    phase_d,
    phase_c,
    phase_a,
    lien_ga,
    dependances,
    note_politique,
    actions,
  };
}

// === Register Parser ===

export function parseRegister(markdown: string): RegisterData {
  const lines = markdown.split('\n');

  let last_updated = '';
  const updateLine = lines.find((l) =>
    l.toLowerCase().startsWith('derniere mise a jour:')
  );
  if (updateLine) {
    last_updated = updateLine.replace(/^derniere mise a jour:\s*/i, '').trim();
  }

  const sections = splitBySections(markdown);

  // Parse team table
  const team: TeamMember[] = [];
  const teamSection = sections.find(
    (s) => s.heading.toLowerCase().includes('equipe') || s.heading.toLowerCase().includes('équipe')
  );
  if (teamSection) {
    const rows = parseTableRows(teamSection.body);
    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 4) {
        team.push({
          code: row[0].trim(),
          name: row[1].trim(),
          role: row[2].trim(),
          temperature: row[3].trim(),
        });
      }
    }
  }

  // Parse register workstreams table
  const workstreams: RegisterWorkstream[] = [];
  const registerSection = sections.find((s) =>
    s.heading.toLowerCase().includes('registre consolide') ||
    s.heading.toLowerCase().includes('registre consolidé')
  );
  if (registerSection) {
    const rows = parseTableRows(registerSection.body);
    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 7) {
        const wsNum = parseInt(row[0].trim(), 10);
        if (isNaN(wsNum)) continue;

        // Extract member_code from R operationnel (first code before +)
        const leadRaw = row[2].trim();
        const memberMatch = leadRaw.match(/^(\w+)/);
        const member_code = memberMatch ? memberMatch[1] : leadRaw;

        workstreams.push({
          ws_number: wsNum,
          title: row[1].trim(),
          lead: leadRaw,
          member_code,
          status: parseStatus(row[4].trim()),
          echeance: row[5].trim(),
          comment: row[6].trim(),
        });
      }
    }
  }

  return {
    file_id: 'TEAM-OPS-Active-PDCA-Register',
    last_updated,
    team,
    workstreams,
  };
}
