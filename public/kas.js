// Mobile menu toggle
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    mobileMenu.classList.toggle('flex');
  });
}

// Wire Sedekah CTAs
document.querySelectorAll('button').forEach((btn) => {
  const t = (btn.textContent || '').trim().toLowerCase();
  if (t.includes('sedekah sekarang')) {
    btn.addEventListener('click', () => {
      window.location.href = 'sedekah.html';
    });
  }
});

// Search & Category Filter for Transaction Table
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const emptyState = document.getElementById('emptyState');

function filterTransactions() {
  const rows = document.querySelectorAll('#transactionBody tr');
  if (!searchInput || !categoryFilter) return;
  const keyword = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  let visibleCount = 0;

  rows.forEach((row) => {
    const desc = (row.dataset.desc || row.textContent || '').toLowerCase();
    const cat = row.dataset.category || '';

    const matchKeyword = !keyword || desc.includes(keyword);
    const matchCategory = category === 'semua' || cat === category;

    if (matchKeyword && matchCategory) {
      row.classList.remove('hidden');
      visibleCount++;
    } else {
      row.classList.add('hidden');
    }
  });

  if (emptyState) emptyState.classList.toggle('hidden', visibleCount > 0);
}

if (searchInput) searchInput.addEventListener('input', filterTransactions);
if (categoryFilter) categoryFilter.addEventListener('change', filterTransactions);

// Hover lift
document.querySelectorAll('.rounded-xl').forEach((card) => {
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-2px)';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(0)';
  });
});

// Load kas from API
function loadKas() {
  Promise.all([
    API.get('/api/kas').catch(() => null),
    API.get('/api/donations/stats/public').catch(() => null),
  ]).then(([kasRes, statsRes]) => {
    if (kasRes?.data) {
      const saldoEl = document.querySelector(
        '.md\:col-span-4.bg-surface-container-lowest h2.font-headline-md'
      );
      // First summary card is saldo - use id if present, else first match
      const cards = document.querySelectorAll(
        'main .md\:col-span-4 h2.font-headline-md, main .grid .md\:col-span-4 h2'
      );
      // Prefer explicit IDs if we set them
      const saldoNode = document.getElementById('kasSaldoPublic');
      const incomeNode = document.getElementById('kasIncomePublic');
      if (saldoNode) {
        saldoNode.textContent = formatRupiah(kasRes.data.saldo);
      } else if (cards[0]) {
        cards[0].textContent = formatRupiah(kasRes.data.saldo);
      }

      // Recent verified donations in transaction table
      const recentBody =
        document.getElementById('recentDonationsBody') ||
        document.getElementById('transactionBody');
      if (recentBody && Array.isArray(kasRes.data.recent_donations)) {
        if (!kasRes.data.recent_donations.length) {
          recentBody.innerHTML =
            '<tr><td colspan="4" class="px-6 py-8 text-center text-on-surface-variant">Belum ada donasi terverifikasi. Riwayat akan muncul setelah admin memverifikasi sedekah online.</td></tr>';
        } else {
          recentBody.innerHTML = kasRes.data.recent_donations
            .map((d) => {
              const date = d.verified_at || d.created_at || '';
              const dateLabel = date
                ? new Date(date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '-';
              const name = d.is_anonymous
                ? 'Hamba Allah'
                : d.donor_name || 'Donatur';
              return (
                '<tr class="hover:bg-surface-container-low transition-colors" data-desc="' +
                name +
                ' ' +
                (d.code || '') +
                ' sedekah" data-category="infak">' +
                '<td class="px-6 py-4 font-body-md text-body-md">' +
                dateLabel +
                '</td>' +
                '<td class="px-6 py-4 font-body-md text-body-md">Sedekah online — ' +
                name +
                ' <span class="text-outline text-xs">(' +
                (d.code || '') +
                ')</span></td>' +
                '<td class="px-6 py-4"><span class="bg-primary-container/10 text-primary px-3 py-1 rounded-full text-[12px] font-bold">Infak</span></td>' +
                '<td class="px-6 py-4 font-body-md text-body-md text-primary font-semibold text-right">+ ' +
                formatRupiah(d.amount) +
                '</td>' +
                '</tr>'
              );
            })
            .join('');
        }
      }
    }

    if (statsRes?.data) {
      const incomeNode = document.getElementById('kasIncomePublic');
      if (incomeNode) {
        incomeNode.textContent = formatRupiah(statsRes.data.total_month);
      } else {
        const cards = document.querySelectorAll(
          'main .grid .md\:col-span-4 h2.font-headline-md'
        );
        if (cards[1]) cards[1].textContent = formatRupiah(statsRes.data.total_month);
      }
      const targetPct = document.getElementById('kasTargetPct');
      if (targetPct && statsRes.data.target_month > 0) {
        const pct = Math.min(
          100,
          Math.round((statsRes.data.total_month / statsRes.data.target_month) * 100)
        );
        targetPct.textContent = pct + '% dari target operasional';
        const bar = document.getElementById('kasTargetBar');
        if (bar) bar.style.width = pct + '%';
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', loadKas);
