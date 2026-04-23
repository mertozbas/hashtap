import { z } from 'zod';

export const heartbeatServiceHealthSchema = z.enum([
  'healthy',
  'degraded',
  'down',
  'unknown',
]);

export type HeartbeatServiceHealth = z.infer<typeof heartbeatServiceHealthSchema>;

export const heartbeatMetricsSchema = z.object({
  orders_count: z.number().int().nonnegative().default(0),
  errors_count: z.number().int().nonnegative().default(0),
  avg_latency_ms: z.number().nonnegative().default(0),
  payment_success_rate: z.number().min(0).max(1).default(1),
});

export type HeartbeatMetrics = z.infer<typeof heartbeatMetricsSchema>;

export const heartbeatSchema = z.object({
  installation_id: z.string().min(1),
  slug: z.string().min(1),
  version: z.string().min(1),
  uptime_seconds: z.number().int().nonnegative(),
  disk_used_pct: z.number().min(0).max(100),
  memory_used_pct: z.number().min(0).max(100),
  services: z.record(z.string(), heartbeatServiceHealthSchema),
  metrics_24h: heartbeatMetricsSchema.optional(),
  collected_at: z.string().datetime(),
});

export type Heartbeat = z.infer<typeof heartbeatSchema>;

export const heartbeatAckSchema = z.object({
  received_at: z.string().datetime(),
  installation_id: z.string(),
  next_interval_seconds: z.number().int().positive(),
});

export type HeartbeatAck = z.infer<typeof heartbeatAckSchema>;
