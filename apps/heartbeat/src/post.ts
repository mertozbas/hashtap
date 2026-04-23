import { request } from 'undici';
import { heartbeatAckSchema, type Heartbeat, type HeartbeatAck } from '@hashtap/shared';

export interface PostResult {
  ok: boolean;
  ack?: HeartbeatAck;
  statusCode?: number;
  error?: string;
}

export async function postHeartbeat(
  opsUrl: string,
  token: string,
  hb: Heartbeat,
): Promise<PostResult> {
  const url = `${opsUrl.replace(/\/$/, '')}/v1/ops/heartbeat`;
  try {
    const { statusCode, body } = await request(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(hb),
    });
    const text = await body.text();
    if (statusCode < 200 || statusCode >= 300) {
      return { ok: false, statusCode, error: text.slice(0, 200) };
    }
    const ack = heartbeatAckSchema.safeParse(JSON.parse(text));
    if (!ack.success) {
      return { ok: false, statusCode, error: 'invalid_ack' };
    }
    return { ok: true, statusCode, ack: ack.data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
