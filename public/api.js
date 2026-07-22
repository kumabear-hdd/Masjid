// Shared API helpers for Masjid Assalam
const API = {
  async request(path, options = {}) {
    const opts = {
      credentials: 'include',
      headers: {
        ...(options.body && !(options.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...options.headers,
      },
      ...options,
    };

    if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
      opts.body = JSON.stringify(opts.body);
    }

    const res = await fetch(path, opts);
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      const err = new Error((data && data.error) || `Request failed (${res.status})`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  },

  get(path) {
    return this.request(path);
  },

  post(path, body) {
    return this.request(path, { method: 'POST', body });
  },

  put(path, body) {
    return this.request(path, { method: 'PUT', body });
  },

  patch(path, body) {
    return this.request(path, { method: 'PATCH', body });
  },

  delete(path) {
    return this.request(path, { method: 'DELETE' });
  },
};

function formatRupiah(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

function formatDateID(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const CATEGORY_LABEL = {
  kajian: 'Kajian',
  sosial: 'Sosial',
  renovasi: 'Renovasi',
  ramadhan: 'Ramadhan',
  lainnya: 'Lainnya',
};

const STATUS_LABEL = {
  upcoming: 'Akan Datang',
  completed: 'Selesai',
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Ditolak',
};
