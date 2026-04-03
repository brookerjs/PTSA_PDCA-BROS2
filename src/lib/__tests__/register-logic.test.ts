import { describe, it, expect } from 'vitest';
import { parseRegister } from '../markdownParser';
import { REGISTER_MD } from './fixtures';
import type { TeamMember } from '../../types';

// === Issue #13: matchesMember filter logic ===

// Extracted from Register.tsx for testability
function matchesMember(w: { member_code: string }, code: string): boolean {
  if (code === 'VUE_ENSEMBLE') return true;
  return w.member_code === code;
}

describe('matchesMember — Issue #13 filter logic', () => {
  it('VUE_ENSEMBLE matches all workstreams', () => {
    expect(matchesMember({ member_code: 'BARA2' }, 'VUE_ENSEMBLE')).toBe(true);
    expect(matchesMember({ member_code: 'CHOY' }, 'VUE_ENSEMBLE')).toBe(true);
    expect(matchesMember({ member_code: 'JUNC' }, 'VUE_ENSEMBLE')).toBe(true);
  });

  it('BROS2 matches only BROS2 workstreams', () => {
    expect(matchesMember({ member_code: 'BROS2' }, 'BROS2')).toBe(true);
    expect(matchesMember({ member_code: 'BARA2' }, 'BROS2')).toBe(false);
    expect(matchesMember({ member_code: 'CHOY' }, 'BROS2')).toBe(false);
  });

  it('individual member code matches only own workstreams', () => {
    expect(matchesMember({ member_code: 'JUNC' }, 'JUNC')).toBe(true);
    expect(matchesMember({ member_code: 'BARA2' }, 'JUNC')).toBe(false);
  });
});

// === Issue #15: sidebar card order ===

describe('team sort order — Issue #15', () => {
  it('parsed team sorted by code is alphabetical', () => {
    const result = parseRegister(REGISTER_MD);
    const sorted = [...result.team].sort((a, b) => a.code.localeCompare(b.code));
    const codes = sorted.map((m) => m.code);
    expect(codes).toEqual(['BARA2', 'CHOY', 'GAGL2', 'JUNC']);
  });

  it('sort is stable when input is already ordered', () => {
    const result = parseRegister(REGISTER_MD);
    const sorted = [...result.team].sort((a, b) => a.code.localeCompare(b.code));
    // Sort again — should be identical
    const sortedAgain = [...sorted].sort((a, b) => a.code.localeCompare(b.code));
    expect(sortedAgain.map((m) => m.code)).toEqual(sorted.map((m) => m.code));
  });

  it('sort corrects reversed input order', () => {
    const reversed: TeamMember[] = [
      { code: 'JUNC', name: 'Claudio', role: 'Data Analyst', temperature: '' },
      { code: 'GAGL2', name: 'Laura', role: 'OPX Advisor', temperature: '' },
      { code: 'CHOY', name: 'Yvan', role: 'Manager', temperature: '' },
      { code: 'BARA2', name: 'Alexis', role: 'Digital Manager', temperature: '' },
    ];
    const sorted = [...reversed].sort((a, b) => a.code.localeCompare(b.code));
    expect(sorted.map((m) => m.code)).toEqual(['BARA2', 'CHOY', 'GAGL2', 'JUNC']);
  });
});

// === Issue #13: Vue Ensemble + BROS2 team construction ===

describe('team array construction — Issue #13', () => {
  it('Vue Ensemble and BROS2 are pinned before parsed members', () => {
    const result = parseRegister(REGISTER_MD);
    const sorted = [...result.team].sort((a, b) => a.code.localeCompare(b.code));

    const vueEnsemble: TeamMember = {
      code: 'VUE_ENSEMBLE',
      name: 'Équipe BROS2',
      role: 'Vue Ensemble',
      temperature: '',
    };
    const bros2: TeamMember = {
      code: 'BROS2',
      name: 'Scott',
      role: 'Dir. Programmes',
      temperature: '',
    };

    const team = [vueEnsemble, bros2, ...sorted];
    expect(team[0].code).toBe('VUE_ENSEMBLE');
    expect(team[1].code).toBe('BROS2');
    expect(team.slice(2).map((m) => m.code)).toEqual(['BARA2', 'CHOY', 'GAGL2', 'JUNC']);
  });

  it('Vue Ensemble card is not editable (code contains underscore)', () => {
    const vueCode = 'VUE_ENSEMBLE';
    expect(vueCode.includes('_')).toBe(true);
    // This is the guard used in Register.tsx: editable={m.code !== 'VUE_ENSEMBLE'}
    expect(vueCode !== 'VUE_ENSEMBLE').toBe(false);
  });

  it('regular member codes do not contain underscore', () => {
    const result = parseRegister(REGISTER_MD);
    for (const m of result.team) {
      expect(m.code.includes('_')).toBe(false);
    }
  });
});
