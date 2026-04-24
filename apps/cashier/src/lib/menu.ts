export interface MenuItem {
  id: number;
  name: { tr: string; en: string };
  description: { tr: string; en: string };
  image_url: string | null;
  price_kurus: number;
  currency: string;
  allergens: string[];
  dietary: string[];
  prep_time_minutes: number;
  is_featured: boolean;
  modifier_groups: unknown[];
}

export interface MenuCategory {
  id: number;
  name: { tr: string; en: string };
  sequence: number;
  items: MenuItem[];
}

export interface MenuPayload {
  restaurant: { name: string; currency: string; language: string };
  categories: MenuCategory[];
}

export async function fetchPosMenu(): Promise<MenuPayload> {
  const res = await fetch('/v1/pos/menu');
  if (!res.ok) throw new Error(`menu: HTTP ${res.status}`);
  return res.json();
}
