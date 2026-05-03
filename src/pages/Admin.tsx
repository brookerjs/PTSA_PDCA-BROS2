import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { addWorkstream, addHelpArticle } from '../lib/dbService';
import type { WorkstreamStatus, NewWorkstreamData } from '../types';
import { PASTILLE_COLORS } from '../types';

export default function Admin() {
  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-navy mb-6">Administration</h2>
      <AddWorkstreamSection />
      <div className="border-t border-gray-200 my-8" />
      <AddHelpArticleSection />
    </div>
  );
}

// === Add Workstream ===

function AddWorkstreamSection() {
  const files = useLiveQuery(() => db.files.toArray(), []) ?? [];

  const memberCodes = files
    .map((f) => {
      const match = /^TEAM-OPS-PDCA-(.+)$/.exec(f.id);
      return match ? match[1] : null;
    })
    .filter((c): c is string => c !== null)
    .sort();

  const [memberCode, setMemberCode] = useState('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<WorkstreamStatus>('att');
  const [phaseP, setPhaseP] = useState('');
  const [phaseD, setPhaseD] = useState('');
  const [phaseC, setPhaseC] = useState('');
  const [phaseA, setPhaseA] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSubmit = async () => {
    if (!memberCode || !title.trim()) {
      setFeedback({ ok: false, msg: 'Équipier et titre sont requis.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const data: NewWorkstreamData = { title: title.trim(), status, phase_p: phaseP, phase_d: phaseD, phase_c: phaseC, phase_a: phaseA };
      await addWorkstream(memberCode, data);
      setFeedback({ ok: true, msg: `Workstream ajouté à ${memberCode}. Fichier marqué dirty — synchronisez via SyncBar.` });
      setTitle('');
      setPhaseP('');
      setPhaseD('');
      setPhaseC('');
      setPhaseA('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setFeedback({ ok: false, msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Ajouter un workstream</h3>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase block mb-1">Équipier</label>
          <select
            value={memberCode}
            onChange={(e) => setMemberCode(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-pt-blue"
          >
            <option value="">Sélectionner un équipier…</option>
            {memberCodes.map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase block mb-1">Titre</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre du workstream"
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pt-blue"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase block mb-2">Statut initial</label>
          <div className="flex items-center gap-3">
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
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PhaseTextarea label="Planifier" value={phaseP} onChange={setPhaseP} />
          <PhaseTextarea label="Déployer" value={phaseD} onChange={setPhaseD} />
          <PhaseTextarea label="Contrôler" value={phaseC} onChange={setPhaseC} />
          <PhaseTextarea label="Agir" value={phaseA} onChange={setPhaseA} />
        </div>

        {feedback && (
          <p className={`text-xs px-3 py-2 rounded-lg ${feedback.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {feedback.msg}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-4 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Ajouter le workstream'}
        </button>
      </div>
    </section>
  );
}

// === Add Help Article ===

function AddHelpArticleSection() {
  const [articleTitle, setArticleTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSubmit = async () => {
    if (!articleTitle.trim()) {
      setFeedback({ ok: false, msg: 'Le titre est requis.' });
      return;
    }
    if (!content.trim()) {
      setFeedback({ ok: false, msg: 'Le contenu est requis.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const now = new Date().toISOString();
      await addHelpArticle({
        title: articleTitle.trim(),
        category: category.trim(),
        content: content.trim(),
        created_at: now,
        updated_at: now,
      });
      setFeedback({ ok: true, msg: 'Article d\'aide créé.' });
      setArticleTitle('');
      setCategory('');
      setContent('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setFeedback({ ok: false, msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Gérer les articles d'aide</h3>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase block mb-1">Titre</label>
          <input
            type="text"
            value={articleTitle}
            onChange={(e) => setArticleTitle(e.target.value)}
            placeholder="Titre de l'article"
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pt-blue"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase block mb-1">Catégorie (optionnel)</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ex: Sync, Workstreams, Navigation…"
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pt-blue"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase block mb-1">Contenu (Markdown)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            placeholder="Rédigez l'article en Markdown…"
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-pt-blue font-mono"
          />
        </div>

        {feedback && (
          <p className={`text-xs px-3 py-2 rounded-lg ${feedback.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {feedback.msg}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-4 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Créer l\'article'}
        </button>
      </div>
    </section>
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
      <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full text-sm px-2.5 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-pt-blue"
      />
    </div>
  );
}
