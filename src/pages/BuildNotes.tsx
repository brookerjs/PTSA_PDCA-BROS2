import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import type { ReleaseNote } from '../types';

export default function BuildNotes() {
  const releaseNotes = useLiveQuery(() => db.release_notes.toArray(), []) ?? [];

  // Sort by version descending (newest first)
  const sorted = [...releaseNotes].sort((a, b) =>
    b.version.localeCompare(a.version, undefined, { numeric: true })
  );

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-lg font-semibold text-navy mb-4">Notes de version</h2>
      {sorted.length === 0 ? (
        <p className="text-sm text-gray-500">
          Aucune note de version disponible.
        </p>
      ) : (
        <div className="space-y-4">
          {sorted.map((note) => (
            <ReleaseCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReleaseCard({ note }: { note: ReleaseNote }) {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [coachingExpanded, setCoachingExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm font-bold text-navy">v{note.version}</span>
          <span className="text-xs text-gray-400">{note.date}</span>
        </div>
        {/* Summary — render markdown-ish content */}
        <div className="text-sm text-gray-700 leading-relaxed prose-sm">
          <MarkdownBlock content={note.summary} />
        </div>
      </div>

      {/* Details toggle */}
      {note.details && (
        <>
          <button
            onClick={() => setDetailsExpanded(!detailsExpanded)}
            className="w-full px-5 py-2.5 border-t border-gray-100 flex items-center gap-2 text-xs font-medium text-pt-blue hover:bg-gray-50 transition-colors"
          >
            {detailsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {detailsExpanded ? 'Masquer les details' : 'Voir les details'}
          </button>
          {detailsExpanded && (
            <div className="px-5 pb-5 border-t border-gray-100 bg-gray-50">
              <div className="pt-4 text-sm text-gray-700 leading-relaxed prose-sm">
                <MarkdownBlock content={note.details} />
              </div>
            </div>
          )}
        </>
      )}

      {/* Coaching toggle */}
      {note.coaching && (
        <>
          <button
            onClick={() => setCoachingExpanded(!coachingExpanded)}
            className="w-full px-5 py-2.5 border-t border-gray-100 flex items-center gap-2 text-xs font-medium text-pt-blue hover:bg-gray-50 transition-colors"
          >
            {coachingExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {coachingExpanded ? 'Masquer le coaching' : 'Voir le coaching'}
          </button>
          {coachingExpanded && (
            <div className="px-5 pb-5 border-t border-gray-100 bg-gray-50">
              <div className="pt-4 text-sm text-gray-700 leading-relaxed prose-sm">
                <MarkdownBlock content={note.coaching} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MarkdownBlock({ content }: { content: string }) {
  // Simple markdown rendering for lists, bold, headers, tables, and horizontal rules
  const lines = content.split('\n');
  const elements: React.JSX.Element[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Heading ### Iteration N — Title
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={i} className="text-sm font-semibold text-navy mt-4 mb-2">
          {line.replace(/^###\s*/, '')}
        </h4>
      );
      i++;
      continue;
    }

    // Heading #### Sub-heading
    if (line.startsWith('#### ')) {
      elements.push(
        <h5 key={i} className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-3 mb-1">
          {line.replace(/^####\s*/, '')}
        </h5>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={i} className="my-3 border-gray-200" />);
      i++;
      continue;
    }

    // Table — collect all consecutive | lines
    if (line.trim().startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(<MarkdownTable key={`table-${i}`} lines={tableLines} />);
      continue;
    }

    // List item
    if (line.startsWith('- ')) {
      elements.push(
        <div key={i} className="flex gap-2 ml-2">
          <span className="text-gray-400 flex-shrink-0">&#8226;</span>
          <span dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.slice(2)) }} />
        </div>
      );
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: inlineMarkdown(line) }} />
    );
    i++;
  }

  return <>{elements}</>;
}

function MarkdownTable({ lines }: { lines: string[] }) {
  const rows = lines
    .filter((l) => !/^\|[-:|\s]+\|$/.test(l.trim()))
    .map((l) =>
      l.split('|').slice(1, -1).map((c) => c.trim())
    );

  if (rows.length === 0) return null;
  const header = rows[0];
  const body = rows.slice(1);

  return (
    <div className="overflow-x-auto my-2">
      <table className="w-full text-xs border border-gray-200 rounded">
        <thead>
          <tr className="bg-gray-100">
            {header.map((cell, j) => (
              <th key={j} className="px-2 py-1.5 text-left font-medium text-gray-600 border-b border-gray-200">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, i) => (
            <tr key={i} className="border-b border-gray-100">
              {row.map((cell, j) => (
                <td key={j} className="px-2 py-1.5 text-gray-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineMarkdown(text: string): string {
  // Escape HTML entities first, then apply bold formatting
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
