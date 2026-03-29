import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import type { S3Config } from '../types';

const CONFIG_KEY = 'pdca-s3-config';

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

function createClient(config: S3Config): S3Client {
  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export async function testConnection(config: S3Config): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = createClient(config);
    await client.send(
      new ListObjectsV2Command({
        Bucket: config.bucket,
        Prefix: config.prefix,
        MaxKeys: 1,
      })
    );
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return { ok: false, error: message };
  }
}

export interface S3FileEntry {
  key: string;
  lastModified: Date | undefined;
}

export async function listFiles(config: S3Config): Promise<S3FileEntry[]> {
  const client = createClient(config);
  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: config.bucket,
      Prefix: config.prefix,
    })
  );

  if (!response.Contents) return [];

  return response.Contents
    .filter((obj) => obj.Key?.endsWith('.md'))
    .map((obj) => ({
      key: obj.Key!,
      lastModified: obj.LastModified,
    }));
}

export async function getFileContent(config: S3Config, key: string): Promise<string> {
  const client = createClient(config);
  const response = await client.send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    })
  );

  return (await response.Body?.transformToString('utf-8')) ?? '';
}

export async function putFileContent(
  config: S3Config,
  key: string,
  content: string
): Promise<void> {
  const client = createClient(config);
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: content,
      ContentType: 'text/markdown; charset=utf-8',
    })
  );
}
