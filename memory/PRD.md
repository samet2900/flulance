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

## FAZ 3 - Sözleşme & Takip (Gelecek)

### Planlanan Özellikler:
- [ ] İş sözleşme sistemi
- [ ] Kampanya takibi ve milestone'lar
- [ ] Gelişmiş arama ve filtreleme
- [ ] Influencer medya kütüphanesi

---

## FAZ 4 - Premium Özellikler (Gelecek)

### Planlanan Özellikler:
- [ ] Escrow ödeme sistemi
- [ ] Otomatik faturalama
- [ ] AI destekli eşleştirme

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
