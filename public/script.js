// Shadow on navbar saat scroll
window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  if (nav) {
    if (window.scrollY > 50) {
      nav.classList.add('shadow-md');
    } else {
      nav.classList.remove('shadow-md');
    }
  }
});

// Toggle menu mobile
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    mobileMenu.classList.toggle('flex');
  });
}

// Jadwal Sholat
async function getPrayerTimes() {
  try {
    const response = await fetch(
      'https://api.aladhan.com/v1/timingsByCity?city=Karawang&country=Indonesia&method=11'
    );
    const data = await response.json();
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    set('fajr', data.data.timings.Fajr);
    set('dhuhr', data.data.timings.Dhuhr);
    set('asr', data.data.timings.Asr);
    set('maghrib', data.data.timings.Maghrib);
    set('isha', data.data.timings.Isha);
  } catch (error) {
    console.error('Gagal mengambil jadwal sholat:', error);
  }
}

getPrayerTimes();

// Saldo kas dari API
if (typeof API !== 'undefined') {
  API.get('/api/kas')
    .then((res) => {
      const kasDisplay = document.getElementById('kasDisplay');
      if (kasDisplay && res.data) {
        kasDisplay.innerText = formatRupiah(res.data.saldo);
      }
    })
    .catch(() => {});
}
