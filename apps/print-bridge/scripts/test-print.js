#!/usr/bin/env node
// hashtap-print-bridge test — konfigüre edilmiş yazıcıya test baskısı atar.
// Runbook: docs/runbooks/p1-printer-queue-stuck.md §2.

import { printTestReceipt } from '../dist/printer.js';

const iface = process.env.PRINTER_INTERFACE || 'tcp://192.168.1.100:9100';
const model = process.env.PRINTER_MODEL === 'star' ? 'star' : 'epson';

try {
  await printTestReceipt({ interfaceAddress: iface, model });
  console.log(`OK — ${iface} üstünden test baskısı başarılı.`);
} catch (err) {
  console.error('HATA:', err instanceof Error ? err.message : err);
  process.exit(1);
}
