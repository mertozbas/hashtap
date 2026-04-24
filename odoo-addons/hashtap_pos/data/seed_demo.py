"""HashTap demo seed — "Zeytin & Tuz" kurgusal restoranı

Çalıştırma:
    docker exec -i odoo-odoo-1 odoo shell -d hashtap --no-http \
        < odoo-addons/hashtap_pos/data/seed_demo.py

Idempotent: zaten seed edilmişse atlar (name="Zeytin & Tuz" kontrolü).
Demo konsept: Alaçatı tarzı lüks Ege lokantası (kurgusal). Terakki Alaçatı
menüsünden ilham alındı; restoran kimliği tamamen uydurulmuştur.
"""
import logging
import secrets
from datetime import datetime, timedelta

from odoo import fields

_logger = logging.getLogger("hashtap.seed_demo")


# ─────────────────────────────────────────────── Yardımcı — idempotency ───
def upsert_allergen(env, code, name_tr, name_en, icon=None):
    rec = env["hashtap.allergen"].search([("code", "=", code)], limit=1)
    vals = {"code": code, "name_tr": name_tr, "name_en": name_en, "icon": icon}
    if rec:
        rec.write(vals)
        return rec
    return env["hashtap.allergen"].create(vals)


def upsert_category(env, name_tr, name_en, sequence):
    rec = env["hashtap.menu.category"].search(
        [("name_tr", "=", name_tr)], limit=1
    )
    vals = {
        "name_tr": name_tr,
        "name_en": name_en,
        "sequence": sequence,
        "active": True,
    }
    if rec:
        rec.write(vals)
        return rec
    return env["hashtap.menu.category"].create(vals)


def upsert_menu_item(
    env,
    *,
    name_tr,
    name_en,
    description_tr,
    description_en,
    price_tl,
    category,
    allergens=(),
    prep_minutes=15,
    featured=False,
    dietary=None,
    modifier_groups=(),
    initial_stock=80,
):
    """Ürünü hem product.template hem hashtap.menu.item olarak kurar."""
    existing = env["hashtap.menu.item"].search(
        [("name_tr", "=", name_tr)], limit=1
    )
    if existing:
        existing.write({
            "category_id": category.id,
            "name_en": name_en,
            "description_tr": description_tr or "",
            "description_en": description_en or "",
            "prep_time_minutes": prep_minutes,
            "is_featured": featured,
            "dietary_tag": dietary,
            "allergen_ids": [(6, 0, [a.id for a in allergens])],
            "modifier_group_ids": [(6, 0, [g.id for g in modifier_groups])],
            "active": True,
        })
        tmpl = existing.product_tmpl_id
        tmpl.write({"list_price": price_tl, "name": name_tr})
        return existing

    tmpl = env["product.template"].create({
        "name": name_tr,
        "detailed_type": "product",
        "list_price": price_tl,
        "standard_price": price_tl * 0.30,
        "sale_ok": True,
        "purchase_ok": False,
    })

    item = env["hashtap.menu.item"].create({
        "product_tmpl_id": tmpl.id,
        "category_id": category.id,
        "name_tr": name_tr,
        "name_en": name_en,
        "description_tr": description_tr or "",
        "description_en": description_en or "",
        "prep_time_minutes": prep_minutes,
        "is_featured": featured,
        "dietary_tag": dietary,
        "allergen_ids": [(6, 0, [a.id for a in allergens])],
        "modifier_group_ids": [(6, 0, [g.id for g in modifier_groups])],
    })

    if initial_stock:
        product = tmpl.product_variant_id
        warehouse = env["stock.warehouse"].search([], limit=1)
        location = warehouse.lot_stock_id
        env["stock.quant"].with_context(inventory_mode=True).create({
            "product_id": product.id,
            "location_id": location.id,
            "inventory_quantity": initial_stock,
        }).action_apply_inventory()

    return item


def upsert_modifier_group(env, name_tr, name_en, *, min_select, max_select, required):
    rec = env["hashtap.modifier.group"].search(
        [("name_tr", "=", name_tr)], limit=1
    )
    vals = {
        "name_tr": name_tr,
        "name_en": name_en,
        "min_select": min_select,
        "max_select": max_select,
        "is_required": required,
        "active": True,
    }
    if rec:
        rec.write(vals)
        return rec
    return env["hashtap.modifier.group"].create(vals)


def upsert_modifier(env, *, group, name_tr, name_en, delta_tl=0.0, sequence=10):
    rec = env["hashtap.modifier"].search(
        [("group_id", "=", group.id), ("name_tr", "=", name_tr)], limit=1
    )
    vals = {
        "group_id": group.id,
        "name_tr": name_tr,
        "name_en": name_en,
        "price_delta": delta_tl,
        "sequence": sequence,
        "active": True,
    }
    if rec:
        rec.write(vals)
        return rec
    return env["hashtap.modifier"].create(vals)


# ─────────────────────────────────────────────────────── Ana seed ────────
def seed(env):
    company = env.user.company_id

    # 1) Şirket / marka
    try_ccy = env["res.currency"].with_context(active_test=False).search(
        [("name", "=", "TRY")], limit=1,
    )
    if try_ccy and not try_ccy.active:
        try_ccy.active = True
    country_tr = env["res.country"].search([("code", "=", "TR")], limit=1)
    company.write({
        "name": "Zeytin & Tuz",
        "currency_id": try_ccy.id if try_ccy else company.currency_id.id,
        "country_id": country_tr.id if country_tr else False,
        "phone": "+90 (212) 555 01 23",
        "street": "Demo Mahallesi, Sahil Sokak No: 12",
        "city": "Demo",
        "website": "https://zeytinvetuz.demo",
        "email": "merhaba@zeytinvetuz.demo",
    })

    _logger.info("company = %s (currency=%s)", company.name, company.currency_id.name)

    # 2) Allergens
    allergens = {
        "GLU": upsert_allergen(env, "GLU", "Gluten", "Gluten", "wheat"),
        "MLK": upsert_allergen(env, "MLK", "Süt", "Dairy", "milk"),
        "EGG": upsert_allergen(env, "EGG", "Yumurta", "Egg", "egg"),
        "NUT": upsert_allergen(env, "NUT", "Kuruyemiş", "Tree nut", "nut"),
        "FISH": upsert_allergen(env, "FISH", "Balık", "Fish", "fish"),
        "CRU": upsert_allergen(env, "CRU", "Kabuklu Deniz", "Crustacean", "shrimp"),
        "SOY": upsert_allergen(env, "SOY", "Soya", "Soy", "soy"),
        "SUL": upsert_allergen(env, "SUL", "Sülfit", "Sulphite", "sulphite"),
    }

    # 3) Kategoriler
    cat = {
        "baslangic": upsert_category(env, "Başlangıç", "Starters", 10),
        "salata": upsert_category(env, "Salata", "Salad", 20),
        "deniz": upsert_category(env, "Ana Yemek — Deniz", "Mains — Seafood", 30),
        "et": upsert_category(env, "Ana Yemek — Et", "Mains — Meat", 40),
        "garnitur": upsert_category(env, "Garnitür", "Sides", 50),
        "tatli": upsert_category(env, "Tatlı", "Dessert", 60),
        "imza": upsert_category(env, "Bar — İmza Kokteyl", "Bar — Signature Cocktail", 70),
        "klasik": upsert_category(env, "Bar — Klasik Kokteyl", "Bar — Classic Cocktail", 80),
        "sarap_kadeh": upsert_category(env, "Bar — Şarap (Kadeh)", "Bar — Wine (Glass)", 90),
        "sarap_sise": upsert_category(env, "Bar — Şarap (Şişe)", "Bar — Wine (Bottle)", 100),
        "raki": upsert_category(env, "Bar — Rakı", "Bar — Raki", 110),
        "distile": upsert_category(env, "Bar — Distile & Likör", "Bar — Spirits", 120),
        "sampanya": upsert_category(env, "Bar — Şampanya", "Bar — Champagne", 130),
        "sicak": upsert_category(env, "Sıcak İçecek", "Hot Drinks", 140),
        "soguk": upsert_category(env, "Soğuk İçecek", "Cold Drinks", 150),
    }

    # 4) Modifier groupları
    mg_pisirme = upsert_modifier_group(
        env, "Pişirme Derecesi", "Doneness", min_select=1, max_select=1, required=True
    )
    upsert_modifier(env, group=mg_pisirme, name_tr="Az pişmiş", name_en="Rare", sequence=10)
    upsert_modifier(env, group=mg_pisirme, name_tr="Orta az", name_en="Medium rare", sequence=20)
    upsert_modifier(env, group=mg_pisirme, name_tr="Orta", name_en="Medium", sequence=30)
    upsert_modifier(env, group=mg_pisirme, name_tr="Orta iyi", name_en="Medium well", sequence=40)
    upsert_modifier(env, group=mg_pisirme, name_tr="İyi pişmiş", name_en="Well done", sequence=50)

    mg_garnitur = upsert_modifier_group(
        env, "Yan Garnitür", "Side Dish", min_select=1, max_select=1, required=True
    )
    upsert_modifier(env, group=mg_garnitur, name_tr="Confit patates", name_en="Confit potato", sequence=10)
    upsert_modifier(env, group=mg_garnitur, name_tr="Izgara sebze", name_en="Grilled vegetables", sequence=20)
    upsert_modifier(env, group=mg_garnitur, name_tr="Bulgur pilavı", name_en="Bulgur pilaf", sequence=30)
    upsert_modifier(env, group=mg_garnitur, name_tr="Yeşil salata", name_en="Green salad", sequence=40)

    mg_ekstra = upsert_modifier_group(
        env, "Ekstra", "Extras", min_select=0, max_select=3, required=False
    )
    upsert_modifier(env, group=mg_ekstra, name_tr="Ekstra parmesan", name_en="Extra parmesan", delta_tl=50.0, sequence=10)
    upsert_modifier(env, group=mg_ekstra, name_tr="Ekstra chimichurri", name_en="Extra chimichurri", delta_tl=40.0, sequence=20)
    upsert_modifier(env, group=mg_ekstra, name_tr="Ekstra limon", name_en="Extra lemon", delta_tl=0.0, sequence=30)

    mg_sarap_sise = upsert_modifier_group(
        env, "Şişe Açılış Servisi", "Bottle Service", min_select=0, max_select=1, required=False
    )
    upsert_modifier(env, group=mg_sarap_sise, name_tr="Soğutmalı servis", name_en="Chilled service", sequence=10)
    upsert_modifier(env, group=mg_sarap_sise, name_tr="Oda sıcaklığı", name_en="Room temperature", sequence=20)

    # 5) Menü öğeleri
    # Başlangıç
    upsert_menu_item(env, name_tr="Itırlı Tereyağ & Ekşi Mayalı Ekmek", name_en="Herb Butter & Sourdough",
                    description_tr="Şefin ikramı, evin bereketi.", description_en="Chef's courtesy.",
                    price_tl=0.0, category=cat["baslangic"], allergens=[allergens["GLU"], allergens["MLK"]],
                    prep_minutes=2, featured=True)
    upsert_menu_item(env, name_tr="İsli Yoğurt & Kızarmış Patlıcan", name_en="Smoked Yoghurt with Fried Aubergine",
                    description_tr="Közde isli kıvam, köy yoğurdu.", description_en="Woodsmoke depth, village yoghurt.",
                    price_tl=447.84, category=cat["baslangic"], allergens=[allergens["MLK"]], prep_minutes=10)
    upsert_menu_item(env, name_tr="Rakılı Çıtır Ördek", name_en="Crispy Duck with Rakı",
                    description_tr="Ekşi sote radika ile.", description_en="With sautéed radicchio.",
                    price_tl=581.14, category=cat["baslangic"], allergens=[allergens["SUL"]], prep_minutes=18)
    upsert_menu_item(env, name_tr="Izgara Ahtapot", name_en="Grilled Octopus",
                    description_tr="Chimichurri soslu, Ege otları.", description_en="Chimichurri sauce, Aegean herbs.",
                    price_tl=999.18, category=cat["baslangic"], allergens=[allergens["FISH"]], prep_minutes=20, featured=True)
    upsert_menu_item(env, name_tr="Portakallı Enginar", name_en="Orange Artichoke",
                    description_tr="Arpacık soğan ile.", description_en="With pearl onion.",
                    price_tl=777.17, category=cat["baslangic"], dietary="vegetarian", prep_minutes=15)
    upsert_menu_item(env, name_tr="Pancar Carpaccio", name_en="Beetroot Carpaccio",
                    description_tr="Ricotta peyniri ile.", description_en="With ricotta cheese.",
                    price_tl=733.19, category=cat["baslangic"], allergens=[allergens["MLK"]], dietary="vegetarian", prep_minutes=10)
    upsert_menu_item(env, name_tr="Şiş Karides", name_en="Prawn Skewer",
                    description_tr="Izgara, lime & chili mayonez.", description_en="Grilled, lime & chili mayo.",
                    price_tl=892.48, category=cat["baslangic"], allergens=[allergens["CRU"], allergens["EGG"]], prep_minutes=14)
    upsert_menu_item(env, name_tr="Meze Trio (Hardallı humus, girit ezme, cevizli muhammara)",
                    name_en="Mezze Trio", description_tr="Klasik üçlü, büyükçe bir tabak.", description_en="Classic trio, generous plate.",
                    price_tl=739.58, category=cat["baslangic"], allergens=[allergens["NUT"], allergens["SOY"]], dietary="vegetarian", prep_minutes=8)
    upsert_menu_item(env, name_tr="Izgara Ciğer", name_en="Grilled Liver",
                    description_tr="Sumaklı soğan, közde domates.", description_en="Sumac onion, ember tomato.",
                    price_tl=890.35, category=cat["baslangic"], prep_minutes=12)
    upsert_menu_item(env, name_tr="Atom Kokoreç", name_en="Atom Kokoreç",
                    description_tr="Avokado ile, Ege yorumu.", description_en="With avocado.",
                    price_tl=1265.96, category=cat["baslangic"], prep_minutes=15, featured=True)

    # Salata
    upsert_menu_item(env, name_tr="İstanbul Salata", name_en="Istanbul Salad",
                    description_tr="Marul, roka, nar, ceviz.", description_en="Lettuce, rocket, pomegranate, walnut.",
                    price_tl=666.61, category=cat["salata"], allergens=[allergens["NUT"]], dietary="vegetarian", prep_minutes=6)
    upsert_menu_item(env, name_tr="Kuru Bacon & Yedikule Salatası", name_en="Cured Bacon & Yedikule Salad",
                    description_tr="Kuru bacon, yedikule marul, hardal dressing.", description_en="Cured bacon, romaine, mustard dressing.",
                    price_tl=779.61, category=cat["salata"], prep_minutes=8)
    upsert_menu_item(env, name_tr="Çağla Yeşil Salata", name_en="Green Almond Salad",
                    description_tr="Bahar yeşillikleri, çağla, limon.", description_en="Spring greens, green almond, lemon.",
                    price_tl=727.61, category=cat["salata"], dietary="vegan", prep_minutes=6)

    # Ana Yemek — Deniz
    upsert_menu_item(env, name_tr="Izgara Levrek", name_en="Grilled Sea Bass",
                    description_tr="Bütün levrek, limon, zeytinyağı.", description_en="Whole sea bass, lemon, olive oil.",
                    price_tl=1162.85, category=cat["deniz"], allergens=[allergens["FISH"]], prep_minutes=22,
                    modifier_groups=[mg_garnitur, mg_ekstra], featured=True)
    upsert_menu_item(env, name_tr="Vişne Reçelli Minekop", name_en="Meagre with Cherry Preserve",
                    description_tr="Ege minekopu, ev yapımı vişne reçeli.", description_en="Aegean meagre, homemade cherry preserve.",
                    price_tl=1111.41, category=cat["deniz"], allergens=[allergens["FISH"]], prep_minutes=20)
    upsert_menu_item(env, name_tr="Kuru Domatesli Uskumru", name_en="Mackerel with Sun-dried Tomatoes",
                    description_tr="Fırında, kuru domates & kapari.", description_en="Oven-baked, sun-dried tomatoes & capers.",
                    price_tl=1162.85, category=cat["deniz"], allergens=[allergens["FISH"]], prep_minutes=18)
    upsert_menu_item(env, name_tr="Mangolu Levrek Marin", name_en="Mango Marinated Sea Bass",
                    description_tr="Tropikal dokunuş.", description_en="Tropical touch.",
                    price_tl=810.45, category=cat["deniz"], allergens=[allergens["FISH"]], prep_minutes=10)

    # Ana Yemek — Et
    upsert_menu_item(env, name_tr="Kuzu Sırt", name_en="Lamb Loin",
                    description_tr="Sıcak humus, Ege otları.", description_en="Warm hummus, Aegean herbs.",
                    price_tl=1881.81, category=cat["et"], prep_minutes=25, modifier_groups=[mg_pisirme, mg_garnitur], featured=True)
    upsert_menu_item(env, name_tr="Porçini Mantarlı Bonfile", name_en="Tenderloin with Porcini Mushrooms",
                    description_tr="Dana bonfile, porçini jus.", description_en="Beef tenderloin, porcini jus.",
                    price_tl=1881.81, category=cat["et"], prep_minutes=24, modifier_groups=[mg_pisirme, mg_garnitur, mg_ekstra])

    # Garnitür
    upsert_menu_item(env, name_tr="Mersin Patates", name_en="Mersin Potato",
                    description_tr="Domuz pastırması, kül biber.", description_en="Cured pork, ember pepper.",
                    price_tl=1170.51, category=cat["garnitur"], prep_minutes=15)
    upsert_menu_item(env, name_tr="Yeşil Zeytinli Soğan Dolması", name_en="Green Olive Stuffed Onion",
                    description_tr="Küçük bir Ege klasiği.", description_en="A little Aegean classic.",
                    price_tl=521.25, category=cat["garnitur"], dietary="vegan", prep_minutes=10)

    # Tatlı
    upsert_menu_item(env, name_tr="Çıtır Baklava", name_en="Crispy Baklava",
                    description_tr="Antep fıstıklı, dondurma eşliğinde.", description_en="Pistachio, with ice cream.",
                    price_tl=638.38, category=cat["tatli"], allergens=[allergens["NUT"], allergens["MLK"], allergens["GLU"]], prep_minutes=5)
    upsert_menu_item(env, name_tr="Tiramisu", name_en="Tiramisu",
                    description_tr="Klasik, zorlu biraz Türk kahvesi ile.", description_en="Classic, with a Turkish coffee twist.",
                    price_tl=638.38, category=cat["tatli"], allergens=[allergens["MLK"], allergens["EGG"], allergens["GLU"]], prep_minutes=5)
    upsert_menu_item(env, name_tr="Kabak Çiçeği Çikolatalı Mousse", name_en="Zucchini Flower Chocolate Mousse",
                    description_tr="Mevsime özel.", description_en="Seasonal special.",
                    price_tl=550.00, category=cat["tatli"], allergens=[allergens["MLK"], allergens["EGG"]], prep_minutes=6, featured=True)

    # İmza Kokteyl (hepsi 975)
    upsert_menu_item(env, name_tr="Bloom", name_en="Bloom",
                    description_tr="Jäger, limon suyu, yeşil elma, yasemin çayı tonik.", description_en="Jäger, lemon, green apple, jasmine tonic.",
                    price_tl=975.00, category=cat["imza"], prep_minutes=6, featured=True)
    upsert_menu_item(env, name_tr="Medicine", name_en="Medicine",
                    description_tr="Votka, zencefil, bal, lime, sweet sour, soda.", description_en="Vodka, ginger, honey, lime, sweet sour, soda.",
                    price_tl=975.00, category=cat["imza"], prep_minutes=6)
    upsert_menu_item(env, name_tr="Pink Blush", name_en="Pink Blush",
                    description_tr="Çilek, votka, Smirnoff North, sweet sour.", description_en="Strawberry, vodka, Smirnoff North, sweet sour.",
                    price_tl=975.00, category=cat["imza"], prep_minutes=6)
    upsert_menu_item(env, name_tr="Zeytin & Tuz Flame", name_en="Zeytin & Tuz Flame",
                    description_tr="Tekila, aperol, passion fruit, citrus, chili Cardinal.", description_en="Tequila, aperol, passion, citrus, chili Cardinal.",
                    price_tl=975.00, category=cat["imza"], prep_minutes=7, featured=True)
    upsert_menu_item(env, name_tr="Duck & Rush", name_en="Duck & Rush",
                    description_tr="Rakı, Cardinal, fesleğen, citrus, cin.", description_en="Rakı, Cardinal, basil, citrus, gin.",
                    price_tl=975.00, category=cat["imza"], prep_minutes=6)

    # Klasik Kokteyl (hepsi 975)
    for name, prep in [("Negroni", 4), ("Whiskey Sour", 5), ("Margarita", 5), ("Old Fashioned", 5), ("Aperol Spritz", 3)]:
        upsert_menu_item(env, name_tr=name, name_en=name, description_tr="", description_en="",
                        price_tl=975.00, category=cat["klasik"], prep_minutes=prep)

    # Şarap Kadeh
    for name, price in [
        ("Ancyra Cabernet Sauvignon (Kadeh)", 650), ("Urla Tempus (Kadeh)", 950),
        ("İsabey Chardonnay (Kadeh)", 770), ("Urla Serendias Rosé (Kadeh)", 725),
        ("Plato Narince (Kadeh)", 795), ("Ancyra Sauvignon Blanc (Kadeh)", 650),
    ]:
        upsert_menu_item(env, name_tr=name, name_en=name.replace("Kadeh", "Glass"),
                        description_tr="Ege - İç Anadolu bağcılığından.", description_en="Aegean & Anatolian vineyards.",
                        price_tl=price, category=cat["sarap_kadeh"], allergens=[allergens["SUL"]], prep_minutes=2)

    # Şarap Şişe
    for name, price in [
        ("Urla Boğazkere (Şişe)", 4250), ("Paşaeli Yaşlı Asma (Şişe)", 5750),
        ("Kavaklıdere Emir (Şişe)", 3250), ("Sevilen Innocent Rosé (Şişe)", 3300),
    ]:
        upsert_menu_item(env, name_tr=name, name_en=name.replace("Şişe", "Bottle"),
                        description_tr="Şişe — rezerv seçki.", description_en="Bottle — reserve selection.",
                        price_tl=price, category=cat["sarap_sise"], allergens=[allergens["SUL"]],
                        prep_minutes=3, modifier_groups=[mg_sarap_sise])

    # Rakı
    for name, price in [
        ("Tekirdağ Altın 35cl", 2100), ("Tekirdağ Altın 70cl", 3850),
        ("Yeni Rakı Yeni Seri 35cl", 1850), ("Beylerbeyi 70cl", 3985),
    ]:
        upsert_menu_item(env, name_tr=name, name_en=name, description_tr="", description_en="",
                        price_tl=price, category=cat["raki"], prep_minutes=3)

    # Distile & Likör
    for name, price in [
        ("Jack Daniels", 725), ("Chivas 18", 1100), ("Macallan", 1750),
        ("Casamigos Blanco", 577), ("Grey Goose", 830), ("Bombay Sapphire", 790),
        ("Don Julio", 650), ("Hennessy X.O", 1650),
    ]:
        upsert_menu_item(env, name_tr=name, name_en=name, description_tr="", description_en="",
                        price_tl=price, category=cat["distile"], prep_minutes=3)

    # Şampanya
    upsert_menu_item(env, name_tr="Moët (Şişe)", name_en="Moët (Bottle)",
                    description_tr="Klasik brut.", description_en="Classic brut.",
                    price_tl=9000.00, category=cat["sampanya"], allergens=[allergens["SUL"]], prep_minutes=3)
    upsert_menu_item(env, name_tr="Dom Pérignon (Şişe)", name_en="Dom Pérignon (Bottle)",
                    description_tr="Özel gün.", description_en="Special occasion.",
                    price_tl=42000.00, category=cat["sampanya"], allergens=[allergens["SUL"]], prep_minutes=3, featured=True)

    # Sıcak İçecek
    for name, price, prep in [("Türk Kahvesi", 120, 6), ("Espresso", 95, 2), ("Filtre Kahve", 120, 3), ("Çay", 60, 3)]:
        upsert_menu_item(env, name_tr=name, name_en=name, description_tr="", description_en="",
                        price_tl=price, category=cat["sicak"], prep_minutes=prep)

    # Soğuk İçecek
    for name, price in [("Ayran", 85), ("Soda", 75), ("Taze Sıkılmış Portakal", 200), ("Ev Yapımı Limonata", 150)]:
        upsert_menu_item(env, name_tr=name, name_en=name, description_tr="", description_en="",
                        price_tl=price, category=cat["soguk"], prep_minutes=3)

    # 6) Zeminler + Masalar
    floor_model = env["restaurant.floor"]
    floor_ana = floor_model.search([("name", "=", "Ana Salon")], limit=1)
    if not floor_ana:
        floor_ana = floor_model.create({"name": "Ana Salon"})
    floor_teras = floor_model.search([("name", "=", "Teras")], limit=1)
    if not floor_teras:
        floor_teras = floor_model.create({"name": "Teras"})

    table_model = env["restaurant.table"]
    existing_count = table_model.search_count([])
    if existing_count < 10:
        # Eski masaları kapat, yenilerini oluştur
        table_model.search([]).write({"active": False})
        configs = [
            ("A1", floor_ana, 2), ("A2", floor_ana, 2), ("A3", floor_ana, 4),
            ("A4", floor_ana, 4), ("A5", floor_ana, 6), ("A6", floor_ana, 6),
            ("T1", floor_teras, 2), ("T2", floor_teras, 2),
            ("T3", floor_teras, 4), ("T4", floor_teras, 6),
        ]
        for name, floor, seats in configs:
            table_model.create({
                "name": name,
                "identifier": name,
                "floor_id": floor.id,
                "seats": seats,
                "shape": "square",
                "color": "#d4a373",
                "active": True,
                "hashtap_enabled": True,
                "hashtap_qr_slug": secrets.token_hex(4),
            })

    # 7) Ödeme sağlayıcılar — mock (demo) aktif
    pp_model = env["hashtap.payment.provider"]
    mock_pp = pp_model.search([("code", "=", "mock")], limit=1)
    if not mock_pp:
        mock_pp = pp_model.create({
            "name": "Mock (Demo)",
            "code": "mock",
            "active": True,
            "sandbox": True,
        })
    else:
        mock_pp.active = True

    # 7b) Ödeme yöntemleri — demo için hepsi açık
    pm_model = env["hashtap.payment.method"].with_context(active_test=False)
    method_specs = [
        ("card", "Kredi / Banka Kartı (3DS)", "credit-card", 10, True),
        ("apple_pay", "Apple Pay", "smartphone", 20, True),
        ("google_pay", "Google Pay", "smartphone", 30, True),
        ("cash", "Nakit (kasada)", "wallet", 40, False),
        ("pay_at_counter", "Kasada öde (kart/nakit)", "store", 50, False),
    ]
    for code, name, icon, seq, online in method_specs:
        pm = pm_model.search(
            [("code", "=", code), ("company_id", "=", company.id)], limit=1,
        )
        vals = {
            "name": name,
            "code": code,
            "icon": icon,
            "sequence": seq,
            "active": True,
            "provider_id": mock_pp.id if online else False,
        }
        if pm:
            pm.write(vals)
        else:
            pm_model.create(vals)

    # 8) e-Arşiv sağlayıcı — mock
    earsiv_model = env["hashtap.earsiv.provider"]
    mock_earsiv = earsiv_model.search([("code", "=", "mock")], limit=1)
    if not mock_earsiv:
        earsiv_model.create({
            "name": "Mock e-Arşiv (Demo)",
            "code": "mock",
            "active": True,
            "sandbox": True,
        })
    else:
        mock_earsiv.active = True

    # 9) Örnek siparişler — KDS + Cashier'da canlı görünsün
    order_model = env["hashtap.order"]
    order_line_model = env["hashtap.order.line"]
    existing_orders = order_model.search([("state", "in", ["kitchen_sent", "preparing", "ready"])])
    if len(existing_orders) < 3:
        existing_orders.write({"state": "served"})

        tables = table_model.search([("hashtap_enabled", "=", True)], limit=3)
        items_by_name = {i.name_tr: i for i in env["hashtap.menu.item"].search([])}

        def make_order(table, state, line_specs):
            # require_receipt=False: fail-close e-Arşiv gate'ini demo için atla
            order = order_model.create({
                "table_id": table.id,
                "state": "placed",
                "payment_state": "unpaid",
                "require_receipt": False,
            })
            for name, qty, note in line_specs:
                item = items_by_name.get(name)
                if not item:
                    continue
                price_kurus = int(round((item.product_tmpl_id.list_price or 0) * 100))
                order_line_model.create({
                    "order_id": order.id,
                    "item_id": item.id,
                    "item_name": item.name_tr,
                    "unit_price_kurus": price_kurus,
                    "quantity": qty,
                    "note": note or "",
                })
            # Mutfak durumuna güvenli geçiş
            now = fields.Datetime.now()
            order.write({
                "state": state,
                "kitchen_fired_at": now if state in ("kitchen_sent", "preparing", "ready") else False,
                "ready_at": now if state == "ready" else False,
            })
            return order

        if len(tables) >= 1:
            make_order(tables[0], "kitchen_sent", [
                ("Izgara Ahtapot", 1, ""),
                ("İstanbul Salata", 1, "soğansız"),
                ("Tekirdağ Altın 35cl", 1, ""),
            ])
        if len(tables) >= 2:
            make_order(tables[1], "preparing", [
                ("Kuzu Sırt", 2, "orta pişmiş, lütfen aynı anda"),
                ("Izgara Levrek", 1, ""),
                ("Urla Boğazkere (Şişe)", 1, "soğutmalı"),
                ("Çıtır Baklava", 2, ""),
            ])
        if len(tables) >= 3:
            make_order(tables[2], "ready", [
                ("Meze Trio (Hardallı humus, girit ezme, cevizli muhammara)", 1, ""),
                ("Porçini Mantarlı Bonfile", 1, "az pişmiş"),
                ("Dom Pérignon (Şişe)", 1, "kutlama"),
            ])

    env.cr.commit()
    _logger.info("seed tamam — Zeytin & Tuz demo")


# Odoo shell execution
seed(env)
print("✓ HashTap demo seed tamam: Zeytin & Tuz")
