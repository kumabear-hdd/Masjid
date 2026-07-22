const express = require('express');
const { db } = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

const VALID_STATUS = new Set(['upcoming', 'completed']);
const VALID_CATEGORY = new Set(['kajian', 'sosial', 'renovasi', 'ramadhan', 'lainnya']);

function normalizeSchedule(body) {
  const title = String(body?.title || '').trim();
  const category = String(body?.category || 'kajian').trim().toLowerCase();
  const event_date = String(body?.event_date || body?.date || '').trim();
  const event_time = String(body?.event_time || body?.time || '').trim() || null;
  const location = String(body?.location || '').trim() || null;
  const description = String(body?.description || '').trim() || null;
  const status = String(body?.status || 'upcoming').trim().toLowerCase();

  if (!title) return { error: 'Judul kegiatan wajib diisi.' };
  if (!event_date) return { error: 'Tanggal kegiatan wajib diisi.' };
  if (!VALID_CATEGORY.has(category)) return { error: 'Kategori tidak valid.' };
  if (!VALID_STATUS.has(status)) return { error: 'Status tidak valid.' };

  return {
    title,
    category,
    event_date,
    event_time,
    location,
    description,
    status,
  };
}

// Public list
router.get('/', (req, res) => {
  const status = req.query.status ? String(req.query.status) : null;
  let rows;
  if (status && VALID_STATUS.has(status)) {
    rows = db
      .prepare(
        `SELECT * FROM schedules WHERE status = ? ORDER BY event_date ASC, event_time ASC`
      )
      .all(status);
  } else {
    rows = db
      .prepare(`SELECT * FROM schedules ORDER BY event_date ASC, event_time ASC`)
      .all();
  }
  return res.json({ ok: true, data: rows });
});

router.get('/:id', (req, res) => {
  const row = db
    .prepare('SELECT * FROM schedules WHERE id = ?')
    .get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Jadwal tidak ditemukan.' });
  return res.json({ ok: true, data: row });
});

// Admin CRUD
router.post('/', requireAuth, (req, res) => {
  const data = normalizeSchedule(req.body);
  if (data.error) return res.status(400).json({ error: data.error });

  const result = db
    .prepare(
      `INSERT INTO schedules (title, category, event_date, event_time, location, description, status)
       VALUES (@title, @category, @event_date, @event_time, @location, @description, @status)`
    )
    .run(data);

  const row = db
    .prepare('SELECT * FROM schedules WHERE id = ?')
    .get(result.lastInsertRowid);
  return res.status(201).json({ ok: true, data: row });
});

router.put('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT id FROM schedules WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Jadwal tidak ditemukan.' });

  const data = normalizeSchedule(req.body);
  if (data.error) return res.status(400).json({ error: data.error });

  db.prepare(
    `UPDATE schedules
     SET title = @title,
         category = @category,
         event_date = @event_date,
         event_time = @event_time,
         location = @location,
         description = @description,
         status = @status,
         updated_at = datetime('now')
     WHERE id = @id`
  ).run({ ...data, id });

  const row = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);
  return res.json({ ok: true, data: row });
});

router.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM schedules WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Jadwal tidak ditemukan.' });
  }
  return res.json({ ok: true });
});

module.exports = router;
