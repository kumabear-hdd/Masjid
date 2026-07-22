/* ===========================================
   profil.js — Halaman Profil Masjid Assalam
   =========================================== */

document.addEventListener('DOMContentLoaded', () => {

  // =====================
  // 1. HEADER SCROLL SHADOW
  // =====================
  const header = document.getElementById('main-header');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('shadow-md');
    } else {
      header.classList.remove('shadow-md');
    }
  }, { passive: true });


  // =====================
  // 2. MOBILE MENU TOGGLE
  // =====================
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  hamburgerBtn.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.contains('mobile-menu-open');
    mobileMenu.classList.toggle('mobile-menu-open', !isOpen);
  });

  document.addEventListener('click', (e) => {
    if (!hamburgerBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('mobile-menu-open');
    }
  });


  // =====================
  // 3. SCROLL REVEAL — generic .reveal sections
  // =====================
  const revealEls = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealEls.forEach(el => revealObserver.observe(el));


  // =====================
  // 4. TEAM CARDS — staggered reveal
  // =====================
  const teamCards = document.querySelectorAll('.team-card');

  const teamObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        teamObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  teamCards.forEach(card => teamObserver.observe(card));


  // =====================
  // 5. MISI ITEMS — slide-in reveal
  // =====================
  const misiItems = document.querySelectorAll('.misi-item');

  const misiObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        misiObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  misiItems.forEach(item => misiObserver.observe(item));


  // =====================
  // 6. GALLERY ITEMS — fade-in reveal
  // =====================
  const galleryItems = document.querySelectorAll('.gallery-item');

  const galleryRevealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        galleryRevealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  galleryItems.forEach(item => galleryRevealObserver.observe(item));


  // =====================
  // 7. GALLERY FILTER
  // =====================
  const filterBtns = document.querySelectorAll('.gallery-filter-btn');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      galleryItems.forEach(item => {
        const category = item.dataset.category;
        if (filter === 'all' || category === filter) {
          item.classList.remove('hidden-item');
        } else {
          item.classList.add('hidden-item');
        }
      });
    });
  });


  // =====================
  // 8. SMOOTH SCROLL (anchor links)
  // =====================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });


  // =====================
  // 9. TEAM CARD — mail & share micro-interaction
  // =====================
  document.querySelectorAll('.team-card .material-symbols-outlined').forEach(icon => {
    icon.addEventListener('click', function () {
      const action = this.textContent.trim();
      if (action === 'mail') {
        const name = this.closest('.team-card').querySelector('h4').textContent;
        // Placeholder: buka mailto
        window.location.href = `mailto:info@masjidassalam.org?subject=Pesan untuk ${name}`;
      } else if (action === 'share') {
        if (navigator.share) {
          navigator.share({
            title: 'Masjid Assalam',
            text: 'Pengurus Masjid Assalam',
            url: window.location.href
          }).catch(() => {});
        } else {
          // Fallback: copy URL
          navigator.clipboard.writeText(window.location.href).then(() => {
            const orig = this.textContent;
            this.textContent = 'check';
            this.style.color = '#006947';
            setTimeout(() => {
              this.textContent = orig;
              this.style.color = '';
            }, 1800);
          });
        }
      }
    });
  });

});
