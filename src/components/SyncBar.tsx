import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Upload, Loader2 } from 'lucide-react';
import { loadS3Config } from '../lib/s3Service';
import { pullFromS3, pushToS3 } from '../lib/syncService';
import { db } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import ConflictDialog from './ConflictDialog';
import type { SyncState } from '../types';

export default function SyncBar() {
  const [syncState, setSyncState] = useState<SyncState>('clean');
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [conflicts, setConflicts] = useState<string[]>([]);

  const dirtyCount = useLiveQuery(
    () => db.files.where('is_dirty').equals(1).count(),
    [],
    0
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      setSyncState('offline');
    } else if (dirtyCount > 0) {
      setSyncState('dirty');
    } else {
      setSyncState('clean');
    }
  }, [isOnline, dirtyCount]);

  const handleSync = useCallback(async () => {
    const config = loadS3Config();
    if (!config) return;
    setSyncState('syncing');
    try {
      const result = await pullFromS3(config);
      setLastSynced(new Date().toLocaleString('fr-CA'));
      if (result.conflicts.length > 0) {
        setConflicts(result.conflicts);
      }
      if (result.errors.length > 0) {
        console.warn('Sync errors:', result.errors);
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncState(dirtyCount > 0 ? 'dirty' : 'clean');
    }
  }, [dirtyCount]);

  const handlePush = useCallback(async () => {
    const config = loadS3Config();
    if (!config) return;
    setSyncState('syncing');
    try {
      const result = await pushToS3(config);
      if (result.errors.length > 0) {
        console.warn('Push errors:', result.errors);
      }
      setLastSynced(new Date().toLocaleString('fr-CA'));
    } catch (err) {
      console.error('Push failed:', err);
    } finally {
      setSyncState('clean');
    }
  }, []);

  const handleConflictResolved = useCallback(() => {
    setConflicts([]);
    setLastSynced(new Date().toLocaleString('fr-CA'));
  }, []);

  const config = loadS3Config();

  return (
    <>
      <div className="flex items-center gap-4 text-sm">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              syncState === 'offline'
                ? 'bg-gray-400'
                : syncState === 'dirty'
                  ? 'bg-pastille-att'
                  : syncState === 'syncing'
                    ? 'bg-accent'
                    : 'bg-pastille-ok'
            }`}
          />
          <span className="text-white/70">
            {syncState === 'offline' && 'Hors ligne'}
            {syncState === 'clean' && lastSynced && `Synchronise ${lastSynced}`}
            {syncState === 'clean' && !lastSynced && 'Pret'}
            {syncState === 'dirty' &&
              `${dirtyCount} modification${dirtyCount > 1 ? 's' : ''} non synchronisee${dirtyCount > 1 ? 's' : ''}`}
            {syncState === 'syncing' && 'Synchronisation en cours...'}
          </span>
        </div>

        {/* Push button */}
        {syncState === 'dirty' && (
          <button
            onClick={handlePush}
            className="flex items-center gap-1.5 px-3 py-1 bg-pastille-att text-white rounded text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <Upload size={13} />
            Push vers S3
          </button>
        )}

        {/* Sync button */}
        <button
          onClick={handleSync}
          disabled={syncState === 'syncing' || syncState === 'offline'}
          className="flex items-center gap-1.5 px-3 py-1 bg-white/15 text-white rounded text-xs hover:bg-white/25 transition-colors disabled:opacity-40"
        >
          {syncState === 'syncing' ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <RefreshCw size={13} />
          )}
          Sync
        </button>
      </div>

      {/* Conflict dialog */}
      {conflicts.length > 0 && config && (
        <ConflictDialog
          fileIds={conflicts}
          config={config}
          onResolved={handleConflictResolved}
          onClose={() => setConflicts([])}
        />
      )}
    </>
  );
}
