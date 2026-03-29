import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { resolveConflictKeepLocal, resolveConflictTakeRemote } from '../lib/syncService';
import type { S3Config } from '../types';

interface Props {
  fileIds: string[];
  config: S3Config;
  onResolved: () => void;
  onClose: () => void;
}

export default function ConflictDialog({ fileIds, config, onResolved, onClose }: Props) {
  const [resolving, setResolving] = useState(false);

  const handleKeepLocal = async () => {
    setResolving(true);
    try {
      for (const fileId of fileIds) {
        await resolveConflictKeepLocal(config, fileId);
      }
      onResolved();
    } finally {
      setResolving(false);
    }
  };

  const handleTakeRemote = async () => {
    setResolving(true);
    try {
      for (const fileId of fileIds) {
        await resolveConflictTakeRemote(config, fileId);
      }
      onResolved();
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-center gap-3 border-b border-gray-100">
          <div className="w-9 h-9 bg-pastille-att/15 rounded-full flex items-center justify-center">
            <AlertTriangle size={18} className="text-pastille-att" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-navy">Conflit de synchronisation</h3>
            <p className="text-xs text-gray-500">
              {fileIds.length} fichier{fileIds.length > 1 ? 's' : ''} en conflit
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm text-gray-600 mb-3">
            Vos modifications locales sont en conflit avec la version S3. Que voulez-vous faire?
          </p>
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
            {fileIds.map((id) => (
              <div key={id} className="font-mono">{id}</div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={handleKeepLocal}
            disabled={resolving}
            className="flex-1 px-4 py-2.5 bg-pt-blue text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {resolving && <Loader2 size={14} className="animate-spin" />}
            Garder mes modifications
          </button>
          <button
            onClick={handleTakeRemote}
            disabled={resolving}
            className="flex-1 px-4 py-2.5 bg-white text-navy text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {resolving && <Loader2 size={14} className="animate-spin" />}
            Recuperer la version S3
          </button>
        </div>

        {/* Cancel */}
        <div className="px-5 pb-4">
          <button
            onClick={onClose}
            disabled={resolving}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
