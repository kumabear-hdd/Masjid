document.addEventListener('DOMContentLoaded', () => {
  API.get('/api/auth/me')
    .then(() => {
      window.location.href = 'admin.html';
    })
    .catch(() => {});

  const passwordInput = document.getElementById('password');
  const toggleBtn = document.querySelector('.toggle-password');
  const toggleIcon = toggleBtn?.querySelector('span');

  if (passwordInput && toggleBtn && toggleIcon) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isHidden ? 'text' : 'password');
      toggleIcon.innerText = isHidden ? 'visibility_off' : 'visibility';
      toggleBtn.setAttribute(
        'aria-label',
        isHidden ? 'Sembunyikan password' : 'Tampilkan password'
      );
    });
  }

  const form = document.getElementById('loginForm') || document.querySelector('form');
  if (!form) return;

  let errorEl = document.getElementById('loginError');
  if (!errorEl) {
    errorEl = document.createElement('p');
    errorEl.id = 'loginError';
    errorEl.style.cssText =
      'color:#ba1a1a;font-size:14px;margin:0 0 12px;text-align:center;display:none;';
    form.insertBefore(errorEl, form.firstChild);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';

    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const btn = form.querySelector('button[type="submit"]');

    if (!email || !password) {
      errorEl.textContent = 'Harap isi email dan password.';
      errorEl.style.display = 'block';
      return;
    }

    const original = btn?.innerHTML;
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>Memproses...</span>';
    }

    try {
      await API.post('/api/auth/login', { email, password });
      window.location.href = 'admin.html';
    } catch (err) {
      errorEl.textContent = err.message || 'Login gagal.';
      errorEl.style.display = 'block';
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = original;
      }
    }
  });
});
