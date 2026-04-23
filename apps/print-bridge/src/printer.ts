import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer';

export interface KitchenTicket {
  id: string;
  tableLabel: string;
  createdAt: string;
  lines: Array<{ name: string; qty: number; note?: string }>;
}

export interface PrinterOptions {
  interfaceAddress: string;
  model: 'epson' | 'star';
  timeoutMs?: number;
}

function buildPrinter(opts: PrinterOptions): ThermalPrinter {
  const type = opts.model === 'star' ? PrinterTypes.STAR : PrinterTypes.EPSON;
  return new ThermalPrinter({
    type,
    interface: opts.interfaceAddress,
    removeSpecialCharacters: false,
    options: { timeout: opts.timeoutMs ?? 3000 },
  });
}

export async function isPrinterReachable(opts: PrinterOptions): Promise<boolean> {
  const printer = buildPrinter(opts);
  try {
    return await printer.isPrinterConnected();
  } catch {
    return false;
  }
}

export async function printKitchenTicket(
  order: KitchenTicket,
  opts: PrinterOptions,
): Promise<void> {
  const printer = buildPrinter(opts);

  const connected = await printer.isPrinterConnected();
  if (!connected) throw new Error(`yazıcıya bağlanılamadı: ${opts.interfaceAddress}`);

  printer.alignCenter();
  printer.bold(true);
  printer.setTextSize(1, 1);
  printer.println(`MASA ${order.tableLabel}`);
  printer.bold(false);
  printer.setTextNormal();
  printer.println(new Date(order.createdAt).toLocaleTimeString('tr-TR'));
  printer.drawLine();
  printer.alignLeft();
  for (const line of order.lines) {
    printer.println(`${line.qty} x ${line.name}`);
    if (line.note) printer.println(`   not: ${line.note}`);
  }
  printer.drawLine();
  printer.alignCenter();
  printer.println(`#${order.id.slice(0, 8)}`);
  printer.cut();

  await printer.execute();
}

export async function printTestReceipt(opts: PrinterOptions): Promise<void> {
  const printer = buildPrinter(opts);
  const connected = await printer.isPrinterConnected();
  if (!connected) throw new Error(`yazıcıya bağlanılamadı: ${opts.interfaceAddress}`);
  printer.alignCenter();
  printer.bold(true);
  printer.println('HashTap');
  printer.bold(false);
  printer.println('print-bridge test baskısı');
  printer.println(new Date().toLocaleString('tr-TR'));
  printer.drawLine();
  printer.println('Her şey yolunda.');
  printer.cut();
  await printer.execute();
}
