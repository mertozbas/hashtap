import { z } from 'zod';

/**
 * Segment B (mevcut POS'u olan restoran) için menü sahiplik modeli —
 * detay docs/integrations/POS_ADAPTERS.md. POS otorite, HashTap sunum katmanı.
 * Segment A'da (Odoo native) bu tipler gateway ↔ Odoo sınırında kullanılır.
 */

export const PosLinkSchema = z.object({
  posProductId: z.string(),
  posName: z.string().optional(),
  posPriceKurus: z.number().int().nonnegative(),
  lastSyncedAt: z.string().datetime().optional(),
});
export type PosLink = z.infer<typeof PosLinkSchema>;

export const MenuItemSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  conceptId: z.string().uuid().nullable(),
  nameTr: z.string().min(1),
  nameEn: z.string().optional(),
  descriptionTr: z.string().optional(),
  descriptionEn: z.string().optional(),
  photoUrl: z.string().url().optional(),
  allergens: z.array(z.string()).optional(),
  hidden: z.boolean().default(false),
  posLink: PosLinkSchema.optional(),
  cachedPriceKurus: z.number().int().nonnegative().optional(),
});
export type MenuItem = z.infer<typeof MenuItemSchema>;

export const MenuSnapshotSchema = z.object({
  tenantId: z.string().uuid(),
  capturedAt: z.string().datetime(),
  items: z.array(MenuItemSchema),
});
export type MenuSnapshot = z.infer<typeof MenuSnapshotSchema>;
