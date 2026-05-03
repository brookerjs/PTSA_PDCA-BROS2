// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Dexie live query
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(() => []),
}));

// Mock dbService functions
vi.mock('../../lib/dbService', () => ({
  addWorkstream: vi.fn(),
  addHelpArticle: vi.fn(),
}));

// Mock db to avoid IndexedDB in tests
vi.mock('../../lib/db', () => ({
  db: {
    files: { toArray: vi.fn(() => Promise.resolve([])) },
    help_articles: { toArray: vi.fn(() => Promise.resolve([])) },
  },
}));

import Admin from '../../pages/Admin';

afterEach(() => cleanup());

describe('Admin page — Issue #18', () => {
  it('renders Add Workstream section heading', () => {
    render(<Admin />);
    expect(screen.getByText('Ajouter un workstream')).toBeTruthy();
  });

  it('renders Add Help Article section heading', () => {
    render(<Admin />);
    expect(screen.getByText("Gérer les articles d'aide")).toBeTruthy();
  });

  it('renders team member select with placeholder', () => {
    render(<Admin />);
    expect(screen.getByText('Sélectionner un équipier…')).toBeTruthy();
  });

  it('shows validation error when submitting with no member selected', async () => {
    render(<Admin />);
    const button = screen.getByText('Ajouter le workstream');
    await userEvent.click(button);
    expect(screen.getByText('Équipier et titre sont requis.')).toBeTruthy();
  });

  it('shows validation error when submitting help article with no title', async () => {
    render(<Admin />);
    const button = screen.getByText("Créer l'article");
    await userEvent.click(button);
    expect(screen.getByText('Le titre est requis.')).toBeTruthy();
  });
});
