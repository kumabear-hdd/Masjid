const path = require('path');
const fs = require('fs');

// Disk persisten (Render disk / VPS) atau default lokal
const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, '..', 'data');

const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : process.env.DATA_DIR
    ? path.join(dataDir, 'uploads')
    : path.join(__dirname, 'uploads');

function ensureDirs() {
  for (const dir of [dataDir, uploadsDir]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

module.exports = { dataDir, uploadsDir, ensureDirs };
