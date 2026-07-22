const express = require('express');
const multer = require('multer');
const { db } = require('../db');
const { requireAuth } = require('../auth');
const { uploadsDir, ensureDirs } = require('../paths');

const router = express.Router();

ensureDirs();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(
      file.mimetype
    );
    cb(ok ? null : new Error('File harus berupa gambar (JPG/PNG/WebP).'), ok);
  },
});

function generateCode() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SDQ-${y}${m}${d}-${rand}`;
}

function parseAmount(value) {
  if (typeof value === 'number') return Math.round(value);
  const digits = String(value || '').replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

// Public: create donation
router.post('/', (req, res) => {
  const amount = parseAmount(req.body?.amount);
  const donor_name = String(req.body?.donor_name || req.body?.name || '').trim();
  const whatsapp = String(req.body?.whatsapp || '').trim() || null;
  const email = String(req.body?.email || '').trim() || null;
  const is_anonymous = req.body?.is_anonymous ? 1 : 0;
  const message = String(req.body?.message || '').trim() || null;
  const method = String(req.body?.method || req.body?.payment_method || '')
    .trim()
    .toLowerCase();

  if (!amount || amount < 1000) {
    return res.status(400).json({ error: 'Nominal minimal Rp 1.000.' });
  }
  if (!is_anonymous && !donor_name) {
    return res.status(400).json({ error: 'Nama donatur wajib diisi.' });
  }
  if (!['qris', 'bank'].includes(method)) {
    return res.status(400).json({ error: 'Metode pembayaran tidak valid.' });
  }

  let code = generateCode();
  // ensure unique
  for (let i = 0; i < 5; i++) {
    const exists = db.prepare('SELECT id FROM donations WHERE code = ?').get(code);
    if (!exists) break;
    code = generateCode();
  }

  const result = db
    .prepare(
      `INSERT INTO donations
        (code, amount, donor_name, whatsapp, email, is_anonymous, message, method, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    )
    .run(
      code,
      amount,
      is_anonymous ? 'Hamba Allah' : donor_name,
      whatsapp,
      email,
      is_anonymous,
      message,
      method
    );

  const row = db
    .prepare('SELECT * FROM donations WHERE id = ?')
    .get(result.lastInsertRowid);

  return res.status(201).json({
    ok: true,
    data: {
      ...row,
      payment: {
        bank_name: process.env.BANK_NAME || 'BSI',
        bank_account: process.env.BANK_ACCOUNT || '7123456789',
        bank_holder: process.env.BANK_HOLDER || 'Masjid Assalam',
        qris_image: '/qris-masjid.jpeg',
      },
    },
  });
});

// Public: get donation by code
router.get('/code/:code', (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const row = db.prepare('SELECT * FROM donations WHERE code = ?').get(code);
  if (!row) return res.status(404).json({ error: 'Donasi tidak ditemukan.' });

  return res.json({
    ok: true,
    data: {
      code: row.code,
      amount: row.amount,
      donor_name: row.is_anonymous ? 'Hamba Allah' : row.donor_name,
      method: row.method,
      status: row.status,
      proof_path: row.proof_path,
      message: row.message,
      created_at: row.created_at,
      payment: {
        bank_name: process.env.BANK_NAME || 'BSI',
        bank_account: process.env.BANK_ACCOUNT || '7123456789',
        bank_holder: process.env.BANK_HOLDER || 'Masjid Assalam',
        qris_image: '/qris-masjid.jpeg',
      },
    },
  });
});

// Public: upload proof
router.post('/code/:code/proof', (req, res) => {
  upload.single('proof')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload gagal.' });
    }

    const code = String(req.params.code || '').trim().toUpperCase();
    const row = db.prepare('SELECT * FROM donations WHERE code = ?').get(code);
    if (!row) return res.status(404).json({ error: 'Donasi tidak ditemukan.' });
    if (row.status === 'verified') {
      return res.status(400).json({ error: 'Donasi sudah diverifikasi.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'File bukti transfer wajib diunggah.' });
    }

    const relative = `/uploads/${req.file.filename}`;
    db.prepare('UPDATE donations SET proof_path = ? WHERE id = ?').run(
      relative,
      row.id
    );

    return res.json({ ok: true, proof_path: relative });
  });
});

// Public stats for sedekah ticker
router.get('/stats/public', (_req, res) => {
  const monthPrefix = new Date().toISOString().slice(0, 7); // YYYY-MM
  const totalRow = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM donations
       WHERE status = 'verified'
         AND created_at LIKE ?`
    )
    .get(`${monthPrefix}%`);

  const countRow = db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM donations
       WHERE status = 'verified'`
    )
    .get();

  const kas = db.prepare('SELECT * FROM kas_settings WHERE id = 1').get();

  return res.json({
    ok: true,
    data: {
      total_month: totalRow.total || 0,
      total_donors: countRow.count || 0,
      target_month: kas?.target_bulan || 50000000,
      saldo_kas: kas?.saldo || 0,
    },
  });
});

// Admin list
router.get('/', requireAuth, (req, res) => {
  const status = req.query.status ? String(req.query.status) : null;
  let rows;
  if (status && ['pending', 'verified', 'rejected'].includes(status)) {
    rows = db
      .prepare(
        `SELECT * FROM donations WHERE status = ? ORDER BY created_at DESC`
      )
      .all(status);
  } else {
    rows = db
      .prepare(`SELECT * FROM donations ORDER BY created_at DESC`)
      .all();
  }
  return res.json({ ok: true, data: rows });
});

// Admin update status
router.patch('/:id/status', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body?.status || '').trim().toLowerCase();
  const admin_note = String(req.body?.admin_note || '').trim() || null;

  if (!['pending', 'verified', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status tidak valid.' });
  }

  const existing = db.prepare('SELECT * FROM donations WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Donasi tidak ditemukan.' });

  const verified_at = status === 'verified' ? new Date().toISOString() : null;

  db.prepare(
    `UPDATE donations
     SET status = ?, admin_note = ?, verified_at = ?
     WHERE id = ?`
  ).run(status, admin_note, verified_at, id);

  // If verified, add to kas saldo (only once when transitioning to verified)
  if (status === 'verified' && existing.status !== 'verified') {
    db.prepare(
      `UPDATE kas_settings
       SET saldo = saldo + ?, updated_at = datetime('now')
       WHERE id = 1`
    ).run(existing.amount);
  }

  // If un-verifying, subtract
  if (status !== 'verified' && existing.status === 'verified') {
    db.prepare(
      `UPDATE kas_settings
       SET saldo = CASE WHEN saldo - ? < 0 THEN 0 ELSE saldo - ? END,
           updated_at = datetime('now')
       WHERE id = 1`
    ).run(existing.amount, existing.amount);
  }

  const row = db.prepare('SELECT * FROM donations WHERE id = ?').get(id);
  return res.json({ ok: true, data: row });
});

// Admin dashboard stats
router.get('/stats/admin', requireAuth, (_req, res) => {
  const pending = db
    .prepare(`SELECT COUNT(*) AS c FROM donations WHERE status = 'pending'`)
    .get().c;
  const verifiedMonth = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS c
       FROM donations
       WHERE status = 'verified'
         AND created_at LIKE ?`
    )
    .get(`${new Date().toISOString().slice(0, 7)}%`);
  const schedules = db
    .prepare(`SELECT COUNT(*) AS c FROM schedules WHERE status = 'upcoming'`)
    .get().c;
  const kas = db.prepare('SELECT * FROM kas_settings WHERE id = 1').get();

  return res.json({
    ok: true,
    data: {
      pending_donations: pending,
      verified_month_total: verifiedMonth.total || 0,
      verified_month_count: verifiedMonth.c || 0,
      upcoming_schedules: schedules,
      saldo_kas: kas?.saldo || 0,
    },
  });
});

module.exports = router;
