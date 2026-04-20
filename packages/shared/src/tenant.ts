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

export const TenantSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
});
export type Tenant = z.infer<typeof TenantSchema>;

export const ConceptSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1),
  posConnectionType: PosConnectionType.optional(),
  posConfig: z.record(z.unknown()).optional(),
});
export type Concept = z.infer<typeof ConceptSchema>;

export const TableSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  label: z.string(),
  qrToken: z.string(),
});
export type Table = z.infer<typeof TableSchema>;
