# Masjid Assalam — Website Resmi

Website publik Masjid Assalam dengan **sedekah online** (QRIS / transfer bank manual) dan **panel admin** untuk kelola jadwal kegiatan, verifikasi donasi, dan update saldo kas.

## Fitur

### Publik (tanpa login)
- Beranda, Profil, Kas, Program, Sedekah, Kontak
- Form sedekah → kode unik → instruksi pembayaran → upload bukti (opsional)
- Jadwal kegiatan dinamis dari database
- Saldo kas & total donasi bulan ini dari API

### Admin (`/login.html`)
- Login aman (bcrypt + JWT cookie HttpOnly)
- Dashboard statistik
- Verifikasi / tolak donasi (saldo kas otomatis bertambah)
- CRUD jadwal kegiatan
- Update saldo kas & target bulanan

## Stack
- Frontend: HTML, CSS, vanilla JS
- Backend: Node.js + Express
- Database: SQLite (`better-sqlite3`)
- Auth: JWT di cookie HttpOnly

## Cara menjalankan (lokal)

```bash
cd "F:\Masjid Project"
npm install
# salin .env.example → .env lalu sesuaikan
npm run seed   # opsional (server juga auto-bootstrap saat start)
npm start
```

Buka: **http://localhost:3000**

### Kredensial admin default
| Field | Nilai |
|-------|--------|
| Email | `admin@assalam.com` |
| Password | `assalam123` |

**Ganti password di produksi** lewat environment variables sebelum deploy pertama (admin hanya dibuat jika belum ada).

### Variabel lingkungan

```
PORT=3000
SESSION_SECRET=ganti-dengan-string-acak-panjang
ADMIN_EMAIL=admin@assalam.com
ADMIN_PASSWORD=assalam123
ADMIN_NAME=Administrator Masjid
BANK_NAME=BSI
BANK_ACCOUNT=7123456789
BANK_HOLDER=Masjid Assalam
NODE_ENV=development

# Opsional (disk persisten di hosting):
# DATA_DIR=/var/data
# UPLOADS_DIR=/var/data/uploads
```

## Alur sedekah

1. Donatur isi form di `sedekah.html`
2. Sistem membuat kode `SDQ-YYYYMMDD-XXXX`
3. Redirect ke `payment.html?code=...` (QRIS atau rekening bank)
4. Opsional: unggah bukti transfer
5. Admin verifikasi di dashboard → status `verified` → saldo kas bertambah

## Struktur folder

```
├── public/           # Frontend
├── server/
│   ├── index.js
│   ├── db.js
│   ├── paths.js
│   ├── bootstrap.js
│   ├── auth.js
│   ├── seed.js
│   ├── uploads/
│   └── routes/
├── data/
├── Dockerfile
├── railway.toml
├── render.yaml
├── Procfile
├── package.json
└── .env
```

## API ringkas

| Method | Path | Keterangan |
|--------|------|------------|
| POST | `/api/auth/login` | Login admin |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Session admin |
| GET | `/api/schedules` | List jadwal (publik) |
| POST/PUT/DELETE | `/api/schedules` | CRUD (admin) |
| POST | `/api/donations` | Buat donasi |
| GET | `/api/donations/code/:code` | Cek donasi |
| POST | `/api/donations/code/:code/proof` | Upload bukti |
| GET | `/api/donations` | List donasi (admin) |
| PATCH | `/api/donations/:id/status` | Verifikasi (admin) |
| GET/PUT | `/api/kas` | Baca / update kas |
| GET | `/api/health` | Health check |

---

## Deploy gratis (gampang seperti Netlify)

Aplikasi ini **Node + SQLite**, jadi **Netlify/Vercel static tidak cocok**.  
Pilih host yang menjalankan `npm start` 24 jam (bukan cuma HTML).

### 1) Railway — paling mirip “import GitHub → live” (rekomendasi free mudah)

1. Buka [https://railway.app](https://railway.app) → login dengan **GitHub**
2. **New Project** → **Deploy from GitHub repo** → pilih **Masjid**
3. Railway deteksi Node otomatis (`railway.toml` + `npm start`)
4. Tab **Variables** → tambah:

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | string acak panjang (contoh: acak di password manager) |
| `ADMIN_EMAIL` | `admin@assalam.com` |
| `ADMIN_PASSWORD` | **password kuat milikmu** |
| `ADMIN_NAME` | `Administrator Masjid` |
| `BANK_NAME` | `BSI` |
| `BANK_ACCOUNT` | nomor rekening masjid |
| `BANK_HOLDER` | `Masjid Assalam` |

5. **Settings** → **Networking** → **Generate Domain** → dapat URL `https://….up.railway.app`
6. Tunggu deploy **Success** → buka URL + `/login.html` untuk admin

**Catatan free Railway:** trial ~$5 (30 hari), lalu kredit kecil bulanan. Untuk masjid hobby biasanya cukup. Volume/disk opsional biar data SQLite tidak hilang.

### 2) Render Free — gratis tanpa kartu (boleh sleep)

1. [https://dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint** (atau Web Service)
2. Hubungkan repo **Masjid**
3. Build: `npm install` · Start: `npm start` · Health: `/api/health`
4. Isi env sama seperti tabel di atas
5. URL: `https://….onrender.com`

**Gratis**, tapi sleep ~15 menit idle (request pertama lambat). Data file hilang saat redeploy kecuali pakai Disk berbayar.

### 3) Replit — sangat mudah lewat browser (gratis)

1. Buka [https://replit.com](https://replit.com) → **Import from GitHub** → `kumabear-hdd/Masjid`
2. **Run** / set run command: `npm install && npm start`
3. Secrets (env) sama seperti tabel Variables di atas
4. **Deploy** / Publish web (sesuai UI Replit)

Cocok kalau tidak mau pusing CLI. Free tier ada batasan always-on.

### 4) Glitch — free remix

1. [https://glitch.com](https://glitch.com) → **New project** → **Import from GitHub**
2. Repo: `https://github.com/kumabear-hdd/Masjid`
3. Di `.env` (Glitch secrets) isi env production
4. Start command default: `npm start`

Free project bisa sleep / dibatasi traffic.

### Yang **tidak** dipakai
| Platform | Alasan |
|----------|--------|
| **Netlify** | Static/Functions — Express + SQLite + upload file tidak stabil |
| **GitHub Pages** | Hanya static HTML, tanpa API |

### Setelah live (semua host)
- Publik: `https://DOMAIN-KAMU/`
- Admin: `https://DOMAIN-KAMU/login.html`
- Cek sehat: `https://DOMAIN-KAMU/api/health` → `{"ok":true,...}`

**Penting data:** di free tier, file SQLite & bukti transfer sering **ephemeral** (hilang redeploy/sleep). Untuk data penting, nanti pindah ke plan dengan volume/disk atau Postgres.


## Deploy ke Netlify (`*.netlify.app`) — frontend gratis

Netlify **bisa** mem-publish folder `public/` ke domain gratis `https://nama-situs.netlify.app`.

**Batasan penting:** Netlify **tidak** menjalankan Express + SQLite + upload file. Jadi:

| Yang jalan di Netlify saja | Yang butuh backend (Railway/Render) |
|----------------------------|-------------------------------------|
| Tampilan halaman (HTML/CSS) | Sedekah online (simpan donasi) |
| Navigasi, profil, kontak | Login & panel admin |
| Jadwal/kas **dinamis** | Verifikasi donasi, update saldo |

### Langkah cepat — tampilan website di Netlify

1. Buka [https://app.netlify.com](https://app.netlify.com) → login (boleh pakai GitHub)
2. **Add new site** → **Import an existing project** → pilih GitHub → repo **Masjid**
3. Pengaturan build:
   - **Branch:** `main`
   - **Build command:** biarkan kosong (atau biarkan dari `netlify.toml`)
   - **Publish directory:** `public`
4. **Deploy site** → tunggu selesai
5. Dapat URL: `https://random-name-123.netlify.app`  
   (bisa diganti di Site configuration → Domain management → Options → Edit site name)

File `netlify.toml` di repo sudah set `publish = "public"`.

### Supaya sedekah + admin juga jalan (Netlify + Railway)

1. Deploy backend dulu di **Railway** (lihat bagian Railway di atas) → dapat URL mis. `https://masjid-xxx.up.railway.app`
2. Edit `netlify.toml` di repo: **buka komentar** blok `[[redirects]]` dan ganti URL Railway kamu
3. Commit & push → Netlify redeploy otomatis
4. Website di Netlify akan meneruskan `/api/*` ke Railway (proxy)

Alternatif tanpa edit redirect: di `public/site-config.js` set  
`window.MASJID_API_BASE = "https://masjid-xxx.up.railway.app";`  
(login admin lewat cookie lintas-domain bisa bermasalah; proxy di netlify.toml lebih andal).

### Deploy drag-and-drop (tanpa Git)

1. Buka [https://app.netlify.com/drop](https://app.netlify.com/drop)
2. Seret folder **`public`** (bukan folder project utuh) ke halaman itu
3. Selesai — dapat URL `.netlify.app`  
   (update manual tiap kali ganti file)

## Catatan fase 1
- Pembayaran **manual** (bukan Midtrans/Xendit). Gateway otomatis bisa ditambah nanti.
- Tidak ada login jamaah.
- Upload bukti max 3MB, format gambar.
- Admin auto-dibuat saat start jika belum ada (dari env).
