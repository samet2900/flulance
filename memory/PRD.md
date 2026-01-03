# FLULANCE - Platform Gereksinimleri Belgesi (PRD)

## Proje Özeti
**FLULANCE**, Markalar (işverenler) ile Influencer'ları (serbest çalışanlar) buluşturan Türkçe bir marketplace platformudur. Amaç, geleneksel ajansların yerini almaktır.

## Kullanıcı Rolleri
1. **Marka (Brand)** - İş ilanı oluşturan, influencer arayan firmalar
2. **Influencer** - İş ilanlarına başvuran içerik üreticileri  
3. **Admin** - Platform yönetimi, kullanıcı/ilan/duyuru yönetimi

## Teknoloji Stack
- **Frontend:** React, TailwindCSS, Axios
- **Backend:** FastAPI, MongoDB (motor), Pydantic
- **Auth:** JWT Session + Google OAuth (Emergent Auth)

---

## Renk Paleti (Logo Uyumlu - Ocak 2026)
- **Ana arka plan:** Siyah (#000000)
- **Gradyan 1:** Fuchsia (#D946EF) → Cyan (#06B6D4)
- **Vurgu renkleri:** Fuchsia-400, Cyan-400
- **Border:** Gray-700/800
- **Metin:** White, Gray-300, Gray-400

---

## FAZ 1 - Temel Akış İyileştirmeleri ✅ TAMAMLANDI (3 Ocak 2026)

### Tamamlanan Özellikler:
- [x] Yeni kullanıcı akışı - giriş sonrası HomeFeed'e yönlendirme
- [x] HomeFeed sayfası - iş ilanları ve pinned duyurular
- [x] Ayrı Duyurular sayfası (/announcements)
- [x] Admin için Duyuru CRUD işlemleri
- [x] Brand profil düzenleme modal'ı (genişletilmiş alanlar)
- [x] İş ilanı oluşturma modal'ı (teslim süresi, revizyon hakkı, içerik gereksinimleri vb.)
- [x] Navbar profil dropdown düzeltmesi
- [x] Tüm dashboard'lara Navbar eklenmesi

### Düzeltilen Hatalar:
- [x] Profil dropdown çalışmıyor hatası
- [x] React Hook kuralları ihlali (Navbar.js)
- [x] Dropdown/select text rengi sorunu

---

## FAZ 2 - İstatistik & Değerlendirme ✅ TAMAMLANDI (3 Ocak 2026)

### Tamamlanan Özellikler:
- [x] **Influencer İstatistikleri** - Yeni "İstatistiklerim" sekmesi
  - Platform bazlı istatistikler (Instagram, TikTok, YouTube, Twitter)
  - Takipçi sayısı, engagement rate gösterimi
  - Toplam erişim hesaplama
  - İstatistik düzenleme modal'ı
- [x] **Değerlendirme Sistemi** - Yeni "Değerlendirmeler" sekmesi
  - 1-5 yıldız puanlama
  - Yorum yazma
  - Ortalama puan ve değerlendirme sayısı özeti
  - Eşleşmeler sekmesinde "Değerlendir" butonu
- [x] **Rozet/Doğrulama Sistemi** - Admin panelinde "Rozetler" sekmesi
  - 4 rozet tipi: Doğrulanmış ✓, Top Influencer ⭐, Yükselen Yıldız 🚀, Yeni Üye 🆕
  - Rozet verme/kaldırma işlemleri
  - Rozet istatistikleri
  - Kullanıcılara rozet atama modal'ı

### Yeni API Endpoint'leri:
- `POST /api/influencer-stats` - İstatistik oluştur/güncelle
- `GET /api/influencer-stats/me` - Kendi istatistiklerini getir
- `GET /api/influencer-stats/{user_id}` - Herhangi bir kullanıcının istatistikleri
- `POST /api/reviews` - Değerlendirme oluştur
- `GET /api/reviews/my-reviews` - Benim hakkımdaki değerlendirmeler
- `POST /api/admin/badges/{user_id}` - Rozet ver (Admin)
- `DELETE /api/admin/badges/{user_id}` - Rozet kaldır (Admin)

---

## FAZ 3 - Sözleşme, Kampanya & Medya ✅ TAMAMLANDI (3 Ocak 2026)

### Tamamlanan Özellikler:
- [x] **Chat'te Dosya/Resim/Video Gönderme**
  - Paperclip butonu ile dosya seçimi
  - Resim, video (max 50MB) ve PDF desteği
  - Gönderilen dosyaların önizlemesi
  - İndirilebilir attachments
- [x] **Sözleşme Sistemi**
  - Sözleşme oluşturma (başlık, açıklama, tutar, ödeme koşulları)
  - Sözleşme imzalama (her iki taraf)
  - Sözleşme durumu takibi (draft, pending, active, completed)
  - Sözleşme tamamlama
- [x] **Kampanya Takibi & Milestone'lar**
  - Milestone oluşturma (başlık, açıklama, tarih, tutar)
  - Milestone teslimi (dosya ile)
  - Milestone onaylama
- [x] **Influencer Medya Kütüphanesi**
  - Dosya yükleme (resim, video, PDF)
  - Etiketleme ve açıklama
  - Dosya tipine göre filtreleme
  - Silme özelliği
- [x] **Gelişmiş Arama & Filtreleme**
  - İş ilanları: kelime arama, kategori, platform, bütçe aralığı, deneyim seviyesi
  - Influencer'lar: uzmanlık, takipçi sayısı, puan filtreleri
  - Sıralama seçenekleri

### Yeni API Endpoint'leri:
- `POST /api/upload` - Genel dosya yükleme
- `POST /api/matches/{match_id}/messages/with-attachment` - Dosyalı mesaj gönderme
- `POST /api/contracts` - Sözleşme oluştur
- `GET /api/contracts/my-contracts` - Sözleşmelerimi getir
- `GET /api/contracts/{contract_id}` - Sözleşme detayı
- `POST /api/contracts/{contract_id}/sign` - Sözleşme imzala
- `POST /api/contracts/{contract_id}/complete` - Sözleşme tamamla
- `POST /api/contracts/{contract_id}/milestones` - Milestone ekle
- `GET /api/contracts/{contract_id}/milestones` - Milestone'ları getir
- `POST /api/milestones/{milestone_id}/submit` - Milestone teslim et
- `POST /api/milestones/{milestone_id}/approve` - Milestone onayla
- `POST /api/media-library` - Medya yükle
- `GET /api/media-library` - Medya listele
- `DELETE /api/media-library/{media_id}` - Medya sil
- `GET /api/search/jobs` - Gelişmiş iş arama
- `GET /api/search/influencers` - Gelişmiş influencer arama

---

## FAZ 4 - Ayarlar Sayfası ✅ TAMAMLANDI (3 Ocak 2026)

### Tamamlanan Özellikler:
- [x] **Profil Ayarları**
  - İsim değiştirme
  - Profil fotoğrafı yükleme
  - Bio/Açıklama düzenleme
- [x] **Hesap Güvenliği**
  - Şifre değiştirme
  - E-posta değiştirme
  - Oturum geçmişi görüntüleme
- [x] **Bildirim Tercihleri**
  - E-posta bildirimleri (yeni iş, başvuru durumu, mesajlar, pazarlama)
  - Uygulama bildirimleri
- [x] **Gizlilik Ayarları**
  - Profil görünürlüğü
  - İstatistik paylaşımı
  - Aramada görünürlük
- [x] **Görünüm** ✅ ÇALIŞIYOR (3 Ocak 2026 - Düzeltildi)
  - Tema seçimi (Koyu/Açık) - ThemeContext ile global yönetim
  - Tema tercihinin localStorage'da saklanması
  - Tüm sayfalarda tema değişikliğinin anında uygulanması
  - Dil seçimi (Türkçe/English) - react-i18next ile çoklu dil desteği ✅
- [x] **Hesap İşlemleri**
  - Hesabı dondurma
  - Hesabı kalıcı silme

### Tema Sistemi Detayları:
- `ThemeContext.js`: Global tema state yönetimi
- `index.css`: CSS override'ları ile light theme stilleri
- Theme butonları: `data-testid="theme-light-btn"` ve `data-testid="theme-dark-btn"`
- Tema tercihini localStorage ve backend API'ye kaydeder

### Dil Sistemi Detayları (3 Ocak 2026):
- `i18n.js`: react-i18next yapılandırması (Sadece Türkçe)
- `locales/tr/translation.json`: Türkçe çeviriler
- İngilizce dil desteği kaldırıldı (kullanıcı isteği)

## FAZ 5 - Sahibinden.com Tarzı HomeFeed ✅ TAMAMLANDI (3 Ocak 2026)

### Tamamlanan Özellikler:
- [x] **Sol Filtreleme Paneli**
  - Kategori filtreleme (açılır/kapanır bölümler)
  - Platform filtreleme (Instagram, TikTok, YouTube, Twitter)
  - Bütçe aralığı (hazır aralıklar + özel min/max)
  - Konum filtreleme (il bazlı)
  - "Temizle" butonu
- [x] **Görünüm Seçenekleri**
  - Grid görünümü (3 sütunlu kartlar)
  - Liste görünümü (satır düzeni, sağda fiyat)
  - Grid/List butonları
- [x] **Sıralama**
  - En Yeni / En Eski
  - Bütçe (Yüksek→Düşük / Düşük→Yüksek)
  - Popülerlik
- [x] **Öne Çıkan Sistem**
  - is_featured ve is_urgent rozet alanları
  - Öne çıkan ilanlar için özel kart stili
  - "VİTRİN" rozeti
- [x] **İş Kartları**
  - Kategori etiketi (pembe)
  - Platform etiketleri (mavi)
  - Fiyat (yeşil)
  - Favori (kalp) butonu
  - Başvur butonu
- [x] **Arama**
  - Başlık, açıklama, marka adı ile arama

## FAZ 5.1 - Premium İlan Özellikleri ✅ TAMAMLANDI (3 Ocak 2026)

### Tamamlanan Özellikler:
- [x] **Öne Çıkan İlan (is_featured)**
  - Marka ilan oluştururken "Öne Çıkan İlan" seçeneği
  - Sarı border ve ⚡ ikon ile görsel toggle
  - "Vitrin" bölümünde gösterim
  - Listelerde en üstte sıralama
  - "ÖNE ÇIKAN" sarı rozet
- [x] **Acil İlan (is_urgent)**
  - Marka ilan oluştururken "Acil İlan" seçeneği
  - Kırmızı border ve ⏰ ikon ile görsel toggle
  - "ACİL" kırmızı rozet
  - Dikkat çekici görünüm
- [x] **Premium Özellikler Bölümü**
  - 👑 Taç ikonu ile başlık
  - "Daha Fazla Görünürlük" rozeti
  - Açıklayıcı metinler
- [x] **Marka Dashboard Entegrasyonu**
  - İlanlarında premium rozetler görünüyor
  - Form validasyonu ve API entegrasyonu

### Test Dosyaları:
- `/app/tests/test_premium_features.py` - 8 backend test

### Yeni API Endpoint'leri:
- `GET /api/settings` - Tüm ayarları getir
- `PUT /api/settings/profile` - Profil güncelle
- `POST /api/settings/profile-photo` - Profil fotoğrafı yükle
- `PUT /api/settings/password` - Şifre değiştir
- `PUT /api/settings/email` - E-posta değiştir
- `PUT /api/settings/notifications` - Bildirim ayarları
- `PUT /api/settings/privacy` - Gizlilik ayarları
- `PUT /api/settings/theme` - Tema değiştir
- `PUT /api/settings/language` - Dil değiştir
- `POST /api/settings/deactivate` - Hesabı dondur
- `DELETE /api/settings/delete-account` - Hesabı sil

---

## FAZ 6 - Admin Onay Sistemi & İlan Yaşam Döngüsü ✅ TAMAMLANDI (3 Ocak 2026)

### Tamamlanan Özellikler:
- [x] **Admin Onay Sistemi**
  - Yeni ilanlar `approval_status='pending'` olarak başlar
  - Pending ilanlar HomeFeed'de görünmez
  - Admin "İş İlanları" sekmesinde pending ilanları görebilir
  - Admin ilanları onaylayabilir veya reddetebilir
  - Reddedilen ilanlara sebep yazılabilir
- [x] **İlan Süresi (Expiration)**
  - İlanlar varsayılan 15 gün sürelidir (`duration_days`)
  - `expires_at` alanı ile bitiş tarihi takibi
  - Süresi dolan ilanlar otomatik olarak HomeFeed'den kaldırılır
  - Marka Dashboard'da "Bitiş" tarihi görünür
- [x] **İlan Yenileme (Renewal)**
  - Markalar ilanlarını "Yenile" butonu ile yenileyebilir
  - Yenileme işlemi `expires_at`'ı 15 gün uzatır
  - Yenilenen ilan tekrar `approval_status='pending'` olur (yeniden onay gerekir)
- [x] **Marka Dashboard İlan Durumları**
  - "Onay Bekliyor" (sarı badge) - pending
  - "Yayında" (yeşil badge) - approved
  - "Reddedildi" (kırmızı badge + red sebebi) - rejected
- [x] **Admin Dashboard İlan Yönetimi**
  - "Onay Bekleyen", "Onaylanan", "Reddedilen", "Tümü" filtreleri
  - "Onayla" butonu (yeşil)
  - "Reddet" butonu (kırmızı) + sebep modal'ı
  - "Sil" butonu
  - İlan detayları (marka, kategori, bütçe, platformlar, tarihler)

### Yeni API Endpoint'leri:
- `GET /api/admin/jobs` - Admin için tüm ilanları listele (filtreli)
- `PUT /api/admin/jobs/{job_id}/approval` - İlan onayla/reddet
- `POST /api/jobs/{job_id}/renew` - İlan yenile (marka)

### Test Dosyaları:
- `/app/tests/test_admin_approval_system.py` - 11 backend test (tümü geçti)

---

## FAZ 7 - Etap 1 Özellikleri ✅ TAMAMLANDI (3 Ocak 2026)

### Tamamlanan Özellikler:
- [x] **Modal Scroll Düzeltmesi**
  - İlan oluşturma modalında başlık artık sabit kalıyor
  - İçerik ayrı scroll alanında
- [x] **Admin Secret Giriş**
  - `/osyo` adresinden admin girişi yapılabiliyor
  - Özel tasarımlı güvenli giriş sayfası
  - Admin dışı kullanıcılar giriş yapamıyor
- [x] **İş Bitti Butonu & Tamamlandı Durumu**
  - Marka ve Influencer dashboard'larında "İş Bitti" butonu
  - Tıklandığında eşleşme "Tamamlandı" olarak işaretleniyor
  - Yeşil badge ile durum gösterimi (✅ Tamamlandı / 🔄 Devam Ediyor)
- [x] **İlan Süresi Gösterimi**
  - Onaylanmış ilanlarda "X gün kaldı" gösterimi
  - 3 günden az: Kırmızı, 7 günden az: Turuncu
  - Clock ikonu ile görsel gösterim
- [x] **Mesaj Okundu Bildirimi**
  - Chat'te gönderilen mesajlarda ✓ işareti
  - Okunmuş mesajlarda ✓✓ işareti (cyan renk)
  - Backend'de `is_read` alanı takibi
- [x] **Mobile Responsive Tasarım**
  - Hamburger menu (mobile cihazlarda)
  - Mobile drawer menü tüm linkleri içeriyor
  - Responsive CSS değişkenleri ve media queries
  - Touch-friendly buton boyutları
- [x] **Favoriler Sayfası**
  - `/favorites` route'u
  - Favorilere eklenen ilanları listeleme
  - Arama ve kategori filtreleme
  - Favori ekleme/çıkarma işlevi
- [x] **Favori Ekleme/Çıkarma**
  - HomeFeed'de kalp ikonu ile favori toggle
  - Backend endpoint'leri: GET/POST/DELETE /api/favorites

### Yeni API Endpoint'leri:
- `PUT /api/matches/{match_id}/complete` - Eşleşmeyi tamamla
- `GET /api/favorites` - Favorileri listele
- `POST /api/favorites/{job_id}` - Favoriye ekle
- `DELETE /api/favorites/{job_id}` - Favoriden çıkar
- `GET /api/favorites/{job_id}/check` - Favori durumunu kontrol et

### Yeni Dosyalar:
- `/app/frontend/src/pages/AdminSecretLogin.js`
- `/app/frontend/src/pages/FavoritesPage.js`
- `/app/tests/test_etap1_features.py` - 15 test (tümü geçti)

### Test Sonuçları:
- Backend: 15/15 ✅
- Frontend: Tüm UI testleri başarılı ✅

---

## Gelecek Özellikler (Kullanıcı İstek Listesi)

### Etap 2 - Temel İletişim (P0):
- [ ] E-posta Bildirimleri - Başvuru, onay, mesaj bildirimleri
- [ ] Şifremi Unuttum - Şifre sıfırlama özelliği
- [ ] Influencer Arama Sayfası - Markalar için filtreleme

### Etap 3 - Admin Panel Geliştirmeleri (P1):
- [ ] Dashboard Grafikleri - İstatistik grafikleri
- [ ] Pop-up Bildirim Yönetimi - Girişteki pop-up içeriğini admin düzenlesin
- [ ] Aktivite Logları - Kullanıcı aktivite takibi
- [ ] Blog/Feed Yönetimi - Admin panelden kontrol
- [ ] Q&A Bölümü Yönetimi - Soru-cevap ekleme/düzenleme
- [ ] Başarı Hikayeleri - Admin panelden kontrol
- [ ] Etkinlikler - Webinar/workshop duyuruları

### Etap 4 - Gamification (P1):
- [ ] Influencer Seviye Sistemi - Bronz → Gümüş → Altın → Elmas
- [ ] Başarı Rozetleri - "İlk İşini Tamamladı" vb.
- [ ] Marka/Influencer Raporları - Aylık özet raporları

### Etap 5 - Gelişmiş Özellikler (P2):
- [ ] Influencer Karşılaştırma - Yan yana karşılaştır
- [ ] Teklif İsteme (Tersine İlan) - Marka brief paylaşır
- [ ] Favori Influencer Listesi - Markaların favori listesi
- [ ] Portföy/Showcase Sayfası - Influencer geçmiş işleri
- [ ] Sosyal Medya Bağlama - Instagram/TikTok API
- [ ] Akıllı İlan Önerileri - Kişiselleştirilmiş öneriler
- [ ] Kategori Alarmı - "Yeni ilan çıkınca haber ver"
- [ ] Son Görülme / Canlı Aktivite - "15 kişi bakıyor"
- [ ] Kimlik Doğrulama - TC/Vergi no (opsiyonel)
- [ ] Anlaşmazlık Çözümü - Admin arabuluculuğu
- [ ] Dijital Sözleşme İmza - Yasal geçerlilik

### Altyapı & SEO (P2):
- [ ] SEO Optimizasyonu - Meta taglar, sitemap
- [ ] Landing Page - Giriş yapmamış kullanıcılar için
- [ ] Push Notification - Tarayıcı bildirimleri

### Gelecek (P3):
- [ ] Mobil Uygulama - React Native
- [ ] Ödeme Sistemi (Stripe) - Premium özellikler için

---

## API Endpoints

### Auth
- `POST /api/auth/register` - Kayıt
- `POST /api/auth/login` - Giriş
- `POST /api/auth/google-session` - Google OAuth
- `GET /api/auth/me` - Mevcut kullanıcı
- `POST /api/auth/logout` - Çıkış

### Brand Profile
- `POST /api/brand-profile` - Profil oluştur/güncelle
- `GET /api/brand-profile/me` - Kendi profilini getir

### Jobs
- `POST /api/jobs` - İş ilanı oluştur
- `GET /api/jobs` - Açık ilanları listele
- `GET /api/jobs/my-jobs` - Kendi ilanlarını getir

### Announcements
- `GET /api/announcements` - Tüm duyurular
- `GET /api/announcements/pinned` - Pinned duyurular
- `POST /api/admin/announcements` - Duyuru oluştur (Admin)
- `PUT /api/admin/announcements/{id}` - Duyuru güncelle (Admin)
- `DELETE /api/admin/announcements/{id}` - Duyuru sil (Admin)

---

## Test Hesapları
- **Admin:** admin@flulance.com / admin123
- **Marka:** marka@test.com / test123
- **Influencer:** ayse@influencer.com / test123

---

## Dosya Yapısı
```
/app/
├── backend/
│   ├── server.py
│   ├── seed_data.py
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   └── ChatBox.js
│   │   ├── pages/
│   │   │   ├── HomeFeed.js
│   │   │   ├── BrandDashboard.js
│   │   │   ├── InfluencerDashboard.js
│   │   │   ├── AdminDashboard.js
│   │   │   └── AnnouncementsPage.js
│   │   └── App.js
│   └── .env
└── tests/
    └── test_flulance_api.py
```
