require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { db, initDb } = require('./db');

initDb();

const email = (process.env.ADMIN_EMAIL || 'admin@assalam.com').toLowerCase();
const password = process.env.ADMIN_PASSWORD || 'assalam123';
const name = process.env.ADMIN_NAME || 'Administrator Masjid';

const existing = db.prepare('SELECT id FROM admins WHERE email = ?').get(email);
if (!existing) {
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    'INSERT INTO admins (email, password_hash, name) VALUES (?, ?, ?)'
  ).run(email, hash, name);
  console.log(`Admin dibuat: ${email}`);
} else {
  console.log(`Admin sudah ada: ${email}`);
}

const count = db.prepare('SELECT COUNT(*) AS c FROM schedules').get().c;
if (count === 0) {
  const insert = db.prepare(
    `INSERT INTO schedules (title, category, event_date, event_time, location, description, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const samples = [
    [
      'Kajian Rutin Ahad Pagi',
      'kajian',
      '2026-07-26',
      '08:00',
      'Masjid Assalam - Aula Utama',
      'Kajian tafsir Al-Qur\'an bersama ustadz setempat. Terbuka untuk umum.',
      'upcoming',
    ],
    [
      'Program Makan Jumat',
      'sosial',
      '2026-07-25',
      '12:00',
      'Halaman Masjid Assalam',
      'Pembagian paket makan siang untuk jamaah dan dhuafa sekitar masjid.',
      'upcoming',
    ],
    [
      'Renovasi Area Wudhu',
      'renovasi',
      '2026-08-01',
      '09:00',
      'Masjid Assalam',
      'Pengerjaan renovasi fasilitas wudhu putra & putri.',
      'upcoming',
    ],
    [
      'Kajian Ramadhan 1447 H',
      'ramadhan',
      '2026-03-01',
      '19:30',
      'Masjid Assalam',
      'Rangkaian kajian harian selama bulan Ramadhan.',
      'completed',
    ],
  ];

  const tx = db.transaction((rows) => {
    for (const r of rows) insert.run(...r);
  });
  tx(samples);
  console.log(`Seed jadwal: ${samples.length} kegiatan`);
} else {
  console.log(`Jadwal sudah ada (${count}), skip seed jadwal`);
}

const kas = db.prepare('SELECT * FROM kas_settings WHERE id = 1').get();
console.log(`Saldo kas: Rp ${Number(kas.saldo).toLocaleString('id-ID')}`);
console.log('Seed selesai.');
