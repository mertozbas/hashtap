# HashTap

Restoranlar için uçtan uca QR sipariş ve ödeme platformu.

**Kurucu:** Mert Özbaş
**İletişim:** info@hashtagworldcompany.com

## Sayfalar

- `index.html` - Ana sayfa ve ürün tanıtımı
- `prototype.html` - Canlı etkileşimli demo (4 yüzey)
- `sunum.html` - Satış sunumu (14 slayt)
- `docs.html` - Teknik ürün dokümanı

## GitHub Pages ile Yayınlama

Bu proje GitHub Pages ile doğrudan yayınlanabilir:

1. GitHub'da yeni bir repository oluşturun (örn. `hashtap-demo`).
2. Bu klasördeki tüm dosyaları repo'ya push edin:
   ```bash
   git init
   git add .
   git commit -m "HashTap demo paketi"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADI/REPO_ADI.git
   git push -u origin main
   ```
3. GitHub'da repo sayfasında: **Settings → Pages**
4. **Source:** `Deploy from a branch` seçin, **Branch:** `main` / `/ (root)` olarak ayarlayın, kaydedin.
5. Birkaç dakika içinde siteniz `https://KULLANICI_ADI.github.io/REPO_ADI/` adresinde yayına girecek.

`.nojekyll` dosyası zaten mevcut, Jekyll işlemi atlanır.

## Özel Alan Adı (İsteğe Bağlı)

`hashtap.com.tr` gibi bir alan adı bağlamak için:

1. Repo kökünde `CNAME` dosyası oluşturun ve içine alan adınızı yazın.
2. Alan adı sağlayıcınızda DNS kaydı ekleyin:
   - `A` kayıtları: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - veya `CNAME`: `KULLANICI_ADI.github.io`

## Fiyatlandırma

| Paket | Fiyat | İçerik |
|-------|------:|--------|
| A · QR Menü + Ödeme | 80.000 ₺ | Yazılım, mevcut sistem kalır |
| B · QR Menü + Donanım | 120.000 ₺ | QR menü donanımı dahil |
| C · Yazılım + Eksik Donanım | 200.000 ₺ | Yazıcı, tablet, KDS |
| D · Full Kurulum | 350.000 ₺ | Tam bundle, sıfırdan kurulum |
| Aylık Bakım | 1.500 ₺/ay | Opsiyonel, güncelleme + destek |
