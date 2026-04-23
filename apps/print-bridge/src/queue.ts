import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import type { KitchenTicket } from './printer.js';

export interface QueueItem {
  id: string;                // ticket id — dedup key
  enqueuedAt: string;
  attempts: number;
  lastAttemptAt?: string;
  lastError?: string;
  ticket: KitchenTicket;
}

/**
 * Basit dosya-tabanlı kalıcı kuyruk. Her sipariş bir JSON dosyası
 * olarak `<queueDir>/pending/<id>.json` altına yazılır. Başarılı
 * baskı sonrası `done/` altına taşınır. Yazıcı offline olduğunda
 * `pending/` dizini birikir; sonraki startup'ta otomatik resume olur.
 *
 * Dedup: aynı id'li sipariş bir kez enqueue edilir (done veya pending).
 */
export class PrintQueue {
  private pendingDir: string;
  private doneDir: string;
  private doneCache = new Set<string>();

  constructor(private dir: string) {
    this.pendingDir = path.join(dir, 'pending');
    this.doneDir = path.join(dir, 'done');
    fs.mkdirSync(this.pendingDir, { recursive: true });
    fs.mkdirSync(this.doneDir, { recursive: true });
  }

  async alreadyHandled(id: string): Promise<boolean> {
    if (this.doneCache.has(id)) return true;
    try {
      await fsp.access(path.join(this.doneDir, `${id}.json`));
      this.doneCache.add(id);
      return true;
    } catch {
      // fall through
    }
    try {
      await fsp.access(path.join(this.pendingDir, `${id}.json`));
      return true;
    } catch {
      return false;
    }
  }

  async enqueue(ticket: KitchenTicket): Promise<QueueItem | null> {
    if (await this.alreadyHandled(ticket.id)) return null;
    const item: QueueItem = {
      id: ticket.id,
      enqueuedAt: new Date().toISOString(),
      attempts: 0,
      ticket,
    };
    await this.writePending(item);
    return item;
  }

  async listPending(): Promise<QueueItem[]> {
    const files = await fsp.readdir(this.pendingDir).catch(() => [] as string[]);
    const items: QueueItem[] = [];
    for (const f of files.sort()) {
      if (!f.endsWith('.json')) continue;
      try {
        const raw = await fsp.readFile(path.join(this.pendingDir, f), 'utf8');
        items.push(JSON.parse(raw) as QueueItem);
      } catch {
        // skip corrupt entry
      }
    }
    return items;
  }

  async markAttempt(item: QueueItem, err?: string): Promise<QueueItem> {
    const updated: QueueItem = {
      ...item,
      attempts: item.attempts + 1,
      lastAttemptAt: new Date().toISOString(),
      lastError: err,
    };
    await this.writePending(updated);
    return updated;
  }

  async markDone(item: QueueItem): Promise<void> {
    const src = path.join(this.pendingDir, `${item.id}.json`);
    const dst = path.join(this.doneDir, `${item.id}.json`);
    const payload = { ...item, completedAt: new Date().toISOString() };
    await fsp.writeFile(dst, JSON.stringify(payload, null, 2) + '\n');
    await fsp.unlink(src).catch(() => undefined);
    this.doneCache.add(item.id);
  }

  private async writePending(item: QueueItem): Promise<void> {
    const tmp = path.join(this.pendingDir, `${item.id}.json.tmp`);
    const final = path.join(this.pendingDir, `${item.id}.json`);
    await fsp.writeFile(tmp, JSON.stringify(item, null, 2) + '\n');
    await fsp.rename(tmp, final);
  }
}
