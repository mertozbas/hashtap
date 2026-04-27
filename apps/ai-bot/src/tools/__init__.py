"""CEO ajan tool koleksiyonu — agent_factory bunları toplar."""
from .generic import use_hashtap
from .overview import bugun_ozeti, hafta_karsilastirma, peak_saatler
from .orders import aktif_siparisler, masa_durumu
from .menu_stock import en_cok_satan, dusuk_stok
from .reports import gun_raporu

ALL_TOOLS = [
    # Generic — her şeye erişim, escape hatch
    use_hashtap,
    # Convenience — yaygın senaryolar, hızlı + formatlı
    bugun_ozeti,
    aktif_siparisler,
    masa_durumu,
    en_cok_satan,
    dusuk_stok,
    gun_raporu,
    hafta_karsilastirma,
    peak_saatler,
]
