import { z } from 'zod';

export const PosConnectionType = z.enum([
  'sambapos_api',
  'adisyo_api',
  'local_agent',
  'db_connector',
  'print_bridge',
  'network_printer',
]);
export type PosConnectionType = z.infer<typeof PosConnectionType>;
