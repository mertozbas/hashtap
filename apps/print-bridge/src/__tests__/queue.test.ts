import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PrintQueue } from '../queue.js';
import type { KitchenTicket } from '../printer.js';

function ticket(id: string): KitchenTicket {
  return {
    id,
    tableLabel: '4',
    createdAt: new Date().toISOString(),
    lines: [{ name: 'Köfte', qty: 1 }],
  };
}

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ht-queue-'));
});

describe('PrintQueue', () => {
  it('enqueues a new ticket and lists it pending', async () => {
    const q = new PrintQueue(dir);
    const item = await q.enqueue(ticket('a1'));
    expect(item).not.toBeNull();
    const pending = await q.listPending();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.id).toBe('a1');
  });

  it('dedupes by id — second enqueue returns null', async () => {
    const q = new PrintQueue(dir);
    await q.enqueue(ticket('a1'));
    const second = await q.enqueue(ticket('a1'));
    expect(second).toBeNull();
    expect(await q.listPending()).toHaveLength(1);
  });

  it('markDone moves item to done dir', async () => {
    const q = new PrintQueue(dir);
    const item = await q.enqueue(ticket('a1'));
    expect(item).not.toBeNull();
    if (!item) return;
    await q.markDone(item);
    const pending = await q.listPending();
    expect(pending).toHaveLength(0);
    expect(fs.existsSync(path.join(dir, 'done', 'a1.json'))).toBe(true);
  });

  it('alreadyHandled detects done items', async () => {
    const q = new PrintQueue(dir);
    const item = await q.enqueue(ticket('a1'));
    if (!item) throw new Error('no item');
    await q.markDone(item);
    expect(await q.alreadyHandled('a1')).toBe(true);
    expect(await q.alreadyHandled('other')).toBe(false);
  });

  it('markAttempt increments counter and persists', async () => {
    const q = new PrintQueue(dir);
    const item = await q.enqueue(ticket('a1'));
    if (!item) throw new Error('no item');
    const after = await q.markAttempt(item, 'printer_offline');
    expect(after.attempts).toBe(1);
    expect(after.lastError).toBe('printer_offline');
    const pending = await q.listPending();
    expect(pending[0]?.attempts).toBe(1);
  });

  it('listPending sorts by id (insertion order safe)', async () => {
    const q = new PrintQueue(dir);
    await q.enqueue(ticket('001'));
    await q.enqueue(ticket('002'));
    await q.enqueue(ticket('003'));
    const pending = await q.listPending();
    expect(pending.map((p) => p.id)).toEqual(['001', '002', '003']);
  });
});
