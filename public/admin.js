/* Admin dashboard - Masjid Assalam */
(function () {
  let currentSection = 'dashboard';
  let donationsCache = [];

  async function ensureAuth() {
    try {
      const res = await API.get('/api/auth/me');
      const nameEl = document.getElementById('adminName');
      if (nameEl && res.admin) nameEl.textContent = res.admin.name || res.admin.email;
      return true;
    } catch {
      window.location.href = 'login.html';
      return false;
    }
  }

  function showSection(name) {
    currentSection = name;
    document.querySelectorAll('.admin-section').forEach(function (el) {
      el.hidden = el.id !== 'section-' + name;
    });
    document.querySelectorAll('.sidebar-link[data-section]').forEach(function (link) {
      link.classList.toggle('active', link.dataset.section === name);
    });
    var titles = {
      dashboard: 'Overview Dashboard',
      donations: 'Kelola Donasi',
      schedules: 'Jadwal Kegiatan',
      kas: 'Kelola Kas',
    };
    var titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = titles[name] || 'Dashboard';

    if (name === 'dashboard') loadDashboard();
    if (name === 'donations') loadDonations();
    if (name === 'schedules') loadSchedules();
    if (name === 'kas') loadKasForm();
  }

  function statusBadge(status) {
    var cls = status === 'verified' ? 'verified' : 'pending';
    var label = (typeof STATUS_LABEL !== 'undefined' && STATUS_LABEL[status]) || status;
    return '<span class="status-badge ' + cls + '">' + label + '</span>';
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function loadDashboard() {
    try {
      var stats = await API.get('/api/donations/stats/admin');
      var d = stats.data;
      document.getElementById('statPending').textContent = d.pending_donations;
      document.getElementById('statVerifiedTotal').textContent = formatRupiah(d.verified_month_total);
      document.getElementById('statSchedules').textContent = d.upcoming_schedules;
      document.getElementById('statSaldo').textContent = formatRupiah(d.saldo_kas);
    } catch (e) {
      console.error(e);
    }

    try {
      var res = await API.get('/api/donations');
      var rows = (res.data || []).slice(0, 8);
      donationsCache = res.data || [];
      var tbody = document.getElementById('dashboardDonationsBody');
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="6">Belum ada donasi.</td></tr>';
        return;
      }
      tbody.innerHTML = rows
        .map(function (r) {
          return (
            '<tr>' +
            '<td><code>' +
            r.code +
            '</code></td>' +
            '<td><span class="donor-name">' +
            escapeHtml(r.donor_name) +
            '</span><span class="donor-time">' +
            (r.created_at || '') +
            '</span></td>' +
            '<td class="amount">' +
            formatRupiah(r.amount) +
            '</td>' +
            '<td>' +
            (r.method === 'qris' ? 'QRIS' : 'Transfer') +
            '</td>' +
            '<td>' +
            statusBadge(r.status) +
            '</td>' +
            '<td class="center"><button class="action-btn detail" data-id="' +
            r.id +
            '" data-action="view-donation">Detail</button></td>' +
            '</tr>'
          );
        })
        .join('');
    } catch (e) {
      console.error(e);
    }
  }

  async function loadDonations() {
    var filter = (document.getElementById('donationFilter') && document.getElementById('donationFilter').value) || '';
    var q = filter ? '?status=' + encodeURIComponent(filter) : '';
    try {
      var res = await API.get('/api/donations' + q);
      donationsCache = res.data || [];
      var tbody = document.getElementById('donationsBody');
      if (!donationsCache.length) {
        tbody.innerHTML = '<tr><td colspan="8">Belum ada donasi.</td></tr>';
        return;
      }
      tbody.innerHTML = donationsCache
        .map(function (r) {
          var proof = r.proof_path
            ? '<a href="' + r.proof_path + '" target="_blank" class="link-btn">Lihat</a>'
            : '-';
          var actions =
            r.status === 'pending'
              ? '<button class="action-btn verify" data-id="' +
                r.id +
                '" data-action="verify">Verify</button> ' +
                '<button class="action-btn detail" data-id="' +
                r.id +
                '" data-action="reject">Tolak</button>'
              : '<button class="action-btn detail" data-id="' +
                r.id +
                '" data-action="view-donation">Detail</button>';
          return (
            '<tr>' +
            '<td><code>' +
            r.code +
            '</code></td>' +
            '<td>' +
            escapeHtml(r.donor_name) +
            '</td>' +
            '<td>' +
            escapeHtml(r.whatsapp || '-') +
            '</td>' +
            '<td class="amount">' +
            formatRupiah(r.amount) +
            '</td>' +
            '<td>' +
            (r.method === 'qris' ? 'QRIS' : 'Bank') +
            '</td>' +
            '<td>' +
            proof +
            '</td>' +
            '<td>' +
            statusBadge(r.status) +
            '</td>' +
            '<td class="center">' +
            actions +
            '</td>' +
            '</tr>'
          );
        })
        .join('');
    } catch (e) {
      document.getElementById('donationsBody').innerHTML =
        '<tr><td colspan="8">' + escapeHtml(e.message) + '</td></tr>';
    }
  }

  async function setDonationStatus(id, status) {
    var note = status === 'rejected' ? prompt('Catatan penolakan (opsional):') || '' : '';
    try {
      await API.patch('/api/donations/' + id + '/status', { status: status, admin_note: note });
      await loadDonations();
      if (currentSection === 'dashboard') await loadDashboard();
    } catch (e) {
      alert(e.message || 'Gagal memperbarui status');
    }
  }

  function openDonationModal(id) {
    var r = donationsCache.find(function (d) {
      return d.id === Number(id);
    });
    if (!r) {
      API.get('/api/donations')
        .then(function (res) {
          donationsCache = res.data || [];
          openDonationModal(id);
        })
        .catch(function (e) {
          alert(e.message);
        });
      return;
    }

    var body = document.getElementById('donationModalBody');
    body.innerHTML =
      '<p><strong>Kode:</strong> ' +
      r.code +
      '</p>' +
      '<p><strong>Donatur:</strong> ' +
      escapeHtml(r.donor_name) +
      '</p>' +
      '<p><strong>WhatsApp:</strong> ' +
      escapeHtml(r.whatsapp || '-') +
      '</p>' +
      '<p><strong>Email:</strong> ' +
      escapeHtml(r.email || '-') +
      '</p>' +
      '<p><strong>Jumlah:</strong> ' +
      formatRupiah(r.amount) +
      '</p>' +
      '<p><strong>Metode:</strong> ' +
      (r.method === 'qris' ? 'QRIS' : 'Transfer Bank') +
      '</p>' +
      '<p><strong>Status:</strong> ' +
      ((STATUS_LABEL && STATUS_LABEL[r.status]) || r.status) +
      '</p>' +
      '<p><strong>Pesan:</strong> ' +
      escapeHtml(r.message || '-') +
      '</p>' +
      '<p><strong>Waktu:</strong> ' +
      (r.created_at || '-') +
      '</p>' +
      (r.proof_path
        ? '<p><strong>Bukti:</strong><br><a href="' +
          r.proof_path +
          '" target="_blank"><img src="' +
          r.proof_path +
          '" alt="Bukti" style="max-width:100%;border-radius:8px;margin-top:8px;"></a></p>'
        : '<p><strong>Bukti:</strong> Belum diunggah</p>') +
      (r.admin_note ? '<p><strong>Catatan admin:</strong> ' + escapeHtml(r.admin_note) + '</p>' : '');

    var footer = document.getElementById('donationModalFooter');
    if (r.status === 'pending') {
      footer.innerHTML =
        '<button class="action-btn verify" data-id="' +
        r.id +
        '" data-action="verify">Verifikasi</button> ' +
        '<button class="action-btn detail" data-id="' +
        r.id +
        '" data-action="reject">Tolak</button>';
    } else {
      footer.innerHTML = '';
    }
    document.getElementById('donationModal').hidden = false;
  }

  async function loadSchedules() {
    try {
      var res = await API.get('/api/schedules');
      var rows = res.data || [];
      window.__schedules = rows;
      var tbody = document.getElementById('schedulesBody');
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="6">Belum ada jadwal. Tambahkan di form.</td></tr>';
        return;
      }
      tbody.innerHTML = rows
        .map(function (r) {
          var stLabel = (STATUS_LABEL && STATUS_LABEL[r.status]) || r.status;
          var stCls = r.status === 'upcoming' ? 'pending' : 'verified';
          return (
            '<tr>' +
            '<td>' +
            escapeHtml(r.title) +
            '</td>' +
            '<td>' +
            ((CATEGORY_LABEL && CATEGORY_LABEL[r.category]) || r.category) +
            '</td>' +
            '<td>' +
            formatDateID(r.event_date) +
            '</td>' +
            '<td>' +
            (r.event_time || '-') +
            '</td>' +
            '<td><span class="status-badge ' +
            stCls +
            '">' +
            stLabel +
            '</span></td>' +
            '<td class="center">' +
            '<button class="action-btn detail" data-action="edit-schedule" data-id="' +
            r.id +
            '">Edit</button> ' +
            '<button class="action-btn verify" data-action="delete-schedule" data-id="' +
            r.id +
            '" style="background:#ba1a1a;">Hapus</button>' +
            '</td></tr>'
          );
        })
        .join('');
    } catch (e) {
      document.getElementById('schedulesBody').innerHTML =
        '<tr><td colspan="6">' + escapeHtml(e.message) + '</td></tr>';
    }
  }

  function resetScheduleForm() {
    document.getElementById('scheduleForm').reset();
    document.getElementById('scheduleId').value = '';
    document.getElementById('scheduleFormTitle').textContent = 'Tambah Jadwal';
    document.getElementById('scheduleSubmitBtn').textContent = 'Simpan Jadwal';
    document.getElementById('scheduleResetBtn').hidden = true;
  }

  function fillScheduleForm(row) {
    document.getElementById('scheduleId').value = row.id;
    document.getElementById('scheduleTitle').value = row.title;
    document.getElementById('scheduleCategory').value = row.category;
    document.getElementById('scheduleDate').value = row.event_date;
    document.getElementById('scheduleTime').value = row.event_time || '';
    document.getElementById('scheduleLocation').value = row.location || '';
    document.getElementById('scheduleStatus').value = row.status;
    document.getElementById('scheduleDesc').value = row.description || '';
    document.getElementById('scheduleFormTitle').textContent = 'Edit Jadwal';
    document.getElementById('scheduleSubmitBtn').textContent = 'Update Jadwal';
    document.getElementById('scheduleResetBtn').hidden = false;
  }

  async function loadKasForm() {
    try {
      var res = await API.get('/api/kas');
      document.getElementById('kasSaldo').value = res.data.saldo || 0;
      document.getElementById('kasTarget').value = res.data.target_bulan || 0;
    } catch (e) {
      console.error(e);
    }
  }

  document.addEventListener('DOMContentLoaded', async function () {
    var ok = await ensureAuth();
    if (!ok) return;

    document.querySelectorAll('.sidebar-link[data-section]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        showSection(link.dataset.section);
      });
    });

    document.querySelectorAll('[data-goto]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showSection(btn.dataset.goto);
      });
    });

    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async function (e) {
        e.preventDefault();
        try {
          await API.post('/api/auth/logout', {});
        } catch (_) {}
        window.location.href = 'login.html';
      });
    }

    var menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
      menuBtn.addEventListener('click', function () {
        var sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.style.display = sidebar.style.display === 'flex' ? 'none' : 'flex';
      });
    }

    var donationFilter = document.getElementById('donationFilter');
    if (donationFilter) donationFilter.addEventListener('change', loadDonations);

    var closeModal = document.getElementById('closeDonationModal');
    if (closeModal) {
      closeModal.addEventListener('click', function () {
        document.getElementById('donationModal').hidden = true;
      });
    }
    var modal = document.getElementById('donationModal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target.id === 'donationModal') e.target.hidden = true;
      });
    }

    document.body.addEventListener('click', async function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var id = btn.dataset.id;
      var action = btn.dataset.action;

      if (action === 'verify') {
        if (confirm('Verifikasi donasi ini? Saldo kas akan ditambah.')) {
          await setDonationStatus(id, 'verified');
          document.getElementById('donationModal').hidden = true;
        }
      }
      if (action === 'reject') {
        if (confirm('Tolak donasi ini?')) {
          await setDonationStatus(id, 'rejected');
          document.getElementById('donationModal').hidden = true;
        }
      }
      if (action === 'view-donation') openDonationModal(id);
      if (action === 'edit-schedule') {
        var row = (window.__schedules || []).find(function (s) {
          return s.id === Number(id);
        });
        if (row) fillScheduleForm(row);
      }
      if (action === 'delete-schedule') {
        if (!confirm('Hapus jadwal ini?')) return;
        try {
          await API.delete('/api/schedules/' + id);
          resetScheduleForm();
          await loadSchedules();
        } catch (err) {
          alert(err.message);
        }
      }
    });

    var scheduleForm = document.getElementById('scheduleForm');
    if (scheduleForm) {
      scheduleForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var id = document.getElementById('scheduleId').value;
        var payload = {
          title: document.getElementById('scheduleTitle').value,
          category: document.getElementById('scheduleCategory').value,
          event_date: document.getElementById('scheduleDate').value,
          event_time: document.getElementById('scheduleTime').value,
          location: document.getElementById('scheduleLocation').value,
          status: document.getElementById('scheduleStatus').value,
          description: document.getElementById('scheduleDesc').value,
        };
        try {
          if (id) await API.put('/api/schedules/' + id, payload);
          else await API.post('/api/schedules', payload);
          resetScheduleForm();
          await loadSchedules();
          alert('Jadwal tersimpan.');
        } catch (err) {
          alert(err.message);
        }
      });
    }

    var resetBtn = document.getElementById('scheduleResetBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetScheduleForm);

    var kasForm = document.getElementById('kasForm');
    if (kasForm) {
      kasForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        try {
          await API.put('/api/kas', {
            saldo: Number(document.getElementById('kasSaldo').value),
            target_bulan: Number(document.getElementById('kasTarget').value),
          });
          alert('Data kas tersimpan.');
          await loadDashboard();
        } catch (err) {
          alert(err.message);
        }
      });
    }

    showSection('dashboard');
  });
})();
