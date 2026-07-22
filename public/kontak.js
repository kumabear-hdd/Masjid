function copyText(elementId, btn) {
  const text = document.getElementById(elementId).innerText;
  navigator.clipboard.writeText(text).then(() => {
    const originalContent = btn.innerHTML;
    btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;">check</span> Tersalin!`;
    btn.classList.add('copied');

    setTimeout(() => {
      btn.innerHTML = originalContent;
      btn.classList.remove('copied');
    }, 2000);
  });
}

// Form submission micro-interaction
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      const originalText = btn.innerText;
      btn.innerText = 'Mengirim...';
      btn.disabled = true;
      btn.style.opacity = '0.7';

      setTimeout(() => {
        btn.innerText = 'Terkirim!';
        btn.style.backgroundColor = '#006947';
        e.target.reset();
        setTimeout(() => {
          btn.innerText = originalText;
          btn.disabled = false;
          btn.style.opacity = '1';
        }, 3000);
      }, 1500);
    });
  }
});

function openMaps() {
  window.open('https://maps.google.com');
}
