function selectNominal(btn, value) {
  const buttons = btn.parentElement.querySelectorAll('button');
  buttons.forEach((b) => b.classList.remove('selected'));
  btn.classList.add('selected');
  const custom = document.getElementById('custom_nominal');
  if (custom) {
    custom.value = String(value).replace(/\./g, '');
    custom.dataset.selected = '1';
  }
}

function parseNominal(str) {
  const digits = String(str || '').replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

document.addEventListener('DOMContentLoaded', () => {
  API.get('/api/donations/stats/public')
    .then((res) => {
      const d = res.data;
      const amountEl = document.querySelector('.ticker-amount');
      const targetEl = document.querySelector('.ticker-target');
      const fill = document.querySelector('.progress-fill');
      if (amountEl) amountEl.textContent = formatRupiah(d.total_month);
      if (targetEl) {
        const pct =
          d.target_month > 0
            ? Math.min(100, Math.round((d.total_month / d.target_month) * 100))
            : 0;
        targetEl.textContent =
          'Target: ' + formatRupiah(d.target_month) + ' (' + pct + '%)';
        if (fill) fill.style.width = pct + '%';
      }
    })
    .catch(() => {});

  const customInput = document.getElementById('custom_nominal');
  if (customInput) {
    customInput.addEventListener('focus', function () {
      const grid = this.parentElement.previousElementSibling;
      if (!grid) return;
      grid.querySelectorAll('button').forEach((b) => b.classList.remove('selected'));
    });
    customInput.addEventListener('input', function () {
      const n = parseNominal(this.value);
      if (n) this.value = n.toLocaleString('id-ID');
    });
  }

  document.querySelectorAll('input[name="payment_method"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.payment-option').forEach((el) => el.classList.remove('active'));
      radio.closest('.payment-option')?.classList.add('active');
    });
  });

  const form = document.getElementById('donationForm') || document.querySelector('.form-card form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const selectedBtn = document.querySelector('.nominal-btn.selected');
    let amount = 0;
    if (customInput && customInput.value) {
      amount = parseNominal(customInput.value);
    } else if (selectedBtn) {
      amount = parseNominal(selectedBtn.textContent);
    }

    const nameInput = form.querySelector('[name="donor_name"]') || form.querySelector('input[placeholder*="nama" i]');
    const waInput = form.querySelector('[name="whatsapp"]') || form.querySelector('input[type="tel"]');
    const emailInput = form.querySelector('[name="email"]') || form.querySelector('input[type="email"]');
    const msgInput = form.querySelector('[name="message"]') || form.querySelector('textarea');
    const anon = form.querySelector('#anonim');
    const methodEl = form.querySelector('input[name="payment_method"]:checked');

    const isAnonymous = !!(anon && anon.checked);
    const donor_name = nameInput ? nameInput.value.trim() : '';
    const whatsapp = waInput ? waInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const message = msgInput ? msgInput.value.trim() : '';
    const method = methodEl ? methodEl.value : '';

    if (!amount || amount < 1000) {
      alert('Silakan pilih atau isi nominal minimal Rp 1.000.');
      return;
    }
    if (!isAnonymous && !donor_name) {
      alert('Nama lengkap wajib diisi (atau centang Anonim).');
      return;
    }
    if (!method) {
      alert('Silakan pilih metode pembayaran.');
      return;
    }

    const btn = form.querySelector('.submit-btn, button[type="submit"]');
    const original = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = 'Memproses...';
    }

    try {
      const res = await API.post('/api/donations', {
        amount,
        donor_name: isAnonymous ? 'Hamba Allah' : donor_name,
        whatsapp,
        email,
        is_anonymous: isAnonymous,
        message,
        method,
      });
      window.location.href = 'payment.html?code=' + encodeURIComponent(res.data.code);
    } catch (err) {
      alert(err.message || 'Gagal membuat donasi.');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = original;
      }
    }
  });
});
