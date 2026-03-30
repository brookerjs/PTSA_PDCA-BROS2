import type { S3Config } from '../types';

const CONFIG_KEY = 'pdca-s3-config';

// === localStorage operations (unchanged) ===

export function saveS3Config(config: S3Config): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function loadS3Config(): S3Config | null {
  const raw = localStorage.getItem(CONFIG_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as S3Config;
  } catch {
    return null;
  }
}

// === S3 operations via dev server proxy ===
// NOTE: These endpoints only work in development (vite dev).
// For production, a real backend or fixed S3 CORS is required.

export interface S3FileEntry {
  key: string;
  lastModified: Date | undefined;
}

async function proxyPost<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/s3/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`S3 proxy error (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function testConnection(
  config: S3Config,
): Promise<{ ok: boolean; error?: string }> {
  return proxyPost<{ ok: boolean; error?: string }>('test', config);
}

export async function listFiles(config: S3Config): Promise<S3FileEntry[]> {
  const data = await proxyPost<{
    files: { key: string; lastModified: string | null }[];
  }>('list', config);

  return data.files.map((f) => ({
    key: f.key,
    lastModified: f.lastModified ? new Date(f.lastModified) : undefined,
  }));
}

export async function getFileContent(
  config: S3Config,
  key: string,
): Promise<string> {
  const data = await proxyPost<{ content: string }>('get', {
    ...config,
    key,
  });
  return data.content;
}

export async function putFileContent(
  config: S3Config,
  key: string,
  content: string,
): Promise<void> {
  await proxyPost<{ ok: boolean }>('put', {
    ...config,
    key,
    content,
  });
}
