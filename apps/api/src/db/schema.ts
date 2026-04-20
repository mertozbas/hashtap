/**
 * Drizzle ORM şeması. Multi-tenant: her tabloda tenant_id kolonu + RLS politikaları.
 * İlk kurulumda minimal model. Menü sync katmanlı sahiplik için docs/hashcash.md §7.
 */

import { pgTable, uuid, text, timestamp, jsonb, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const orderStatus = pgEnum('order_status', [
  'created',
  'paid',
  'sent_to_pos',
  'in_kitchen',
  'ready',
  'served',
  'cancelled',
  'refunded',
]);

export const posConnectionType = pgEnum('pos_connection_type', [
  'sambapos_api',
  'adisyo_api',
  'local_agent',
  'db_connector',
  'print_bridge',
  'network_printer',
]);

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const concepts = pgTable('concepts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  posConnectionType: posConnectionType('pos_connection_type'),
  posConfig: jsonb('pos_config'),
});

export const tables = pgTable('tables', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  qrToken: text('qr_token').notNull().unique(),
});

export const menuItems = pgTable('menu_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  conceptId: uuid('concept_id').references(() => concepts.id, { onDelete: 'cascade' }),
  nameTr: text('name_tr').notNull(),
  nameEn: text('name_en'),
  descriptionTr: text('description_tr'),
  descriptionEn: text('description_en'),
  photoUrl: text('photo_url'),
  allergens: jsonb('allergens'),
  hidden: boolean('hidden').notNull().default(false),
  posLink: jsonb('pos_link'),
  cachedPrice: integer('cached_price_kurus'),
});

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  tableId: uuid('table_id').references(() => tables.id),
  status: orderStatus('status').notNull().default('created'),
  totalKurus: integer('total_kurus').notNull(),
  items: jsonb('items').notNull(),
  paymentId: text('payment_id'),
  posOrderId: text('pos_order_id'),
  efaturaUuid: text('efatura_uuid'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
});
