import { describe, it, expect } from 'vitest';
import { parseIndividualPdca, parseRegister, parseReleaseNotes } from '../markdownParser';
import { serializeIndividualPdca, serializeReleaseNotes } from '../markdownSerializer';
import { BARA2_MD, CHOY_MD, JUNC_MD, GAGL2_MD, REGISTER_MD, RELEASE_NOTES_MD } from './fixtures';

// === Basic parsing — all files parse without error ===

describe('parseIndividualPdca — all files parse', () => {
  it('parses BARA2 without error', () => {
    const result = parseIndividualPdca(BARA2_MD);
    expect(result.member_code).toBe('BARA2');
    expect(result.member_name).toBe('Alexis');
  });

  it('parses CHOY without error', () => {
    const result = parseIndividualPdca(CHOY_MD);
    expect(result.member_code).toBe('CHOY');
    expect(result.member_name).toBe('Yvan');
  });

  it('parses JUNC without error', () => {
    const result = parseIndividualPdca(JUNC_MD);
    expect(result.member_code).toBe('JUNC');
    expect(result.member_name).toBe('Claudio');
  });

  it('parses GAGL2 without error', () => {
    const result = parseIndividualPdca(GAGL2_MD);
    expect(result.member_code).toBe('GAGL2');
    expect(result.member_name).toBe('Laura');
  });
});

// === Workstream counts ===

describe('workstream counts', () => {
  it('BARA2 has 5 workstreams', () => {
    const result = parseIndividualPdca(BARA2_MD);
    expect(result.workstreams).toHaveLength(5);
  });

  it('CHOY has 3 workstreams', () => {
    const result = parseIndividualPdca(CHOY_MD);
    expect(result.workstreams).toHaveLength(3);
  });

  it('JUNC has 4 workstreams', () => {
    const result = parseIndividualPdca(JUNC_MD);
    expect(result.workstreams).toHaveLength(4);
  });

  it('GAGL2 has 3 workstreams', () => {
    const result = parseIndividualPdca(GAGL2_MD);
    expect(result.workstreams).toHaveLength(3);
  });
});

// === global_status correct ===

describe('global_status', () => {
  it('GAGL2 is "ok" (En controle)', () => {
    const result = parseIndividualPdca(GAGL2_MD);
    expect(result.global_status).toBe('ok');
  });

  it('BARA2 is "att"', () => {
    expect(parseIndividualPdca(BARA2_MD).global_status).toBe('att');
  });

  it('CHOY is "att"', () => {
    expect(parseIndividualPdca(CHOY_MD).global_status).toBe('att');
  });

  it('JUNC is "att"', () => {
    expect(parseIndividualPdca(JUNC_MD).global_status).toBe('att');
  });
});

// === Header fields ===

describe('header parsing', () => {
  it('extracts role correctly', () => {
    expect(parseIndividualPdca(BARA2_MD).role).toBe('Digital Strategies Manager');
    expect(parseIndividualPdca(CHOY_MD).role).toBe('Manager, Commercial Digital Products');
    expect(parseIndividualPdca(JUNC_MD).role).toBe('Data Analyst');
    expect(parseIndividualPdca(GAGL2_MD).role).toBe('Operational Excellence Advisor');
  });

  it('extracts last_updated', () => {
    expect(parseIndividualPdca(BARA2_MD).last_updated).toBe('2026-03-09');
  });

  it('extracts file_id', () => {
    expect(parseIndividualPdca(BARA2_MD).file_id).toBe('TEAM-OPS-PDCA-BARA2');
  });
});

// === Action status label mapping ===

describe('action label mapping', () => {
  it('"En attente" maps to "waiting" (JUNC WS1 action 2)', () => {
    const result = parseIndividualPdca(JUNC_MD);
    const ws1 = result.workstreams[0];
    expect(ws1.actions[1].label).toBe('waiting');
  });

  it('"A planifier" maps to "todo" (CHOY WS3 action 1)', () => {
    const result = parseIndividualPdca(CHOY_MD);
    const ws3 = result.workstreams[2];
    expect(ws3.actions[0].label).toBe('todo');
  });

  it('"En cours" maps to "inprogress"', () => {
    const result = parseIndividualPdca(JUNC_MD);
    const ws1 = result.workstreams[0];
    expect(ws1.actions[0].label).toBe('inprogress');
  });

  it('"A faire" maps to "todo"', () => {
    const result = parseIndividualPdca(BARA2_MD);
    const ws1 = result.workstreams[0];
    expect(ws1.actions[0].label).toBe('todo');
  });
});

// === null phase_a when AGIR row absent ===

describe('null phase_a', () => {
  it('BARA2 WS3 (Support Licence) has null phase_a', () => {
    const result = parseIndividualPdca(BARA2_MD);
    expect(result.workstreams[2].phase_a).toBeNull();
  });

  it('BARA2 WS4 (Power Automate) has null phase_a', () => {
    const result = parseIndividualPdca(BARA2_MD);
    expect(result.workstreams[3].phase_a).toBeNull();
  });

  it('BARA2 WS5 (Gestion equipe DPO) has null phase_a', () => {
    const result = parseIndividualPdca(BARA2_MD);
    expect(result.workstreams[4].phase_a).toBeNull();
  });

  it('JUNC WS3 (Data Governance) has null phase_a', () => {
    const result = parseIndividualPdca(JUNC_MD);
    expect(result.workstreams[2].phase_a).toBeNull();
  });
});

// === 7-action table parsed fully (CHOY WS1) ===

describe('long action tables', () => {
  it('CHOY WS1 has all 7 actions', () => {
    const result = parseIndividualPdca(CHOY_MD);
    const ws1 = result.workstreams[0];
    expect(ws1.actions).toHaveLength(7);
  });
});

// === Long action text preserved ===

describe('long action text', () => {
  it('GAGL2 WS3 action 2 preserves full text', () => {
    const result = parseIndividualPdca(GAGL2_MD);
    const ws3 = result.workstreams[2];
    expect(ws3.actions[1].text).toContain('Definir le premier mandat concret pour Laura');
    expect(ws3.actions[1].text).toContain('cartographie');
  });
});

// === & in title survives ===

describe('special characters in titles', () => {
  it('JUNC WS3 title contains "Finance & Admin"', () => {
    const result = parseIndividualPdca(JUNC_MD);
    expect(result.workstreams[2].title).toContain('Finance & Admin');
  });
});

// === lien_ga null when absent ===

describe('lien_ga', () => {
  it('is null when absent (BARA2 WS2)', () => {
    const result = parseIndividualPdca(BARA2_MD);
    expect(result.workstreams[1].lien_ga).toBeNull();
  });

  it('is present on BARA2 WS1', () => {
    const result = parseIndividualPdca(BARA2_MD);
    expect(result.workstreams[0].lien_ga).toBe('P3 Harmonized Industrial Excellence');
  });

  it('is present on GAGL2 WS3', () => {
    const result = parseIndividualPdca(GAGL2_MD);
    expect(result.workstreams[2].lien_ga).toContain('Data Integrity');
  });
});

// === note_politique parsed (CHOY WS1) ===

describe('note_politique', () => {
  it('CHOY WS1 has note_politique', () => {
    const result = parseIndividualPdca(CHOY_MD);
    expect(result.workstreams[0].note_politique).toContain('LAVN2');
    expect(result.workstreams[0].note_politique).toContain('ROYS');
  });
});

// === Status suffix stripped (GAGL2 WS3) ===

describe('status suffix stripping', () => {
  it('GAGL2 WS3 status is "att" not including "A activer"', () => {
    const result = parseIndividualPdca(GAGL2_MD);
    expect(result.workstreams[2].status).toBe('att');
  });

  it('BARA2 WS4 "A clarifier" maps to "att"', () => {
    const result = parseIndividualPdca(BARA2_MD);
    expect(result.workstreams[3].status).toBe('att');
  });
});

// === Notes section skipped ===

describe('notes section skipped', () => {
  it('BARA2 has exactly 5 workstreams (notes not parsed as workstream)', () => {
    const result = parseIndividualPdca(BARA2_MD);
    expect(result.workstreams).toHaveLength(5);
    const titles = result.workstreams.map((w) => w.title);
    expect(titles).not.toContain(expect.stringContaining('Notes'));
  });
});

// === Temperature parsing ===

describe('temperature', () => {
  it('JUNC has temperature "B-, 45% good — watch item"', () => {
    const result = parseIndividualPdca(JUNC_MD);
    expect(result.temperature).toBeTruthy();
    expect(result.temperature_status).toBe('watch');
  });
});

// === Register parser ===

describe('parseRegister', () => {
  it('parses team members', () => {
    const result = parseRegister(REGISTER_MD);
    expect(result.team).toHaveLength(4);
    expect(result.team[0].code).toBe('BARA2');
    expect(result.team[2].code).toBe('JUNC');
    expect(result.team[2].temperature).toContain('B-');
  });

  it('parses workstreams', () => {
    const result = parseRegister(REGISTER_MD);
    expect(result.workstreams.length).toBeGreaterThanOrEqual(4);
    expect(result.workstreams[0].ws_number).toBe(1);
    expect(result.workstreams[0].status).toBe('att');
  });

  it('extracts member_code from lead', () => {
    const result = parseRegister(REGISTER_MD);
    expect(result.workstreams[0].member_code).toBe('BARA2');
    expect(result.workstreams[1].member_code).toBe('CHOY');
  });
});

// === Round-trip tests ===

describe('round-trip: parse → serialize → parse', () => {
  const fixtures = [
    { name: 'BARA2', md: BARA2_MD },
    { name: 'CHOY', md: CHOY_MD },
    { name: 'JUNC', md: JUNC_MD },
    { name: 'GAGL2', md: GAGL2_MD },
  ];

  for (const { name, md } of fixtures) {
    it(`${name}: parse(serialize(parse(md))) equals parse(md)`, () => {
      const parsed1 = parseIndividualPdca(md);
      const serialized = serializeIndividualPdca(parsed1);
      const parsed2 = parseIndividualPdca(serialized);

      // Compare workstream count
      expect(parsed2.workstreams).toHaveLength(parsed1.workstreams.length);

      // Compare each workstream
      for (let i = 0; i < parsed1.workstreams.length; i++) {
        const ws1 = parsed1.workstreams[i];
        const ws2 = parsed2.workstreams[i];

        expect(ws2.ws_number).toBe(ws1.ws_number);
        expect(ws2.title).toBe(ws1.title);
        expect(ws2.status).toBe(ws1.status);
        expect(ws2.phase_p).toBe(ws1.phase_p);
        expect(ws2.phase_d).toBe(ws1.phase_d);
        expect(ws2.phase_c).toBe(ws1.phase_c);
        expect(ws2.phase_a).toBe(ws1.phase_a);
        expect(ws2.lien_ga).toBe(ws1.lien_ga);
        expect(ws2.dependances).toBe(ws1.dependances);
        expect(ws2.note_politique).toBe(ws1.note_politique);

        // Compare actions
        expect(ws2.actions).toHaveLength(ws1.actions.length);
        for (let j = 0; j < ws1.actions.length; j++) {
          expect(ws2.actions[j].text).toBe(ws1.actions[j].text);
          expect(ws2.actions[j].responsible).toBe(ws1.actions[j].responsible);
          expect(ws2.actions[j].echeance).toBe(ws1.actions[j].echeance);
          expect(ws2.actions[j].label).toBe(ws1.actions[j].label);
        }
      }

      // Compare header fields
      expect(parsed2.member_code).toBe(parsed1.member_code);
      expect(parsed2.member_name).toBe(parsed1.member_name);
      expect(parsed2.global_status).toBe(parsed1.global_status);
    });
  }
});

// === Bloqué status mapping ===

describe('bloque status mapping', () => {
  it('"Bloque" maps to "blk" in STATUS_MAP', () => {
    // Create a minimal PDCA with Bloqué status
    const md = `# PDCA — TEST1 (Test)

## Suivi Operationnel | Direct Report — Test Role

Derniere mise a jour: 2026-04-01
R principal: BROS2
Statut global: Bloque

---

## 1. Test Workstream | Statut: Bloque

| Phase | Contenu |
|---|---|
| PLANIFIER | Test plan |
| DEPLOYER | Test deploy |
| CONTROLER | Test check |
| AGIR | Test act |

---
`;
    const result = parseIndividualPdca(md);
    expect(result.global_status).toBe('blk');
    expect(result.workstreams[0].status).toBe('blk');
  });

  it('"Bloque" round-trips correctly', () => {
    const md = `# PDCA — TEST1 (Test)

## Suivi Operationnel | Direct Report — Test Role

Derniere mise a jour: 2026-04-01
R principal: BROS2
Statut global: Bloque

---

## 1. Test Workstream | Statut: Bloque

| Phase | Contenu |
|---|---|
| PLANIFIER | Test plan |
| DEPLOYER | Test deploy |
| CONTROLER | Test check |
| AGIR | Test act |

---
`;
    const parsed1 = parseIndividualPdca(md);
    const serialized = serializeIndividualPdca(parsed1);
    const parsed2 = parseIndividualPdca(serialized);
    expect(parsed2.global_status).toBe('blk');
    expect(parsed2.workstreams[0].status).toBe('blk');
  });
});

// === Release notes parser ===

describe('parseReleaseNotes', () => {
  it('extracts version from heading', () => {
    const result = parseReleaseNotes(RELEASE_NOTES_MD, 'BROS2-Team-Ops/BROS2-PDCA-Release-v0.8.0.md');
    expect(result.version).toBe('0.8.0');
  });

  it('extracts date', () => {
    const result = parseReleaseNotes(RELEASE_NOTES_MD, 'BROS2-Team-Ops/BROS2-PDCA-Release-v0.8.0.md');
    expect(result.date).toBe('2026-03-29');
  });

  it('extracts summary', () => {
    const result = parseReleaseNotes(RELEASE_NOTES_MD, 'BROS2-Team-Ops/BROS2-PDCA-Release-v0.8.0.md');
    expect(result.summary).toContain('Parseur markdown PDCA');
    expect(result.summary).toContain('Resolution de conflits');
  });

  it('extracts details', () => {
    const result = parseReleaseNotes(RELEASE_NOTES_MD, 'BROS2-Team-Ops/BROS2-PDCA-Release-v0.8.0.md');
    expect(result.details).toContain('Iteration 1');
    expect(result.details).toContain('Iteration 2');
    expect(result.details).toContain('User Stories');
  });

  it('derives file ID from s3 key', () => {
    const result = parseReleaseNotes(RELEASE_NOTES_MD, 'BROS2-Team-Ops/BROS2-PDCA-Release-v0.8.0.md');
    expect(result.id).toBe('BROS2-PDCA-Release-v0.8.0');
  });
});

// === Release notes round-trip ===

describe('release notes round-trip: parse → serialize → parse', () => {
  it('round-trip preserves version, date, summary, and details', () => {
    const parsed1 = parseReleaseNotes(RELEASE_NOTES_MD, 'BROS2-Team-Ops/BROS2-PDCA-Release-v0.8.0.md');
    const serialized = serializeReleaseNotes(parsed1);
    const parsed2 = parseReleaseNotes(serialized, 'BROS2-Team-Ops/BROS2-PDCA-Release-v0.8.0.md');

    expect(parsed2.version).toBe(parsed1.version);
    expect(parsed2.date).toBe(parsed1.date);
    expect(parsed2.summary).toBe(parsed1.summary);
    expect(parsed2.details).toBe(parsed1.details);
  });
});
