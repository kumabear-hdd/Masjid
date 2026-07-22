require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { initDb } = require('./db');

const authRoutes = require('./routes/auth');
const scheduleRoutes = require('./routes/schedules');
const donationRoutes = require('./routes/donations');
const kasRoutes = require('./routes/kas');

initDb();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Uploaded proofs
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API
app.use('/api/auth', authRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/kas', kasRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'masjid-assalam' });
});

// Static frontend
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// SPA-ish fallback for unknown non-API routes → 404 page simple
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  return res.status(404).sendFile(path.join(publicDir, 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Masjid Assalam running at http://localhost:${PORT}`);
});
