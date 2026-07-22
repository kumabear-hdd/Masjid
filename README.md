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
│   ├── uploads/      # Bukti transfer (lokal)
│   └── routes/
├── data/             # masjid.db (dibuat otomatis)
├── render.yaml       # Blueprint Render
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

## Deploy ke Render (disarankan)

Aplikasi ini butuh **Node.js long-running** + filesystem untuk SQLite & upload — **bukan** Netlify static.

### Opsi A — Blueprint (paling cepat)

1. Push kode ke GitHub (`kumabear-hdd/Masjid`)
2. Buka [https://dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**
3. Hubungkan repo **Masjid** (ada `render.yaml`)
4. Isi env `ADMIN_PASSWORD` (dan ganti email bank jika perlu)
5. Deploy → tunggu build → buka URL `https://….onrender.com`

### Opsi B — Web Service manual

1. **New** → **Web Service** → pilih repo Masjid
2. Runtime: **Node**
3. Build: `npm install`
4. Start: `npm start`
5. Health check path: `/api/health`
6. Environment:
   - `NODE_ENV=production`
   - `SESSION_SECRET` = string acak panjang
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME`
   - `BANK_NAME` / `BANK_ACCOUNT` / `BANK_HOLDER`
7. (Disarankan, plan berbayar) **Disk** mount ke `/var/data`, lalu set:
   - `DATA_DIR=/var/data`
   - `UPLOADS_DIR=/var/data/uploads`  
   Tanpa disk, SQLite & bukti transfer **hilang** setiap redeploy (free tier ephemeral).

### Setelah live
- Publik: `https://YOUR-APP.onrender.com`
- Admin: `https://YOUR-APP.onrender.com/login.html`
- Free tier Render **sleep** setelah idle ~15 menit (request pertama bisa lambat).

### Alternatif host
- **Railway** / **Fly.io** / VPS: `npm install` → set env → `npm start` (listen `0.0.0.0:$PORT`)
- **Netlify**: tidak cocok untuk Express + SQLite + upload

## Catatan fase 1
- Pembayaran **manual** (bukan Midtrans/Xendit). Gateway otomatis bisa ditambah nanti.
- Tidak ada login jamaah.
- Upload bukti max 3MB, format gambar.
- Admin auto-dibuat saat start jika belum ada (dari env).
