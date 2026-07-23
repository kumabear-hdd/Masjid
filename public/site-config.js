/**
 * Konfigurasi frontend.
 *
 * MASJID_API_BASE:
 * - "" (kosong) = API di domain yang sama
 *   → lokal / full Node (Railway) / Netlify + proxy di netlify.toml
 *
 * - URL backend penuh jika frontend Netlify & API di host lain tanpa proxy:
 *   window.MASJID_API_BASE = "https://masjid-production.up.railway.app";
 *
 * Cookie login admin paling andal dengan same-origin (proxy atau full Railway).
 */
window.MASJID_API_BASE = window.MASJID_API_BASE || "";
