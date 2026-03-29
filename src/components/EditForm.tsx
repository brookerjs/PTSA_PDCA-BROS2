import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { updateWorkstream, replaceActionsForWorkstream, markFileDirty } from '../lib/dbService';
import type { Workstream, Action, WorkstreamStatus, ActionLabel } from '../types';
import { PASTILLE_COLORS, REVERSE_ACTION_LABEL_MAP } from '../types';

interface Props {
  workstream: Workstream;
  actions: Action[];
  onCancel: () => void;
  onSaved: () => void;
}

export default function EditForm({ workstream, actions, onCancel, onSaved }: Props) {
  const [status, setStatus] = useState<WorkstreamStatus>(workstream.status);
  const [phaseP, setPhaseP] = useState(workstream.phase_p ?? '');
  const [phaseD, setPhaseD] = useState(workstream.phase_d ?? '');
  const [phaseC, setPhaseC] = useState(workstream.phase_c ?? '');
  const [phaseA, setPhaseA] = useState(workstream.phase_a ?? '');
  const [editActions, setEditActions] = useState<Action[]>(
    actions.map((a) => ({ ...a }))
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!workstream.id) return;
    setSaving(true);
    try {
      await updateWorkstream(workstream.id, {
        status,
        phase_p: phaseP || null,
        phase_d: phaseD || null,
        phase_c: phaseC || null,
        phase_a: phaseA || null,
      });
      await replaceActionsForWorkstream(workstream.id, editActions);
      await markFileDirty(workstream.file_id);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const addAction = () => {
    setEditActions([
      ...editActions,
      { text: '', responsible: '', echeance: '', label: 'todo' },
    ]);
  };

  const removeAction = (index: number) => {
    setEditActions(editActions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, field: keyof Action, value: string) => {
    setEditActions(
      editActions.map((a, i) =>
        i === index ? { ...a, [field]: value } : a
      )
    );
  };

  return (
    <div className="border-t border-gray-200 bg-white max-h-[70vh] overflow-y-auto">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-base font-semibold text-navy">{workstream.title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 bg-pastille-ok text-white text-xs font-medium rounded hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Pastille selector */}
      <div className="px-5 py-3 flex items-center gap-2">
        <span className="text-xs text-gray-500 mr-2">Statut:</span>
        {(['ok', 'att', 'blk'] as WorkstreamStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`w-6 h-6 rounded-full border-2 transition-all ${
              status === s ? 'border-navy scale-110' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
            style={{ backgroundColor: PASTILLE_COLORS[s] }}
            title={s === 'ok' ? 'En controle' : s === 'att' ? 'Attention requise' : 'Bloque'}
          />
        ))}
      </div>

      {/* PDCA textareas */}
      <div className="grid grid-cols-2 gap-3 px-5 pb-3">
        <PhaseTextarea label="Planifier" value={phaseP} onChange={setPhaseP} />
        <PhaseTextarea label="Deployer" value={phaseD} onChange={setPhaseD} />
        <PhaseTextarea label="Controler" value={phaseC} onChange={setPhaseC} />
        <PhaseTextarea label="Agir" value={phaseA} onChange={setPhaseA} />
      </div>

      {/* Actions */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Actions
          </h4>
          <button
            onClick={addAction}
            className="flex items-center gap-1 text-xs text-pt-blue hover:underline"
          >
            <Plus size={13} />
            Ajouter une action
          </button>
        </div>
        <div className="space-y-2">
          {editActions.map((action, i) => (
            <div key={i} className="flex items-start gap-2 bg-gray-50 rounded-lg p-2">
              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  value={action.text}
                  onChange={(e) => updateAction(i, 'text', e.target.value)}
                  placeholder="Description de l'action"
                  className="w-full text-sm px-2 py-1 border border-gray-200 rounded"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={action.responsible}
                    onChange={(e) => updateAction(i, 'responsible', e.target.value)}
                    placeholder="Responsable"
                    className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded"
                  />
                  <input
                    type="text"
                    value={action.echeance}
                    onChange={(e) => updateAction(i, 'echeance', e.target.value)}
                    placeholder="Echeance"
                    className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded"
                  />
                  <select
                    value={action.label}
                    onChange={(e) => updateAction(i, 'label', e.target.value as ActionLabel)}
                    className="text-xs px-2 py-1 border border-gray-200 rounded bg-white"
                  >
                    {(['todo', 'inprogress', 'waiting', 'done'] as ActionLabel[]).map((l) => (
                      <option key={l} value={l}>
                        {REVERSE_ACTION_LABEL_MAP[l]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={() => removeAction(i)}
                className="text-gray-400 hover:text-pastille-blk mt-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhaseTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full text-sm px-2.5 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-pt-blue"
      />
    </div>
  );
}
