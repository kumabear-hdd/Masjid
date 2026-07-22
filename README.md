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
- Frontend: HTML, CSS, vanilla JS (UI existing dipertahankan)
- Backend: Node.js + Express
- Database: SQLite (`better-sqlite3`)
- Auth: JWT di cookie HttpOnly

## Cara menjalankan

```bash
cd "F:\Masjid Project"
npm install
# pastikan file .env ada (salin dari .env.example jika perlu)
npm run seed
npm start
```

Buka: **http://localhost:3000**

### Kredensial admin default
| Field | Nilai |
|-------|--------|
| Email | `admin@assalam.com` |
| Password | `assalam123` |

**Ganti password di produksi** lewat `.env` lalu jalankan ulang `npm run seed` (hanya membuat admin jika belum ada — untuk ganti password, hapus baris admin di DB atau update manual).

### Variabel lingkungan (`.env`)

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
│   ├── auth.js
│   ├── seed.js
│   ├── uploads/      # Bukti transfer
│   └── routes/
├── data/             # masjid.db (dibuat otomatis)
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

## Catatan fase 1
- Pembayaran **manual** (bukan Midtrans/Xendit). Gateway otomatis bisa ditambah nanti.
- Tidak ada login jamaah.
- Upload bukti max 3MB, format gambar.

## Deploy singkat
1. Install Node 18+ di VPS/hosting
2. Upload project, `npm install --production`
3. Set `.env` production (`SESSION_SECRET` kuat, `NODE_ENV=production`)
4. `npm run seed && npm start` (atau PM2: `pm2 start server/index.js --name masjid`)
5. Reverse proxy Nginx ke port 3000 + HTTPS
