const MONTHS_ID = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];

function monthLabel(dateStr) {
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(d.getTime())) return '—';
  return MONTHS_ID[d.getMonth()];
}

function dayLabel(dateStr) {
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(d.getTime())) return '—';
  return String(d.getDate()).padStart(2, '0');
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function scheduleCard(s, completed) {
  const cat = (CATEGORY_LABEL && CATEGORY_LABEL[s.category]) || s.category || 'Lainnya';
  const time = s.event_time || '—';
  const loc = s.location || 'Masjid Assalam';
  const desc = s.description || '';

  if (completed) {
    return (
      '<div class="schedule-item flex gap-6 p-6 bg-surface-container-lowest border border-outline-variant rounded-xl hover:border-primary/30 transition-colors" data-category="' +
      (s.category || '') +
      '">' +
      '<div class="w-24 h-24 rounded-lg bg-surface-container-high flex flex-col items-center justify-center shrink-0 border border-outline-variant">' +
      '<span class="material-symbols-outlined text-primary text-3xl" style="font-variation-settings: \'FILL\' 1;">task_alt</span>' +
      '</div>' +
      '<div>' +
      '<span class="text-primary font-label-sm text-label-sm mb-1 block uppercase">' +
      cat +
      '</span>' +
      '<h4 class="font-headline-sm text-headline-sm text-on-surface mb-2">' +
      escapeHtml(s.title) +
      '</h4>' +
      (desc
        ? '<p class="text-on-surface-variant font-body-md text-body-md mb-4">' +
          escapeHtml(desc) +
          '</p>'
        : '') +
      '<div class="flex gap-4 text-label-md font-label-md text-outline flex-wrap">' +
      '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">event_available</span> ' +
      formatDateID(s.event_date) +
      '</span>' +
      (s.location
        ? '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">location_on</span> ' +
          escapeHtml(loc) +
          '</span>'
        : '') +
      '</div></div></div>'
    );
  }

  return (
    '<div class="schedule-item flex gap-6 p-6 bg-surface-container-lowest border border-outline-variant rounded-xl hover:border-primary/30 transition-colors" data-category="' +
    (s.category || '') +
    '">' +
    '<div class="w-24 h-24 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0 border border-primary/20">' +
    '<span class="font-headline-sm text-primary">' +
    dayLabel(s.event_date) +
    '</span>' +
    '<span class="font-label-sm text-primary uppercase">' +
    monthLabel(s.event_date) +
    '</span>' +
    '</div>' +
    '<div>' +
    '<span class="text-primary font-label-sm text-label-sm mb-1 block uppercase">' +
    cat +
    '</span>' +
    '<h4 class="font-headline-sm text-headline-sm text-on-surface mb-2">' +
    escapeHtml(s.title) +
    '</h4>' +
    (desc
      ? '<p class="text-on-surface-variant font-body-md text-body-md mb-4">' +
        escapeHtml(desc) +
        '</p>'
      : '') +
    '<div class="flex gap-4 text-label-md font-label-md text-outline flex-wrap">' +
    '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">schedule</span> ' +
    escapeHtml(time) +
    '</span>' +
    '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">location_on</span> ' +
    escapeHtml(loc) +
    '</span>' +
    '</div></div></div>'
  );
}

function emptyState(msg) {
  return (
    '<div class="md:col-span-2 p-8 text-center text-on-surface-variant border border-dashed border-outline-variant rounded-xl">' +
    msg +
    '</div>'
  );
}

let allSchedules = [];
let currentFilter = 'semua';

function renderSchedules() {
  const upcomingEl = document.getElementById('content-upcoming');
  const completedEl = document.getElementById('content-completed');
  if (!upcomingEl || !completedEl) return;

  let list = allSchedules;
  if (currentFilter !== 'semua') {
    list = list.filter((s) => s.category === currentFilter);
  }

  const upcoming = list.filter((s) => s.status === 'upcoming');
  const completed = list.filter((s) => s.status === 'completed');

  upcomingEl.innerHTML = upcoming.length
    ? upcoming.map((s) => scheduleCard(s, false)).join('')
    : emptyState('Belum ada jadwal kegiatan yang akan datang.');
  completedEl.innerHTML = completed.length
    ? completed.map((s) => scheduleCard(s, true)).join('')
    : emptyState('Belum ada kegiatan yang selesai.');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('button').forEach((btn) => {
    const t = (btn.textContent || '').trim().toLowerCase();
    if (
      t.includes('sedekah sekarang') ||
      t.includes('donasi sekarang') ||
      t === 'donasi' ||
      t.includes('ikut donasi')
    ) {
      btn.addEventListener('click', () => {
        window.location.href = 'sedekah.html';
      });
    }
    if (t.includes('laporan keuangan')) {
      btn.addEventListener('click', () => {
        window.location.href = 'kas.html';
      });
    }
  });

  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => {
        b.classList.remove('bg-primary', 'text-on-primary', 'shadow-md');
        b.classList.add('bg-surface-container-low', 'text-on-surface-variant');
      });
      btn.classList.remove('bg-surface-container-low', 'text-on-surface-variant');
      btn.classList.add('bg-primary', 'text-on-primary', 'shadow-md');

      currentFilter = btn.dataset.filter || 'semua';

      document.querySelectorAll('.program-card').forEach((card) => {
        if (currentFilter === 'semua' || card.dataset.category === currentFilter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });

      renderSchedules();
    });
  });

  const tabUpcoming = document.getElementById('tab-upcoming');
  const tabCompleted = document.getElementById('tab-completed');
  const contentUpcoming = document.getElementById('content-upcoming');
  const contentCompleted = document.getElementById('content-completed');

  if (tabUpcoming && tabCompleted) {
    tabUpcoming.addEventListener('click', () => {
      tabUpcoming.classList.add(
        'bg-surface-container-lowest',
        'text-primary',
        'font-bold',
        'shadow-sm'
      );
      tabUpcoming.classList.remove('text-on-surface-variant');
      tabCompleted.classList.remove(
        'bg-surface-container-lowest',
        'text-primary',
        'font-bold',
        'shadow-sm'
      );
      tabCompleted.classList.add('text-on-surface-variant');
      contentUpcoming.classList.remove('hidden');
      contentCompleted.classList.add('hidden');
    });

    tabCompleted.addEventListener('click', () => {
      tabCompleted.classList.add(
        'bg-surface-container-lowest',
        'text-primary',
        'font-bold',
        'shadow-sm'
      );
      tabCompleted.classList.remove('text-on-surface-variant');
      tabUpcoming.classList.remove(
        'bg-surface-container-lowest',
        'text-primary',
        'font-bold',
        'shadow-sm'
      );
      tabUpcoming.classList.add('text-on-surface-variant');
      contentCompleted.classList.remove('hidden');
      contentUpcoming.classList.add('hidden');
    });
  }

  window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (!nav) return;
    const navInner = nav.querySelector('div');
    if (window.scrollY > 50) {
      nav.classList.add('shadow-md', 'py-1');
      if (navInner) {
        navInner.classList.remove('h-20');
        navInner.classList.add('h-16');
      }
    } else {
      nav.classList.remove('shadow-md', 'py-1');
      if (navInner) {
        navInner.classList.remove('h-16');
        navInner.classList.add('h-20');
      }
    }
  });

  API.get('/api/schedules')
    .then((res) => {
      allSchedules = res.data || [];
      renderSchedules();
    })
    .catch(() => {
      const upcomingEl = document.getElementById('content-upcoming');
      if (upcomingEl) {
        upcomingEl.innerHTML = emptyState(
          'Gagal memuat jadwal. Pastikan server berjalan.'
        );
      }
    });
});
