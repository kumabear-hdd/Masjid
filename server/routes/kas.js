const express = require('express');
const { db } = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

// Public
router.get('/', (_req, res) => {
  const kas = db.prepare('SELECT * FROM kas_settings WHERE id = 1').get();
  const recent = db
    .prepare(
      `SELECT code, amount, donor_name, is_anonymous, method, status, created_at, verified_at
       FROM donations
       WHERE status = 'verified'
       ORDER BY verified_at DESC
       LIMIT 20`
    )
    .all()
    .map((d) => ({
      ...d,
      donor_name: d.is_anonymous ? 'Hamba Allah' : d.donor_name,
    }));

  return res.json({
    ok: true,
    data: {
      saldo: kas?.saldo || 0,
      target_bulan: kas?.target_bulan || 50000000,
      updated_at: kas?.updated_at,
      recent_donations: recent,
    },
  });
});

// Admin update
router.put('/', requireAuth, (req, res) => {
  const saldo = Number(req.body?.saldo);
  const target_bulan =
    req.body?.target_bulan !== undefined
      ? Number(req.body.target_bulan)
      : undefined;

  if (!Number.isFinite(saldo) || saldo < 0) {
    return res.status(400).json({ error: 'Saldo tidak valid.' });
  }

  if (target_bulan !== undefined) {
    if (!Number.isFinite(target_bulan) || target_bulan < 0) {
      return res.status(400).json({ error: 'Target bulanan tidak valid.' });
    }
    db.prepare(
      `UPDATE kas_settings
       SET saldo = ?, target_bulan = ?, updated_at = datetime('now')
       WHERE id = 1`
    ).run(Math.round(saldo), Math.round(target_bulan));
  } else {
    db.prepare(
      `UPDATE kas_settings
       SET saldo = ?, updated_at = datetime('now')
       WHERE id = 1`
    ).run(Math.round(saldo));
  }

  const kas = db.prepare('SELECT * FROM kas_settings WHERE id = 1').get();
  return res.json({ ok: true, data: kas });
});

module.exports = router;
