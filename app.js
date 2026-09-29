// Bilh Tutors (ብልህ ቱቶር) Full-Stack Application Logic

const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Theme Switcher
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const currentTheme = localStorage.getItem('bilh_theme') || 'light';
  if (currentTheme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    themeToggleBtn.innerHTML = '☀️ የቀን እይታ';
  }

  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.body.removeAttribute('data-theme');
      localStorage.setItem('bilh_theme', 'light');
      themeToggleBtn.innerHTML = '🌙 የማታ እይታ';
    } else {
      document.body.setAttribute('data-theme', 'dark');
      localStorage.setItem('bilh_theme', 'dark');
      themeToggleBtn.innerHTML = '☀️ የቀን እይታ';
    }
  });

  // 2. Family / Parent Job Request Submission
  const familyForm = document.getElementById('familyJobRequestForm');
  familyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const jobData = {
      parentName: document.getElementById('parentName').value,
      phone: document.getElementById('parentPhone').value,
      grade: document.getElementById('parentGrade').value,
      location: document.getElementById('parentLocation').value,
      subjects: document.getElementById('parentSubjects').value,
      salary: document.getElementById('parentSalary').value,
      details: document.getElementById('parentDetails').value
    };

    try {
      const res = await fetch(`${API_BASE}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });
      const data = await res.json();

      if (res.ok) {
        showToast('✨ ' + data.message);
        familyForm.reset();
        loadOpenJobs();
        loadAdminData();
      } else {
        showToast('❌ ' + (data.error || 'ስህተት ተፈጥሯል'));
      }
    } catch (err) {
      showToast('⚠️ ከአገልጋዩ (Server) ጋር መገናኘት አልተቻለም');
    }
  });

  // 3. Load & Render Open Published Jobs for Tutors
  async function loadOpenJobs() {
    const container = document.getElementById('openJobsContainer');
    try {
      const res = await fetch(`${API_BASE}/jobs`);
      const jobs = await res.json();

      container.innerHTML = '';
      if (!jobs || jobs.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">በአሁኑ ሰዓት ክፍት የተደረጉ የስራ ጥያቄዎች የሉም::</div>`;
        return;
      }

      jobs.forEach(j => {
        const card = document.createElement('div');
        card.className = 'tutor-card';
        card.innerHTML = `
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <span class="tag" style="background: var(--primary-light); color: var(--primary); font-weight: 700;">${j.id}</span>
              <span class="tag" style="background: var(--accent-light); color: var(--accent-hover); font-weight: 700;">${j.salary}</span>
            </div>
            <h3 style="font-size: 1.2rem; color: var(--primary); margin-bottom: 6px;">${j.subjects} (${j.grade})</h3>
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 4px;">📍 <strong>ቦታ:</strong> ${j.location}</p>
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 4px;">⏰ <strong>ጊዜ ሰሌዳ:</strong> ${j.schedule || 'ተለዋዋጭ'}</p>
            <p style="font-size: 0.85rem; background: var(--bg-body); padding: 8px; border-radius: 8px; margin: 10px 0;">"${j.details || 'የተማሪ ድጋፍ'}"</p>
          </div>
          <button class="btn-accent apply-job-btn" data-id="${j.id}" data-title="${j.subjects} (${j.grade})" style="width: 100%; justify-content: center; margin-top: 15px;">
            🎓 ለስራው ያመልክቱ & School ID ይላኩ
          </button>
        `;
        container.appendChild(card);
      });

      // Attach Apply Modal triggers
      document.querySelectorAll('.apply-job-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const jobId = e.target.getAttribute('data-id');
          const jobTitle = e.target.getAttribute('data-title');
          openApplyModal(jobId, jobTitle);
        });
      });

    } catch (err) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #ef4444;">የስራዎችን ዝርዝር መጫን አልተቻለም::</div>`;
    }
  }

  // 4. Modal Application Flow with School ID Upload
  const applyModal = document.getElementById('applyModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const tutorApplyForm = document.getElementById('tutorApplyForm');

  function openApplyModal(jobId, jobTitle) {
    document.getElementById('applyJobId').value = jobId;
    document.getElementById('modalJobTitle').textContent = `ስራ ID: ${jobId} — ${jobTitle}`;
    applyModal.style.display = 'flex';
  }

  closeModalBtn.addEventListener('click', () => {
    applyModal.style.display = 'none';
  });

  tutorApplyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const jobId = document.getElementById('applyJobId').value;
    const formData = new FormData();
    formData.append('tutorName', document.getElementById('applicantName').value);
    formData.append('phone', document.getElementById('applicantPhone').value);
    formData.append('fieldOfStudy', document.getElementById('applicantField').value);
    formData.append('grade', document.getElementById('applicantGrade').value);
    formData.append('experience', document.getElementById('applicantExp').value);

    const fileInput = document.getElementById('schoolIdCardFile');
    if (fileInput.files.length > 0) {
      formData.append('schoolIdCard', fileInput.files[0]);
    }

    try {
      const res = await fetch(`${API_BASE}/jobs/${jobId}/apply`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (res.ok) {
        showToast('🎉 ' + data.message);
        applyModal.style.display = 'none';
        tutorApplyForm.reset();
        loadAdminData();
      } else {
        showToast('❌ ' + (data.error || 'ማመልከት አልተቻለም'));
      }
    } catch (err) {
      showToast('⚠️ ማመልከቻውን መላክ አልተቻለም::');
    }
  });

  // 5. Admin Portal Dashboard Logic
  const adminTabJobsBtn = document.getElementById('adminTabJobsBtn');
  const adminTabAppsBtn = document.getElementById('adminTabAppsBtn');
  const adminJobsView = document.getElementById('adminJobsView');
  const adminAppsView = document.getElementById('adminAppsView');

  adminTabJobsBtn.addEventListener('click', () => {
    adminTabJobsBtn.classList.add('active');
    adminTabAppsBtn.classList.remove('active');
    adminJobsView.style.display = 'block';
    adminAppsView.style.display = 'none';
  });

  adminTabAppsBtn.addEventListener('click', () => {
    adminTabAppsBtn.classList.add('active');
    adminTabJobsBtn.classList.remove('active');
    adminAppsView.style.display = 'block';
    adminJobsView.style.display = 'none';
  });

  async function loadAdminData() {
    try {
      // Stats
      const statsRes = await fetch(`${API_BASE}/admin/stats`);
      const stats = await statsRes.json();
      document.getElementById('statTotalJobs').textContent = stats.totalJobs;
      document.getElementById('statPendingRequests').textContent = stats.pendingRequests;
      document.getElementById('statPublishedJobs').textContent = stats.publishedJobs;
      document.getElementById('statPendingApps').textContent = stats.pendingApps;

      // Jobs Table
      const jobsRes = await fetch(`${API_BASE}/admin/jobs`);
      const jobs = await jobsRes.json();
      const jobsTbody = document.getElementById('adminJobsTableBody');
      jobsTbody.innerHTML = '';

      jobs.forEach(j => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--border-color)';
        
        let statusBadge = `<span class="tag" style="background:#fef3c7; color:#b45309;">መጠባበቅ ላይ</span>`;
        if (j.status === 'published') statusBadge = `<span class="tag" style="background:#ccfbf1; color:#0d9488;">የተለቀቀ (Published)</span>`;
        if (j.status === 'assigned') statusBadge = `<span class="tag" style="background:#dbeafe; color:#1e40af;">አስጠኚ ተመድቧል</span>`;

        tr.innerHTML = `
          <td style="padding:10px; font-weight:700;">${j.id}</td>
          <td style="padding:10px;">${j.parentName}<br><small style="color:var(--text-muted);">${j.phone}</small></td>
          <td style="padding:10px;">${j.subjects}<br><small style="color:var(--teal);">${j.grade} | ${j.location}</small></td>
          <td style="padding:10px; font-weight:700; color:var(--accent);">${j.salary}</td>
          <td style="padding:10px;">${statusBadge}</td>
          <td style="padding:10px; text-align:right;">
            ${j.status === 'pending_approval' ? `
              <button class="btn-primary admin-action-btn" data-id="${j.id}" data-status="published" style="padding:4px 12px; font-size:0.8rem;">
                ✅ አጽድቅ & ልቀቅ
              </button>
            ` : ''}
            ${j.status === 'published' ? `
              <button class="btn-secondary admin-action-btn" data-id="${j.id}" data-status="closed" style="padding:4px 12px; font-size:0.8rem;">
                🔒 ዝጋ
              </button>
            ` : ''}
          </td>
        `;
        jobsTbody.appendChild(tr);
      });

      // Attach Job Admin Actions
      document.querySelectorAll('.admin-action-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const jobId = e.target.getAttribute('data-id');
          const newStatus = e.target.getAttribute('data-status');
          await updateJobStatus(jobId, newStatus);
        });
      });

      // Applications Table
      const appsRes = await fetch(`${API_BASE}/admin/applications`);
      const apps = await appsRes.json();
      const appsTbody = document.getElementById('adminAppsTableBody');
      appsTbody.innerHTML = '';

      apps.forEach(a => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--border-color)';

        let statusBadge = `<span class="tag" style="background:#fef3c7; color:#b45309;">ማረጋገጫ ይጠብቃል</span>`;
        if (a.status === 'verified' || a.status === 'accepted') statusBadge = `<span class="tag" style="background:#d1fae5; color:#047857;">✅ ID የተረጋገጠ</span>`;
        if (a.status === 'rejected') statusBadge = `<span class="tag" style="background:#fee2e2; color:#b91c1c;">ተሰርዟል</span>`;

        tr.innerHTML = `
          <td style="padding:10px; font-weight:700;">${a.id}</td>
          <td style="padding:10px;">${a.tutorName}<br><small style="color:var(--text-muted);">${a.phone}</small><br><small style="color:var(--primary);">${a.fieldOfStudy}</small><br><small>ክፍል/ዓመት: ${a.grade || 'አልተገለጸም'}</small></td>
          <td style="padding:10px;">${a.jobTitle} (ID: ${a.jobId})</td>
          <td style="padding:10px;">
            <button class="btn-secondary view-id-btn" data-url="${a.schoolIdCardUrl}" style="padding:4px 10px; font-size:0.8rem;">
              🪪 School ID ተመልከት
            </button>
          </td>
          <td style="padding:10px;">${statusBadge}</td>
          <td style="padding:10px; text-align:right;">
            ${a.status === 'pending_verification' ? `
              <button class="btn-primary verify-app-btn" data-id="${a.id}" data-status="accepted" style="padding:4px 12px; font-size:0.8rem;">
                ✅ መታወቂያ አረጋግጥ & ሹም
              </button>
            ` : ''}
          </td>
        `;
        appsTbody.appendChild(tr);
      });

      // Attach View ID Modal triggers
      document.querySelectorAll('.view-id-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const url = e.target.getAttribute('data-url');
          document.getElementById('idImagePreview').src = url;
          document.getElementById('idImageModal').style.display = 'flex';
        });
      });

      // Attach Verify App buttons
      document.querySelectorAll('.verify-app-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const appId = e.target.getAttribute('data-id');
          const status = e.target.getAttribute('data-status');
          await verifyTutorApp(appId, status);
        });
      });

    } catch (err) {
      console.error('Failed loading admin data:', err);
    }
  }

  async function updateJobStatus(jobId, status) {
    try {
      const res = await fetch(`${API_BASE}/admin/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      showToast('✨ ' + data.message);
      loadOpenJobs();
      loadAdminData();
    } catch (err) {
      showToast('❌ የህኔታ ለውጥ ማድረግ አልተቻለም');
    }
  }

  async function verifyTutorApp(appId, status) {
    try {
      const res = await fetch(`${API_BASE}/admin/applications/${appId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      showToast('🎉 ' + data.message);
      loadOpenJobs();
      loadAdminData();
    } catch (err) {
      showToast('❌ መታወቂያ ማረጋገጥ አልተቻለም');
    }
  }

  // ID Image Modal close trigger
  document.getElementById('closeIdModalBtn').addEventListener('click', () => {
    document.getElementById('idImageModal').style.display = 'none';
  });

  // Initial Data Load
  loadOpenJobs();
  loadAdminData();

  // Helper Toast
  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 5000);
  }
});
