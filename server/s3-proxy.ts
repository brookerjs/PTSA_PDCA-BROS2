import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

interface S3ProxyConfig {
  bucket: string;
  prefix: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

function createClient(config: S3ProxyConfig): S3Client {
  return new S3Client({
    region: config.region,
    followRegionRedirects: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

export default function s3ProxyPlugin(): Plugin {
  return {
    name: 's3-proxy',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/s3/') || req.method !== 'POST') {
          return next();
        }

        try {
          const body = await readBody(req);
          const config = body as unknown as S3ProxyConfig;
          const route = req.url.replace('/api/s3/', '');

          switch (route) {
            case 'test': {
              try {
                const client = createClient(config);
                await client.send(
                  new ListObjectsV2Command({
                    Bucket: config.bucket,
                    Prefix: config.prefix,
                    MaxKeys: 1,
                  }),
                );
                return sendJson(res, 200, { ok: true });
              } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Unknown error';
                return sendJson(res, 200, { ok: false, error: message });
              }
            }

            case 'list': {
              const client = createClient(config);
              const response = await client.send(
                new ListObjectsV2Command({
                  Bucket: config.bucket,
                  Prefix: config.prefix,
                }),
              );
              const files = (response.Contents ?? [])
                .filter((obj) => obj.Key?.endsWith('.md'))
                .map((obj) => ({
                  key: obj.Key!,
                  lastModified: obj.LastModified?.toISOString() ?? null,
                }));
              return sendJson(res, 200, { files });
            }

            case 'get': {
              const key = body.key as string;
              const client = createClient(config);
              const response = await client.send(
                new GetObjectCommand({
                  Bucket: config.bucket,
                  Key: key,
                }),
              );
              const content = (await response.Body?.transformToString('utf-8')) ?? '';
              return sendJson(res, 200, { content });
            }

            case 'put': {
              const key = body.key as string;
              const content = body.content as string;
              const client = createClient(config);
              await client.send(
                new PutObjectCommand({
                  Bucket: config.bucket,
                  Key: key,
                  Body: content,
                  ContentType: 'text/markdown; charset=utf-8',
                }),
              );
              return sendJson(res, 200, { ok: true });
            }

            default:
              return sendJson(res, 404, { error: `Unknown route: ${route}` });
          }
        } catch (err: unknown) {
          console.error('[s3-proxy]', err);
          const message = err instanceof Error ? err.message : 'Internal proxy error';
          sendJson(res, 500, { error: message });
        }
      });
    },
  };
}
