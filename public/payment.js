function getCode() {
  const params = new URLSearchParams(window.location.search);
  return (params.get('code') || '').trim().toUpperCase();
}

function statusPill(status) {
  const label = (STATUS_LABEL && STATUS_LABEL[status]) || status;
  return '<span class="status-pill ' + status + '">' + label + '</span>';
}

async function loadDonation() {
  const code = getCode();
  const card = document.getElementById('paymentCard');
  if (!code) {
    card.innerHTML =
      '<p>Kode donasi tidak ditemukan. <a href="sedekah.html">Kembali ke form sedekah</a>.</p>';
    return null;
  }

  try {
    const res = await API.get('/api/donations/code/' + encodeURIComponent(code));
    const d = res.data;
    const pay = d.payment || {};

    document.getElementById('statusLabel').innerHTML = statusPill(d.status);

    let methodHtml = '';
    if (d.method === 'qris') {
      methodHtml =
        '<div class="pay-box qris-wrap">' +
        '<h4>Scan QRIS</h4>' +
        '<img src="' +
        (pay.qris_image || '/qris-masjid.jpeg') +
        '" alt="QRIS Masjid Assalam">' +
        '<p class="pay-hint" style="margin-top:12px;">Pastikan nominal sesuai: <strong>' +
        formatRupiah(d.amount) +
        '</strong></p>' +
        '</div>';
    } else {
      methodHtml =
        '<div class="pay-box">' +
        '<h4>Transfer Bank</h4>' +
        '<div class="pay-row"><span>Bank</span><span class="val">' +
        (pay.bank_name || 'BSI') +
        '</span></div>' +
        '<div class="pay-row"><span>No. Rekening</span><span class="val">' +
        (pay.bank_account || '-') +
        ' <button type="button" class="copy-btn" data-copy="' +
        (pay.bank_account || '') +
        '">Salin</button></span></div>' +
        '<div class="pay-row"><span>Atas Nama</span><span class="val">' +
        (pay.bank_holder || 'Masjid Assalam') +
        '</span></div>' +
        '<div class="pay-row"><span>Berita Transfer</span><span class="val">' +
        d.code +
        ' <button type="button" class="copy-btn" data-copy="' +
        d.code +
        '">Salin</button></span></div>' +
        '</div>';
    }

    card.innerHTML =
      '<p class="pay-hint">Kode donasi Anda</p>' +
      '<div class="pay-code">' +
      d.code +
      '</div>' +
      '<p class="pay-hint">Nominal yang harus dibayar</p>' +
      '<div class="pay-amount">' +
      formatRupiah(d.amount) +
      '</div>' +
      '<div class="pay-row" style="border:none;padding:0 0 12px;"><span>Donatur</span><span class="val">' +
      (d.donor_name || '-') +
      '</span></div>' +
      methodHtml +
      '<h4 style="margin:8px 0 8px;">Langkah selanjutnya</h4>' +
      '<ol class="steps">' +
      '<li>Bayar sesuai nominal di atas</li>' +
      '<li>Simpan bukti transfer</li>' +
      '<li>Unggah bukti di panel sebelah (opsional)</li>' +
      '<li>Tunggu verifikasi admin (biasanya &lt; 1x24 jam)</li>' +
      '</ol>';

    // copy buttons
    card.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const val = btn.getAttribute('data-copy');
        if (!val) return;
        navigator.clipboard.writeText(val).then(function () {
          btn.textContent = 'Tersalin';
          setTimeout(function () {
            btn.textContent = 'Salin';
          }, 1200);
        });
      });
    });

    return d;
  } catch (e) {
    card.innerHTML =
      '<p>' +
      (e.message || 'Donasi tidak ditemukan') +
      '. <a href="sedekah.html">Buat sedekah baru</a>.</p>';
    return null;
  }
}

document.addEventListener('DOMContentLoaded', function () {
  loadDonation();

  document.getElementById('refreshStatus')?.addEventListener('click', loadDonation);

  const form = document.getElementById('proofForm');
  form?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const code = getCode();
    const fileInput = document.getElementById('proofFile');
    if (!code || !fileInput?.files?.length) {
      alert('Pilih file bukti transfer.');
      return;
    }

    const fd = new FormData();
    fd.append('proof', fileInput.files[0]);

    const btn = document.getElementById('proofBtn');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Mengunggah...';

    try {
      await API.request('/api/donations/code/' + encodeURIComponent(code) + '/proof', {
        method: 'POST',
        body: fd,
      });
      const status = document.getElementById('proofStatus');
      status.hidden = false;
      status.textContent = 'Bukti berhasil diunggah. Menunggu verifikasi admin.';
      fileInput.value = '';
      await loadDonation();
    } catch (err) {
      alert(err.message || 'Upload gagal');
    } finally {
      btn.disabled = false;
      btn.innerHTML = original;
    }
  });
});
