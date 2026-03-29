import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { loadS3Config, saveS3Config, testConnection } from '../lib/s3Service';
import { pullFromS3 } from '../lib/syncService';
import type { S3Config } from '../types';

const EMPTY_CONFIG: S3Config = {
  bucket: '',
  prefix: '',
  region: 'ca-central-1',
  accessKeyId: '',
  secretAccessKey: '',
};

export default function Settings() {
  const [config, setConfig] = useState<S3Config>(EMPTY_CONFIG);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = loadS3Config();
    if (existing) setConfig(existing);
  }, []);

  const handleSave = () => {
    saveS3Config(config);
    setSaved(true);
    setTestResult(null);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    saveS3Config(config);
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection(config);
      setTestResult(result);
    } catch (err: unknown) {
      setTestResult({ ok: false, error: err instanceof Error ? err.message : 'Erreur inconnue' });
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    saveS3Config(config);
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await pullFromS3(config);
      const parts: string[] = [];
      if (result.pulled > 0) parts.push(`${result.pulled} fichier${result.pulled > 1 ? 's' : ''} synchronise${result.pulled > 1 ? 's' : ''}`);
      if (result.skipped > 0) parts.push(`${result.skipped} ignore${result.skipped > 1 ? 's' : ''}`);
      if (result.conflicts.length > 0) parts.push(`${result.conflicts.length} conflit${result.conflicts.length > 1 ? 's' : ''}`);
      if (result.errors.length > 0) parts.push(`${result.errors.length} erreur${result.errors.length > 1 ? 's' : ''}`);
      setSyncMessage(parts.length > 0 ? parts.join(', ') : 'Aucun fichier trouve');
    } catch (err: unknown) {
      setSyncMessage(err instanceof Error ? err.message : 'Erreur de synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const update = (field: keyof S3Config, value: string) => {
    setConfig({ ...config, [field]: value });
    setSaved(false);
    setTestResult(null);
  };

  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-lg font-semibold text-navy mb-1">Parametres</h2>
      <p className="text-sm text-gray-500 mb-6">Configuration de la connexion AWS S3</p>

      <div className="space-y-4">
        <Field label="Nom du bucket S3" value={config.bucket} onChange={(v) => update('bucket', v)} placeholder="mon-bucket-pdca" />
        <Field label="Prefixe / dossier" value={config.prefix} onChange={(v) => update('prefix', v)} placeholder="BROS2-Team-Ops/" />
        <Field label="Region AWS" value={config.region} onChange={(v) => update('region', v)} placeholder="ca-central-1" />

        <div className="border-t border-gray-200 pt-4 mt-4">
          <p className="text-xs text-gray-400 mb-3">
            Les identifiants sont stockes localement dans le navigateur.
          </p>
          <Field label="AWS Access Key ID" value={config.accessKeyId} onChange={(v) => update('accessKeyId', v)} placeholder="AKIA..." />
          <div className="mt-4">
            <Field label="AWS Secret Access Key" value={config.secretAccessKey} onChange={(v) => update('secretAccessKey', v)} placeholder="••••••••" type="password" />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          {saved ? 'Sauvegarde!' : 'Sauvegarder'}
        </button>

        <button
          onClick={handleTest}
          disabled={testing || !config.bucket || !config.accessKeyId}
          className="px-4 py-2 bg-white text-navy text-sm font-medium rounded-lg border border-navy/20 hover:bg-gray-50 disabled:opacity-40 flex items-center gap-2"
        >
          {testing ? <Loader2 size={14} className="animate-spin" /> : null}
          Tester la connexion
        </button>

        <button
          onClick={handleSync}
          disabled={syncing || !config.bucket || !config.accessKeyId}
          className="px-4 py-2 bg-pt-blue text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-40 flex items-center gap-2"
        >
          {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Sync maintenant
        </button>
      </div>

      {/* Test result */}
      {testResult && (
        <div className={`mt-4 flex items-center gap-2 text-sm ${testResult.ok ? 'text-pastille-ok' : 'text-pastille-blk'}`}>
          {testResult.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {testResult.ok ? 'Connexion reussie' : `Echec: ${testResult.error}`}
        </div>
      )}

      {/* Sync result */}
      {syncMessage && (
        <div className="mt-3 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
          {syncMessage}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-pt-blue"
      />
    </div>
  );
}
