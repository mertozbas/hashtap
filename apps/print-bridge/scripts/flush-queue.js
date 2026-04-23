#!/usr/bin/env node
// hashtap-print-bridge flush — pending kuyruğundaki ticket'ları temizler.
// KULLANIM DİKKAT: bu script BASKIYI İPTAL EDER. Sadece runbook'tan çağır.
//
//   flush-queue.js            → tüm pending'i done/'a taşır (status: "flushed")
//   flush-queue.js <id1> <id2>  → sadece belirtilen ID'leri temizler

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const queueDir = process.env.QUEUE_DIR || '/var/spool/hashtap';
const pendingDir = path.join(queueDir, 'pending');
const doneDir = path.join(queueDir, 'done');

if (!fs.existsSync(pendingDir)) {
  console.error(`pending dizini yok: ${pendingDir}`);
  process.exit(1);
}
fs.mkdirSync(doneDir, { recursive: true });

const filter = new Set(process.argv.slice(2));

const files = await fsp.readdir(pendingDir);
let moved = 0;
for (const file of files) {
  if (!file.endsWith('.json')) continue;
  const id = file.replace(/\.json$/, '');
  if (filter.size > 0 && !filter.has(id)) continue;
  const src = path.join(pendingDir, file);
  const dst = path.join(doneDir, file);
  const raw = await fsp.readFile(src, 'utf8');
  const item = JSON.parse(raw);
  item.flushedAt = new Date().toISOString();
  item.flushReason = 'manual_flush';
  await fsp.writeFile(dst, JSON.stringify(item, null, 2) + '\n');
  await fsp.unlink(src);
  moved += 1;
  console.log(`flushed ${id}`);
}
console.log(`toplam ${moved} ticket taşındı.`);
