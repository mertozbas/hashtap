# HashTap

### Restoranınız için QR sipariş ve ödeme platformu

> Müşteriniz QR'ı okutur, telefonundan menüyü açar, sipariş verir, öder.
> Sipariş anında mutfağınıza, ödeme doğrudan hesabınıza geçer.
> Garsonunuz yalnızca servisle ilgilenir.

---

## 1. Şu an restoranınızda ne oluyor?

| Sorun | Sonucu |
|-------|--------|
| Garson masaya dört kez gider (bakmak, sipariş, ek sipariş, hesap) | Servis hızı düşer, masa devir oranı düşer |
| Sipariş el yazısıyla alınır, kasaya elden girilir | Yanlış sipariş, kayıp adisyon, gelir kaybı |
| Müşteri hesabı bekler, kart cihazı bekler, fişi bekler | Ortalama 8–12 dakika ek bekleme |
| Yoğun saatlerde garson sayısı yetmez | Müşteri sipariş veremeden çıkar |
| Yabancı müşteri menüyü anlamaz | Garson her ürünü tek tek anlatır |

---

## 2. HashTap ile nasıl olur?

```
   QR'ı oku        →    Menüyü gör       →    Sipariş ver
   (3 saniye)            (kendi telefonunda)    (sepete ekle)

   Öde             →    Mutfak fişi     →     Garson getirir
   (kart / Apple Pay     anında düşer            (her zamanki gibi)
    / Google Pay)
```

**Garson hâlâ servisi yapar, "afiyet olsun" der, tabakları toplar.**
HashTap yalnızca sipariş alma sürecini telefona taşır — restoran ruhunu değil.

---

## 3. Müşteri tarafında deneyim

1. Masadaki QR kodu telefonuyla okutur.
2. Restoranınızın markalı menüsü açılır — fotoğraflı, açıklamalı, çoklu dilli.
3. Beğendiklerini sepete ekler, notlar yazar ("az pişmiş", "soğansız").
4. "Öde" der, kart bilgisini girer veya Apple Pay / Google Pay ile tek dokunuşla onaylar.
5. Ödeme onayını alır, e-Arşiv fişi e-postasına gelir.
6. Sipariş hazırlanırken telefonunda durumu görebilir.

**Hesap bölüştürme:** masadaki herkes kendi siparişini kendi telefonunda öder.
**Bahşiş:** ödeme ekranında %5 / %10 / %15 / özel buton.
**Çoklu dil:** Türkçe, İngilizce ve istediğiniz diğer diller.

---

## 4. Restoran tarafında deneyim

**Mutfak / Bar:** sipariş aynı yazıcılarınızdan, aynı formatta düşer. Personel için hiçbir şey değişmez.

**Kasa:** her sipariş "ödendi" olarak gelir. Z raporu, gün sonu, muhasebe — hepsi her zamanki gibi.

**Yönetim Paneli:** tarayıcı üzerinden açılır, gerçek zamanlı sipariş listesi gösterir:
- Hangi masa ne sipariş etti
- Ödeme durumu
- "Hazır" / "Teslim edildi" işaretleme
- Geçmiş raporlar, en çok satan ürünler, saat/gün analizi

---

## 5. Mevcut sisteminizle çalışır — hiçbir şeyi değiştirmiyoruz

HashTap, restoranınızın **var olan POS / ERP sistemine bağlanır**. Hangi sistemi kullandığınız önemli değil:

| Sisteminiz | Bağlantı yöntemimiz |
|------------|---------------------|
| SambaPOS | Doğrudan API entegrasyonu |
| Adisyo | Doğrudan API entegrasyonu |
| Mikro / Logo / Profit | Bilgisayarınıza küçük bir köprü yazılımı kuruyoruz |
| Yazar kasası ve yazıcısı olan, POS yazılımı olmayan | Wi-Fi'a takılan plug & play küçük cihazımız mutfak/bar yazıcılarınıza fiş bastırır |

**Tek bir sözümüz var:** ne olursa olsun çözüm üretiyoruz. Ön incelemede sisteminize bakar, size özel bağlantı planı çıkarırız.

---

## 6. Çoklu konsept desteği

Aynı işletmede birden fazla mekan / konsept varsa (ana restoran + üst kat bar + nargile + plaj servisi), tek QR ile hepsini yönetebilirsiniz:

- Müşteri tek menüde her konsepti görür.
- Sipariş her konseptin kendi mutfağına / barına otomatik yönlenir.
- Tek hesapta toplanır, tek ödeme alınır.

---

## 7. Para size gelir, biz aracılık etmiyoruz

Bu çok önemli ve çoğu rakipten farkımız:

```
Müşteri ödemesi  →  Güvenli ödeme altyapısı (iyzico/PayTR)  →  Sizin hesabınız
                                                                     (T+1 / T+2)
```

- Para **doğrudan sizin merchant hesabınıza** geçer.
- HashTap paraya hiç dokunmaz, sadece "ödemeyi tetikleyen" sistemdir.
- Ödeme komisyonunu ödeme altyapısı keser (yaygın oran ~%1.7), ek HashTap işlem komisyonu **yok**.
- Hukuki yükümlülük tamamen şeffaf, ek lisans / izin gerektirmez.

---

## 8. Mali fiş — yasalara tam uyum

- Her ödeme sonrası **e-Arşiv fişi** otomatik kesilir.
- Müşterinin e-postasına / SMS'ine gönderilir.
- GİB'e bildirimi otomatik yapılır.
- Mevcut e-Arşiv entegratörünüzle (Foriba, Uyumsoft, Logo eFatura vb.) çalışırız.

---

## 9. Restoranınız için somut faydalar

| Fayda | Etki |
|-------|------|
| Garson, masa başına 4 yerine 1 kez gider | Aynı ekiple daha çok masaya bakar |
| Sipariş–ödeme arası bekleme süresi sıfırlanır | Masa devir oranı yoğun saatlerde **%15–25** artar |
| Sipariş hatası kalkar (yanlış duyma, yanlış yazma) | İade / itiraz oranı düşer |
| Müşteri direkt menüden sipariş verir | "Garson gelmedi, ben de çıktım" kaybı sıfırlanır |
| Yabancı müşteri kendi dilinde menüyü görür | Turist trafiği olan işletmede ortalama sepet **%10–20** büyür |
| Her satışın anlık verisi sizde | Hangi saat ne satıyor, hangi ürün geri kalıyor — net rapor |
| Müşteriden geri bildirim toplama imkânı | Tekrar gelen müşteri oranı artar |

---

## 10. Müşteriniz için somut faydalar

- **Hiç beklemiyor.** Garson sırasını beklemiyor, kart cihazı sırasını beklemiyor, fiş sırasını beklemiyor.
- **Kendi hızında karar veriyor.** Menüyü incelerken garson tepesinde değil.
- **Hesabı kolayca bölüşüyor.** Arkadaşıyla "sen ne yedin" tartışması bitti.
- **Yabancıysa kendi dilinde okuyor.**
- **Fişi e-postasına geliyor**, kağıt kaybolmuyor.

---

## 11. Kurulum — bir akşamda hazır

| Aşama | Süre |
|-------|------|
| Ön inceleme: POS, yazıcı, internet, ödeme altyapısı kontrolü | 1 ziyaret |
| Menünüzün HashTap'a aktarılması (mevcut sisteminizden çekilir) | Otomatik |
| Fotoğraf, açıklama, çoklu dil ekleme — birlikte yaparız | ~30 dakika |
| QR kodlarının masalarınıza yerleştirilmesi | 1 saat |
| Personel eğitimi (panel kullanımı — kısa, basit) | 30 dakika |
| Pilot servis (ilk akşam yanınızdayız) | 1 servis |

**Toplamda 1 hafta içinde canlıya alabiliyoruz.**

---

## 12. Fiyatlandırma

HashTap iki kalemden oluşur. Fiyatlar restoranınızın büyüklüğüne, masa sayısına ve mevcut donanım durumunuza göre belirlenir — birlikte görüşeriz.

| Kalem | İçerik | Fiyatlandırma |
|-------|--------|---------------|
| **Kurulum bedeli** (tek seferlik) | Yazılım lisansı, saha kurulumu, sisteme bağlantı, menü hazırlığı, QR kod baskı, personel eğitimi, gerekirse köprü cihazı, ilk yıl bakım dahil | Görüşmeye açık |
| **Yıllık bakım & destek** (sonraki yıllar) | Güncellemeler, 7/24 teknik destek, uzaktan müdahale, otomatik yedekleme, saha ziyareti (yılda 1-2 gerektiğinde) | Görüşmeye açık |

**Önemli:** Aylık abonelik yok. Sistem kendi bilgisayarınızda, kendi verinizle çalışır — bizim bulutumuzda durmaz. Yıllık bakımı yenilemezseniz sistem çalışmaya devam eder, sadece güncelleme ve destek kesilir.

**Pilot teklifimiz:** İlk birkaç pilot restorana özel kurulum fiyatı. Detayları görüşmede netleştiririz.

---

## 13. Sıkça Sorulan Sorular

**S: Müşterilerim telefon kullanmayı bilmezse?**
Garsonunuz hâlâ klasik şekilde sipariş alabilir. HashTap ek bir kanaldır, mevcut akışı kapatmaz. Pilot restoranlarda müşterilerin **%70–85'i** kendiliğinden QR'ı tercih ediyor.

**S: İnternetim kesilirse?**
Mutfak/bar fişlerini basan cihazımızda **5 dakikalık yerel buffer** vardır. İnternet gelince otomatik gönderir. Müşteri ödemesi anlık olarak yapılamasa bile sipariş kaybolmaz.

**S: Müşteri ödedikten sonra siparişi iptal ederse?**
Ödeme onayından sonra mutfak hazırlığa başlamadan önce 2 dakikalık iptal penceresi tanımlanabilir (ayar). Sonrasında iade restoran panelinden tek tıkla yapılır.

**S: Personelim bunu kullanmayı öğrenebilir mi?**
Restoran paneli iki düğmeli: "Hazır" ve "Teslim edildi". 30 dakikada öğrenilir, mutfaktaki fiş zaten her zamanki gibi.

**S: Veri güvenliği?**
KVKK uyumlu çalışırız. Tüm müşteri verileriniz **kendi restoranınızdaki bilgisayarda** durur; bizim bulutumuza akmaz. Sadece şifrelenmiş gecelik yedek (içeriğini biz de göremeyiz) felaket kurtarma için bulutta tutulur. Kart bilgilerini biz saklamayız — ödeme altyapısı (iyzico) PCI-DSS sertifikalıdır.

**S: Sözleşme ne kadar bağlayıcı?**
Kurulum bedeli tek seferlik, yıllık bakım ise sonraki yıllarda isteğe bağlı. Pilot dönemde memnun kalmazsanız kurulum bedelinin bir kısmı iade edilir (sözleşmede netleştirilir). Yıllık bakım yenilemezseniz sistem çalışmaya devam eder — veri ve yazılım sizin.

**S: Birden fazla şubem var?**
Tek hesap altında tüm şubelerinizi yönetebilirsiniz. Her şube için ayrı menü, ayrı QR seti, ayrı raporlama.

---

## 14. Pilot teklifimiz

Sizi kâğıt üzerinde değil, gerçek bir akşam servisinde görmek istiyoruz.

1. **Ücretsiz ön inceleme:** restoranınızı bir akşam ziyaret edip mevcut akışınızı gözlemliyoruz, size özel teklif hazırlıyoruz.
2. **Pilot kurulum:** 1 hafta içinde canlıya alıyoruz, ilk servis yanınızdayız.
3. **30 günlük değerlendirme:** sayılarla birlikte konuşuyoruz — masa devir oranı, ortalama sepet, garson kapasitesi.
4. Memnun kalırsanız uzun vadeli sözleşmeye geçeriz; kalmazsanız ayrılırız, hiçbir bağlayıcılık yok.

---

## 15. İletişim

**HashTap**
QR sipariş ve ödeme platformu

Detaylı sunum, demo talebi ve pilot başvurusu için bizimle iletişime geçin.

— *Bu sunum HashTap ürün ekibi tarafından hazırlanmıştır. Fiyatlandırma ve teknik detaylar restoranınıza özel olarak şekillenecektir.*
