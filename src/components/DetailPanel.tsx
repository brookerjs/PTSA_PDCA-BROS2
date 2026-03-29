import { useState } from 'react';
import { X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import EditForm from './EditForm';
import type { Workstream, Action } from '../types';
import { PASTILLE_COLORS, PASTILLE_LABELS, ACTION_BADGE_COLORS, REVERSE_ACTION_LABEL_MAP } from '../types';

interface Props {
  workstream: Workstream;
  onClose: () => void;
}

export default function DetailPanel({ workstream, onClose }: Props) {
  const [editing, setEditing] = useState(false);

  const actions: Action[] = useLiveQuery(
    () =>
      workstream.id
        ? db.actions.where('workstream_id').equals(workstream.id).toArray()
        : Promise.resolve([] as Action[]),
    [workstream.id]
  ) ?? [];

  if (editing) {
    return (
      <EditForm
        workstream={workstream}
        actions={actions}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="border-t border-gray-200 bg-white max-h-[60vh] overflow-y-auto">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span
            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: PASTILLE_COLORS[workstream.status] }}
          />
          <div>
            <h3 className="text-base font-semibold text-navy">{workstream.title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {workstream.member_code} · {PASTILLE_LABELS[workstream.status]}
              {workstream.echeance ? ` · ${workstream.echeance}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 bg-pt-blue text-white text-xs font-medium rounded hover:opacity-90 transition-opacity"
          >
            Modifier
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* PDCA grid */}
      <div className="grid grid-cols-2 gap-px bg-gray-100 mx-5 my-4 rounded-lg overflow-hidden">
        <PhaseBlock label="Planifier" content={workstream.phase_p} color="border-l-pt-blue" />
        <PhaseBlock label="Deployer" content={workstream.phase_d} color="border-l-accent" />
        <PhaseBlock label="Controler" content={workstream.phase_c} color="border-l-pastille-att" />
        <PhaseBlock label="Agir" content={workstream.phase_a} color="border-l-pastille-blk" />
      </div>

      {/* Metadata */}
      {(workstream.lien_ga || workstream.dependances || workstream.note_politique) && (
        <div className="px-5 pb-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
          {workstream.lien_ga && (
            <span><span className="font-medium text-gray-600">Lien GA:</span> {workstream.lien_ga}</span>
          )}
          {workstream.dependances && (
            <span><span className="font-medium text-gray-600">Dependances:</span> {workstream.dependances}</span>
          )}
          {workstream.note_politique && (
            <span><span className="font-medium text-gray-600">Acteurs politiques:</span> {workstream.note_politique}</span>
          )}
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="px-5 pb-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Actions
          </h4>
          <div className="space-y-1.5">
            {actions.map((action) => (
              <ActionRow key={action.id} action={action} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PhaseBlock({ label, content, color }: { label: string; content: string | null; color: string }) {
  return (
    <div className={`bg-white p-3 border-l-3 ${color}`}>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</p>
      <p className="text-sm text-gray-700 leading-relaxed">
        {content ?? <span className="text-gray-300 italic">Non defini</span>}
      </p>
    </div>
  );
}

function ActionRow({ action }: { action: Action }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span
        className="mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-white flex-shrink-0"
        style={{ backgroundColor: ACTION_BADGE_COLORS[action.label] }}
      >
        {REVERSE_ACTION_LABEL_MAP[action.label]}
      </span>
      <span className="text-gray-700 flex-1">{action.text}</span>
      <span className="text-xs text-gray-400 flex-shrink-0">{action.responsible}</span>
      <span className="text-xs text-gray-400 flex-shrink-0">{action.echeance}</span>
    </div>
  );
}
