require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { ensureDirs } = require('./paths');
const { bootstrap } = require('./bootstrap');
const { db, dataDir, dbPath } = require('./db');

ensureDirs();
bootstrap();

const kas = db.prepare('SELECT * FROM kas_settings WHERE id = 1').get();
console.log(`DB: ${dbPath}`);
console.log(`Data dir: ${dataDir}`);
console.log(`Saldo kas: Rp ${Number(kas.saldo).toLocaleString('id-ID')}`);
console.log('Seed selesai.');
