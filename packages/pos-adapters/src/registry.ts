import type { PosConnectionType } from '@hashtap/shared';
import type { PosAdapter } from './adapter.js';
import { SambaPosAdapter } from './adapters/sambapos.js';
import { AdisyoAdapter } from './adapters/adisyo.js';
import { LocalAgentAdapter } from './adapters/local-agent.js';
import { PrintBridgeAdapter } from './adapters/print-bridge.js';

export type PosConfig = Record<string, unknown>;

type AdapterFactory = (config: PosConfig) => PosAdapter;

const registry: Record<PosConnectionType, AdapterFactory> = {
  sambapos_api: (c) => new SambaPosAdapter(c),
  adisyo_api: (c) => new AdisyoAdapter(c),
  local_agent: (c) => new LocalAgentAdapter(c),
  db_connector: (c) => {
    throw new Error('db_connector not implemented yet');
  },
  print_bridge: (c) => new PrintBridgeAdapter(c),
  network_printer: (c) => new PrintBridgeAdapter(c),
};

export function createPosAdapter(type: PosConnectionType, config: PosConfig): PosAdapter {
  return registry[type](config);
}
