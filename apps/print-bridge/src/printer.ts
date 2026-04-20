import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer';

export interface KitchenTicket {
  id: string;
  tableLabel: string;
  createdAt: string;
  lines: Array<{ name: string; qty: number; note?: string }>;
}

export async function printKitchenTicket(order: KitchenTicket, iface: string): Promise<void> {
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: iface,
    removeSpecialCharacters: false,
    options: { timeout: 3000 }
  });

  const connected = await printer.isPrinterConnected();
  if (!connected) throw new Error(`yazıcıya bağlanılamadı: ${iface}`);

  printer.alignCenter();
  printer.bold(true);
  printer.println(`MASA ${order.tableLabel}`);
  printer.bold(false);
  printer.println(new Date(order.createdAt).toLocaleTimeString('tr-TR'));
  printer.drawLine();
  printer.alignLeft();
  for (const line of order.lines) {
    printer.println(`${line.qty} x ${line.name}`);
    if (line.note) printer.println(`   not: ${line.note}`);
  }
  printer.drawLine();
  printer.println(`#${order.id.slice(0, 8)}`);
  printer.cut();

  await printer.execute();
}
