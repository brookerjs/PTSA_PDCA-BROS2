// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import TeamMemberCard from '../TeamMemberCard';
import type { TeamMember } from '../../types';

// === Issue #14: Vue Ensemble card displays name, not raw code ===

afterEach(() => cleanup());

describe('TeamMemberCard — Issue #14 text alignment', () => {
  const vueEnsemble: TeamMember = {
    code: 'VUE_ENSEMBLE',
    name: 'Équipe BROS2',
    role: 'Vue Ensemble',
    temperature: '',
  };

  const regularMember: TeamMember = {
    code: 'BARA2',
    name: 'Alexis',
    role: 'Digital Strategies Manager',
    temperature: 'A-Ok 100%',
  };

  it('synthetic card (VUE_ENSEMBLE) shows member.name as primary label', () => {
    render(
      <TeamMemberCard
        member={vueEnsemble}
        isSelected={false}
        editable={false}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText('Équipe BROS2')).toBeTruthy();
  });

  it('synthetic card does NOT render raw code "VUE_ENSEMBLE"', () => {
    render(
      <TeamMemberCard
        member={vueEnsemble}
        isSelected={false}
        editable={false}
        onClick={vi.fn()}
      />
    );
    expect(screen.queryByText('VUE_ENSEMBLE')).toBeNull();
  });

  it('synthetic card still shows role', () => {
    render(
      <TeamMemberCard
        member={vueEnsemble}
        isSelected={false}
        editable={false}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText('Vue Ensemble')).toBeTruthy();
  });

  it('regular member card shows code as primary label', () => {
    render(
      <TeamMemberCard
        member={regularMember}
        isSelected={false}
        editable={true}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText('BARA2')).toBeTruthy();
  });

  it('regular member card shows name as secondary label', () => {
    render(
      <TeamMemberCard
        member={regularMember}
        isSelected={false}
        editable={true}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText('Alexis')).toBeTruthy();
  });

  it('non-editable card hides pencil icon and temperature placeholder', () => {
    render(
      <TeamMemberCard
        member={vueEnsemble}
        isSelected={false}
        editable={false}
        onClick={vi.fn()}
      />
    );
    expect(screen.queryByText('Temperature...')).toBeNull();
  });

  it('editable card shows temperature placeholder when temperature is empty', () => {
    const emptyTemp: TeamMember = { ...regularMember, temperature: '' };
    render(
      <TeamMemberCard
        member={emptyTemp}
        isSelected={false}
        editable={true}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText('Temperature...')).toBeTruthy();
  });
});
