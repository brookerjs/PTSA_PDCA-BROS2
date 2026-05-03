// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLiveQuery } from 'dexie-react-hooks';
import type { HelpArticle } from '../../types';

// Mock Dexie live query (controlled per test)
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(() => []),
}));

// Mock db
vi.mock('../../lib/db', () => ({
  db: {
    help_articles: { orderBy: vi.fn(() => ({ toArray: vi.fn(() => Promise.resolve([])) })) },
  },
}));

// Mock react-markdown to avoid ESM resolution issues in test environment
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}));

vi.mock('remark-gfm', () => ({ default: vi.fn() }));
vi.mock('rehype-raw', () => ({ default: vi.fn() }));

import Help from '../../pages/Help';

const mockUseLiveQuery = vi.mocked(useLiveQuery);

afterEach(() => {
  cleanup();
  mockUseLiveQuery.mockReturnValue([]);
});

const sampleArticle: HelpArticle = {
  id: 1,
  title: 'Comment synchroniser',
  category: 'Sync',
  content: '## Synchronisation\n\nCliquez sur le bouton Sync.',
  created_at: '2026-05-02T00:00:00.000Z',
  updated_at: '2026-05-02T00:00:00.000Z',
};

describe('Help page — Issue #19', () => {
  it('renders empty state when no articles', () => {
    mockUseLiveQuery.mockReturnValue([]);
    render(<Help />);
    expect(screen.getByText("Aucun article d'aide. Les articles sont créés dans la section Admin.")).toBeTruthy();
  });

  it('renders article list when articles exist', () => {
    mockUseLiveQuery.mockReturnValue([sampleArticle]);
    render(<Help />);
    expect(screen.getByText('Comment synchroniser')).toBeTruthy();
  });

  it('shows category badge on article card', () => {
    mockUseLiveQuery.mockReturnValue([sampleArticle]);
    render(<Help />);
    expect(screen.getByText('Sync')).toBeTruthy();
  });

  it('navigates to detail view on article click', async () => {
    mockUseLiveQuery.mockReturnValue([sampleArticle]);
    render(<Help />);
    const card = screen.getByText('Comment synchroniser');
    await userEvent.click(card);
    expect(screen.getByText('Retour')).toBeTruthy();
  });

  it('back button returns to list view', async () => {
    mockUseLiveQuery.mockReturnValue([sampleArticle]);
    render(<Help />);
    await userEvent.click(screen.getByText('Comment synchroniser'));
    await userEvent.click(screen.getByText('Retour'));
    expect(screen.queryByText('Retour')).toBeNull();
  });
});
