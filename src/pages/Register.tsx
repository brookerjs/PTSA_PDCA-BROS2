import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { parseRegister } from '../lib/markdownParser';
import { setTemperature } from '../lib/dbService';
import TeamMemberCard from '../components/TeamMemberCard';
import StatusPill from '../components/StatusPill';
import WorkstreamRow from '../components/WorkstreamRow';
import DetailPanel from '../components/DetailPanel';
import type { WorkstreamStatus, TeamMember } from '../types';

export default function Register() {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<WorkstreamStatus | 'all'>('all');
  const [selectedWsId, setSelectedWsId] = useState<number | null>(null);

  // Live query: all files + workstreams + temperatures from Dexie
  const files = useLiveQuery(() => db.files.toArray(), []) ?? [];
  const allWorkstreams = useLiveQuery(() => db.workstreams.toArray(), []) ?? [];
  const temperatures = useLiveQuery(() => db.temperatures.toArray(), []) ?? [];

  // Migrate BROS2 temperature from localStorage to Dexie (once)
  useEffect(() => {
    const legacy = localStorage.getItem('pdca-bros2-temperature');
    if (legacy) {
      setTemperature('BROS2', legacy).then(() => {
        localStorage.removeItem('pdca-bros2-temperature');
      });
    }
  }, []);

  // Parse team members from the register file, plus BROS2 as owner
  const team: TeamMember[] = useMemo(() => {
    const tempMap = new Map(temperatures.map((t) => [t.member_code, t.value]));
    const bros2: TeamMember = {
      code: 'BROS2',
      name: 'Scott',
      role: 'Dir. Programmes',
      temperature: tempMap.get('BROS2') ?? '',
    };
    const registerFile = files.find((f) => f.id.toLowerCase().includes('register'));
    if (!registerFile) return [bros2];
    try {
      const parsed = parseRegister(registerFile.raw_markdown).team.map((m) => ({
        ...m,
        temperature: tempMap.get(m.code) ?? m.temperature,
      }));
      return [bros2, ...parsed];
    } catch {
      return [bros2];
    }
  }, [files, temperatures]);

  // Track dirty file IDs
  const dirtyFileIds = useMemo(
    () => new Set(files.filter((f) => f.is_dirty === 1).map((f) => f.id)),
    [files]
  );

  // Filter workstreams — BROS2 filters by accountable/lead, others by member_code
  const matchesMember = (w: typeof allWorkstreams[number], code: string) => {
    if (code === 'BROS2') {
      return w.accountable === 'BROS2' || w.lead.includes('BROS2') || w.member_code === 'BROS2';
    }
    return w.member_code === code;
  };

  const filtered = useMemo(() => {
    let ws = allWorkstreams;
    if (selectedMember) {
      ws = ws.filter((w) => matchesMember(w, selectedMember));
    }
    if (selectedStatus !== 'all') {
      ws = ws.filter((w) => w.status === selectedStatus);
    }
    return ws.sort((a, b) => a.ws_number - b.ws_number);
  }, [allWorkstreams, selectedMember, selectedStatus]);

  // Counts for status pills
  const counts = useMemo(() => {
    const base = selectedMember
      ? allWorkstreams.filter((w) => matchesMember(w, selectedMember))
      : allWorkstreams;
    return {
      all: base.length,
      ok: base.filter((w) => w.status === 'ok').length,
      att: base.filter((w) => w.status === 'att').length,
      blk: base.filter((w) => w.status === 'blk').length,
    };
  }, [allWorkstreams, selectedMember]);

  const selectedWorkstream = selectedWsId
    ? allWorkstreams.find((w) => w.id === selectedWsId) ?? null
    : null;

  if (files.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold text-navy mb-4">Registre PDCA</h2>
        <p className="text-sm text-gray-500">
          Configurez la connexion S3 dans Parametres, puis synchronisez pour afficher les workstreams.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Team sidebar */}
      <div className="w-56 border-r border-gray-200 bg-white p-3 flex flex-col gap-2 overflow-y-auto">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-1">
          Equipiers
        </h3>
        <button
          onClick={() => setSelectedMember(null)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedMember === null
              ? 'bg-navy text-white'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Tous
          <span className="ml-1 text-xs opacity-60">{allWorkstreams.length} workstreams</span>
        </button>
        {team.map((m) => (
          <TeamMemberCard
            key={m.code}
            member={m}
            isSelected={selectedMember === m.code}
            editable
            onTemperatureChange={(value) => {
              setTemperature(m.code, value);
              // Mark individual PDCA file dirty if it exists
              const fileId = `TEAM-OPS-PDCA-${m.code}`;
              db.files.get(fileId).then((f) => {
                if (f) {
                  db.files.update(fileId, { is_dirty: 1, last_edited_at: new Date().toISOString() });
                }
              });
            }}
            onClick={() =>
              setSelectedMember(selectedMember === m.code ? null : m.code)
            }
          />
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Filters */}
        <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-2">
          <StatusPill
            status="all"
            label="Tous"
            count={counts.all}
            isSelected={selectedStatus === 'all'}
            onClick={() => setSelectedStatus('all')}
          />
          <StatusPill
            status="ok"
            label="En controle"
            count={counts.ok}
            isSelected={selectedStatus === 'ok'}
            onClick={() => setSelectedStatus('ok')}
          />
          <StatusPill
            status="att"
            label="Attention"
            count={counts.att}
            isSelected={selectedStatus === 'att'}
            onClick={() => setSelectedStatus('att')}
          />
          <StatusPill
            status="blk"
            label="Bloque"
            count={counts.blk}
            isSelected={selectedStatus === 'blk'}
            onClick={() => setSelectedStatus('blk')}
          />
          <span className="ml-auto text-xs text-gray-400">
            {filtered.length} workstream{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Workstream table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-3 py-2 w-10">#</th>
                <th className="px-3 py-2">Workstream</th>
                <th className="px-3 py-2 w-24">Lead</th>
                <th className="px-3 py-2 w-12">Statut</th>
                <th className="px-3 py-2 w-36">Echeance</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ws) => (
                <WorkstreamRow
                  key={ws.id}
                  workstream={ws}
                  isSelected={selectedWsId === ws.id}
                  isDirty={dirtyFileIds.has(ws.file_id)}
                  onClick={() =>
                    setSelectedWsId(selectedWsId === ws.id ? null : (ws.id ?? null))
                  }
                />
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">
              Aucun workstream ne correspond aux filtres.
            </p>
          )}
        </div>

        {/* Detail panel */}
        {selectedWorkstream && (
          <DetailPanel
            workstream={selectedWorkstream}
            onClose={() => setSelectedWsId(null)}
          />
        )}
      </div>
    </div>
  );
}
