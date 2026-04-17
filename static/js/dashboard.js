/* ─────────────────────────────────────────────────────────────────────────────
   SIGAP Lampung v3.0 — Dashboard JS
   Dark/Light Theme + Chart.js + Multi-page + Glassmorphism
───────────────────────────────────────────────────────────────────────────── */

// ── Waste Images (LOCAL — folder: static/images/waste/) ──────────────────────
const WASTE_IMAGES = {
  full: [
    { url: "/static/images/waste/full/full_01.jpg", src: "", caption: "Sampah penuh — Foto 1" },
    { url: "/static/images/waste/full/full_02.jpg", src: "", caption: "Sampah penuh — Foto 2" },
    { url: "/static/images/waste/full/full_03.jpg", src: "", caption: "Sampah penuh — Foto 3" },
    { url: "/static/images/waste/full/full_04.jpg", src: "", caption: "Sampah penuh — Foto 4" },
  ],
  scattered: [
    { url: "/static/images/waste/scattered/scattered_01.jpg", src: "", caption: "Berserakan — Foto 1" },
    { url: "/static/images/waste/scattered/scattered_02.jpg", src: "", caption: "Berserakan — Foto 2" },
    { url: "/static/images/waste/scattered/scattered_03.jpg", src: "", caption: "Berserakan — Foto 3" },
    { url: "/static/images/waste/scattered/scattered_04.jpg", src: "", caption: "Berserakan — Foto 4" },
  ],
  clean: [
    { url: "/static/images/waste/clean/clean_01.jpg", src: "", caption: "Bersih — Foto 1" },
    { url: "/static/images/waste/clean/clean_02.jpg", src: "", caption: "Bersih — Foto 2" },
    { url: "/static/images/waste/clean/clean_03.jpg", src: "", caption: "Bersih — Foto 3" },
    { url: "/static/images/waste/clean/clean_04.jpg", src: "", caption: "Bersih — Foto 4" },
  ],
};

const FALLBACK = {
  full:      "/static/images/waste/full/full_01.jpg",
  scattered: "/static/images/waste/scattered/scattered_01.jpg",
  clean:     "/static/images/waste/clean/clean_01.jpg",
};

function getImg(status, idx = 0) {
  const arr = WASTE_IMAGES[status] || WASTE_IMAGES.clean;
  return arr[idx % arr.length];
}

function imgFallback(status) {
  return FALLBACK[status] || FALLBACK.clean;
}

// ── Theme ────────────────────────────────────────────────────────────────────
function getTheme() {
  return localStorage.getItem('sigap-theme') || 'dark';
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('sigap-theme', theme);
  updateThemeUI(theme);
  // Update map tiles if map exists
  if (window._mapTileLayer && window._mapInstance) {
    window._mapInstance.removeLayer(window._mapTileLayer);
    window._mapTileLayer = L.tileLayer(getMapTileUrl(theme), {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(window._mapInstance);
  }
}

function updateThemeUI(theme) {
  const text = document.getElementById('theme-text');
  const icon = document.getElementById('theme-icon-svg');
  if (text) text.textContent = theme === 'dark' ? 'Mode Terang' : 'Mode Gelap';
  if (icon) {
    icon.innerHTML = theme === 'dark'
      ? '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
      : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  }
}

function toggleTheme() {
  const current = getTheme();
  setTheme(current === 'dark' ? 'light' : 'dark');
}

function getMapTileUrl(theme) {
  return theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
}

// ── Sidebar (Mobile) ─────────────────────────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
}

// ── Clock ────────────────────────────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById('clock');
  if (el) el.textContent = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }) + ' WIB';
}

// ── API Helper ───────────────────────────────────────────────────────────────
async function apiFetch(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`[SIGAP] API error ${path}:`, err);
    return null;
  }
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── Chart.js default config for dark theme ───────────────────────────────────
function getChartColors() {
  const theme = getTheme();
  return {
    gridColor:  theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    tickColor:  theme === 'dark' ? '#64748b' : '#94a3b8',
    fontColor:  theme === 'dark' ? '#94a3b8' : '#64748b',
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ══════════════════════════════════════════════════════════════════════════════

// ── Stat Cards ───────────────────────────────────────────────────────────────
async function loadStats() {
  const data = await apiFetch('/api/stats');
  if (!data) return;
  setEl('critical-count', data.critical);
  setEl('scattered-count', data.scattered);
  setEl('normal-count', data.normal);
}

// ── Map ──────────────────────────────────────────────────────────────────────
function makeMarkerIcon(status) {
  const cfg = {
    full:      { bg: '#ef4444', ring: '#fecaca', shadow: 'rgba(239,68,68,.4)' },
    scattered: { bg: '#f59e0b', ring: '#fde68a', shadow: 'rgba(245,158,11,.4)' },
    clean:     { bg: '#10b981', ring: '#a7f3d0', shadow: 'rgba(16,185,129,.4)' },
  };
  const c = cfg[status] || cfg.clean;
  return L.divIcon({
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:${c.bg};
      border:3px solid ${c.ring};
      box-shadow:0 0 12px ${c.shadow}, 0 2px 6px rgba(0,0,0,.3);
    "></div>`,
    className: '',
    iconAnchor: [7, 7],
  });
}

function buildPopupHTML(loc, imgObj) {
  const statusLabels = { full: 'Penuh / Full Load', scattered: 'Berserakan', clean: 'Bersih / Normal' };
  const statusColors = { full: '#ef4444', scattered: '#f59e0b', clean: '#10b981' };
  const c = statusColors[loc.status] || '#10b981';
  const theme = getTheme();
  const bg = theme === 'dark' ? '#1e293b' : '#ffffff';
  const text = theme === 'dark' ? '#f1f5f9' : '#0f172a';
  const sub = theme === 'dark' ? '#94a3b8' : '#64748b';
  const imgTag = imgObj
    ? `<img src="${imgObj.url}" onerror="this.src='${imgFallback(loc.status)}'"
         style="width:100%;height:90px;object-fit:cover;display:block;border-radius:8px;margin-bottom:10px">`
    : '';
  return `
    <div style="font-family:Inter,sans-serif;font-size:12px;color:${text};
      background:${bg};padding:14px;border-radius:14px;min-width:220px;
      border:1px solid rgba(255,255,255,0.1);box-shadow:0 12px 40px rgba(0,0,0,.3)">
      ${imgTag}
      <div style="font-size:15px;font-weight:800;margin-bottom:4px">${loc.name}</div>
      <div style="color:${sub};font-size:11px;margin-bottom:8px">Kec. ${loc.kec}</div>
      <div style="display:inline-flex;align-items:center;gap:5px;background:${c}20;
        border:1px solid ${c}50;border-radius:99px;padding:3px 10px;font-size:10px;font-weight:700;color:${c}">
        ● ${statusLabels[loc.status]}
      </div>
      <div style="color:${sub};font-size:10px;margin-top:8px;font-family:'JetBrains Mono',monospace">
        🕐 ${loc.time} WIB &nbsp;|&nbsp; 👤 ${loc.officer}
      </div>
    </div>`;
}

async function initMap(mapId = 'map') {
  const mapEl = document.getElementById(mapId);
  if (!mapEl) return null;

  const theme = getTheme();
  const map = L.map(mapId, { zoomControl: true }).setView([-5.3965, 105.2669], 13);

  const tileLayer = L.tileLayer(getMapTileUrl(theme), {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  }).addTo(map);

  window._mapInstance = map;
  window._mapTileLayer = tileLayer;

  const data = await apiFetch('/api/locations');
  if (!data) return map;

  data.locations.forEach((loc, i) => {
    const imgObj = getImg(loc.status, i);
    L.marker([loc.lat, loc.lng], { icon: makeMarkerIcon(loc.status) })
      .addTo(map)
      .bindPopup(buildPopupHTML(loc, imgObj), { maxWidth: 250 });
  });

  // Update badges
  const full = data.locations.filter(l => l.status === 'full').length;
  const scattered = data.locations.filter(l => l.status === 'scattered').length;
  const clean = data.locations.filter(l => l.status === 'clean').length;

  const mapBadges = document.querySelectorAll('.map-badge');
  if (mapBadges[0]) mapBadges[0].textContent = `${full} Kritis`;
  if (mapBadges[1]) mapBadges[1].textContent = `${scattered} Sedang`;
  if (mapBadges[2]) mapBadges[2].textContent = `${clean} Aman`;

  return map;
}

// ── Alerts ───────────────────────────────────────────────────────────────────
async function loadAlerts() {
  const data = await apiFetch('/api/alerts');
  if (!data) return;

  const container = document.getElementById('alerts-list');
  if (!container) return;
  container.innerHTML = '';

  const countEl = document.getElementById('alert-count');
  if (countEl) countEl.textContent = `${data.new_count} Baru`;

  const severityLabel = { critical: 'KRITIS', warning: 'SEDANG', normal: 'AMAN' };

  data.alerts.forEach((alert, i) => {
    const imgObj = getImg(alert.status, i);
    const div = document.createElement('div');
    div.className = `alert-item ${alert.severity}`;
    div.style.animation = `fadeInUp 0.4s ease ${i * 0.05}s both`;
    div.innerHTML = `
      <div class="alert-thumb">
        <img src="${imgObj.url}" alt="${alert.name}" onerror="this.src='${imgFallback(alert.status)}'">
      </div>
      <div class="alert-content">
        <div class="alert-location">${alert.name}</div>
        <div class="alert-detail">Kec. ${alert.kec} · ${alert.label}</div>
        <span class="alert-time">🕐 ${alert.time} WIB</span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">
        <span class="alert-severity-pill ${alert.severity}">${severityLabel[alert.severity]}</span>
      </div>`;
    container.appendChild(div);
  });
}

// ── Photo Gallery ────────────────────────────────────────────────────────────
async function loadPhotoGallery() {
  const data = await apiFetch('/api/cctv');
  if (!data) return;

  const grid = document.getElementById('photo-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const onlineEl = document.querySelector('.cctv-online-count');
  if (onlineEl) onlineEl.textContent = `${data.online} Online`;

  const aiLabels = { full: 'FULL LOAD', scattered: 'SCATTERED', clean: 'CLEAN' };

  data.cameras.slice(0, 4).forEach((cam, idx) => {
    const imgObj = getImg(cam.status, idx);
    const borderClass = cam.status === 'full' ? 'critical' : cam.status === 'scattered' ? 'warning' : 'clean';
    const div = document.createElement('div');
    div.className = `photo-card ${borderClass}`;
    div.style.animation = `fadeInUp 0.5s ease ${idx * 0.1}s both`;
    div.innerHTML = `
      <img class="photo-img" src="${imgObj.url}" alt="${cam.name}" onerror="this.src='${imgFallback(cam.status)}'">
      <div class="ai-chip ${cam.status}">${aiLabels[cam.status]}</div>
      <div class="photo-overlay">
        <span class="photo-label">${cam.id} · ${cam.name}</span>
        <span class="photo-loc">${cam.online ? '🟢 LIVE' : '🔴 OFFLINE'}</span>
      </div>`;
    grid.appendChild(div);
  });
}

// ── Report Table ─────────────────────────────────────────────────────────────
const statusLabels = { full: 'Full Load', scattered: 'Berserakan', clean: 'Bersih' };

async function loadReportTable() {
  const data = await apiFetch('/api/locations');
  if (!data) return;

  const tbody = document.getElementById('report-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  data.locations.slice(0, 8).forEach((loc, i) => {
    const imgObj = getImg(loc.status, i);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img class="thumb-sm" src="${imgObj.url}" alt="${loc.name}" onerror="this.src='${imgFallback(loc.status)}'"></td>
      <td style="font-weight:700;color:var(--text-primary)">${loc.name}</td>
      <td><span class="status-pill ${loc.status}"><span class="status-pill-dot"></span>${statusLabels[loc.status]}</span></td>
      <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${loc.time}</td>
      <td style="font-size:12px;color:var(--text-muted)">${loc.officer}</td>`;
    tbody.appendChild(tr);
  });
}

// ── Trend Chart (Chart.js) ───────────────────────────────────────────────────
let trendChartInstance = null;

async function loadChart() {
  const data = await apiFetch('/api/trend');
  if (!data) return;
  const canvas = document.getElementById('trendChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const colors = getChartColors();

  if (trendChartInstance) trendChartInstance.destroy();

  trendChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'Full Load',
          data: data.full,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.1)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#ef4444',
          pointBorderColor: getTheme() === 'dark' ? '#1e293b' : '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
        },
        {
          label: 'Berserakan',
          data: data.scattered,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.08)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: getTheme() === 'dark' ? '#1e293b' : '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
        },
        {
          label: 'Bersih',
          data: data.clean,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.08)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#10b981',
          pointBorderColor: getTheme() === 'dark' ? '#1e293b' : '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: getTheme() === 'dark' ? '#1e293b' : '#fff',
          titleColor: getTheme() === 'dark' ? '#f1f5f9' : '#0f172a',
          bodyColor: getTheme() === 'dark' ? '#94a3b8' : '#334155',
          borderColor: getTheme() === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          cornerRadius: 10,
          padding: 12,
          titleFont: { family: 'Inter', weight: '700', size: 13 },
          bodyFont: { family: 'JetBrains Mono', size: 11 },
          displayColors: true,
          boxPadding: 4,
        },
      },
      scales: {
        x: {
          grid: { color: colors.gridColor, drawBorder: false },
          ticks: { color: colors.tickColor, font: { family: 'JetBrains Mono', size: 10 } },
        },
        y: {
          grid: { color: colors.gridColor, drawBorder: false },
          ticks: { color: colors.tickColor, font: { family: 'JetBrains Mono', size: 10 } },
          beginAtZero: true,
        },
      },
    },
  });
}

// ── AI Typewriter ────────────────────────────────────────────────────────────
const aiTexts = [
  "Terdeteksi 12 titik penuh di Zona Utara. Rekomendasikan mobilisasi armada pagi ini.",
  "Tingkat deteksi model: 96.4%. Akurasi Rubbish_Full_Load meningkat 2.1% minggu ini.",
  "Pola: lonjakan sampah di pasar tradisional pukul 06.00–09.00 WIB setiap Senin–Rabu.",
  "Prioritas hari ini: Pasar Bambu Kuning → TPA Bakung → Pasar Kangkung.",
];
let aiIdx = 0, charIdx = 0;

function typeAI() {
  const el = document.getElementById('ai-text');
  if (!el) return;
  const text = aiTexts[aiIdx];
  if (charIdx < text.length) {
    el.textContent = text.slice(0, charIdx + 1) + '▌';
    charIdx++;
    setTimeout(typeAI, 25);
  } else {
    el.textContent = text;
    setTimeout(() => { aiIdx = (aiIdx + 1) % aiTexts.length; charIdx = 0; typeAI(); }, 3500);
  }
}

// ── Modal (Dashboard) ────────────────────────────────────────────────────────
async function openModal() {
  const modal = document.getElementById('modal');
  if (!modal) return;
  modal.classList.add('open');

  const data = await apiFetch('/api/report');
  if (!data) return;

  setEl('report-date', `Provinsi Lampung — ${data.date}`);
  setEl('modal-full-count', data.summary.full);
  setEl('modal-scattered-count', data.summary.scattered);
  setEl('modal-clean-count', data.summary.clean);

  const aiEl = document.getElementById('modal-ai-text');
  if (aiEl) aiEl.innerHTML = data.ai_recommendation.replace(
    /(Pasar Bambu Kuning|Jl\. Raden Intan)/g,
    `<strong style="color:var(--danger)">$1</strong>`
  );

  // Photo strip
  const strip = document.getElementById('modal-photos');
  if (strip) {
    strip.innerHTML = '';
    const samples = [
      ...WASTE_IMAGES.full.slice(0, 2).map(i => ({ ...i, status: 'full' })),
      ...WASTE_IMAGES.scattered.slice(0, 2).map(i => ({ ...i, status: 'scattered' })),
    ];
    samples.forEach(img => {
      const d = document.createElement('div');
      d.className = `modal-photo-item ${img.status === 'full' ? 'critical' : 'warning'}`;
      d.innerHTML = `
        <img src="${img.url}" alt="${img.caption}" onerror="this.src='${imgFallback(img.status)}'">
        <div class="modal-photo-caption">${img.caption}</div>`;
      strip.appendChild(d);
    });
  }

  // Table
  const tbody = document.getElementById('modal-report-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const handlingMap = { full: 'Belum ditangani', scattered: 'Dalam proses', clean: 'Selesai' };
  const hColors = { full: 'var(--danger)', scattered: 'var(--warning)', clean: 'var(--success)' };

  data.detail.forEach((loc, i) => {
    const imgObj = getImg(loc.status, i);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family:var(--font-mono);color:var(--text-muted);font-size:11px">${String(i + 1).padStart(2, '0')}</td>
      <td><img class="thumb-sm" src="${imgObj.url}" alt="${loc.name}" onerror="this.src='${imgFallback(loc.status)}'"></td>
      <td style="font-weight:700;color:var(--text-primary)">${loc.name}</td>
      <td style="color:var(--text-muted);font-size:12px">${loc.kec}</td>
      <td><span class="status-pill ${loc.status}"><span class="status-pill-dot"></span>${statusLabels[loc.status]}</span></td>
      <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${loc.time}</td>
      <td style="color:${hColors[loc.status]};font-size:11px;font-weight:700">${handlingMap[loc.status]}</td>`;
    tbody.appendChild(tr);
  });
}

function closeModal() {
  const modal = document.getElementById('modal');
  if (modal) modal.classList.remove('open');
}

// ══════════════════════════════════════════════════════════════════════════════
// CCTV PAGE
// ══════════════════════════════════════════════════════════════════════════════
let cctvData = [];
let cctvDonutInstance = null;

async function loadCCTVPage() {
  const data = await apiFetch('/api/cctv');
  if (!data) return;
  cctvData = data.cameras;

  const online = data.cameras.filter(c => c.online).length;
  const offline = data.cameras.length - online;
  const full = data.cameras.filter(c => c.status === 'full').length;
  const scattered = data.cameras.filter(c => c.status === 'scattered').length;
  const clean = data.cameras.filter(c => c.status === 'clean').length;

  setEl('cctv-online-total', online);
  setEl('cctv-offline-total', offline);
  setEl('cctv-full-total', full);
  setEl('cctv-scattered-total', scattered);
  setEl('cctv-clean-total', clean);

  renderCCTVGrid(data.cameras);
  renderCCTVDonut(full, scattered, clean);
}

function renderCCTVGrid(cameras) {
  const grid = document.getElementById('cctv-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const aiLabels = { full: 'FULL LOAD', scattered: 'SCATTERED', clean: 'CLEAN' };

  cameras.forEach((cam, idx) => {
    const imgObj = getImg(cam.status, idx);
    const borderClass = cam.status === 'full' ? 'critical' : cam.status === 'scattered' ? 'warning' : 'clean';
    const offClass = cam.online ? '' : ' offline';

    const div = document.createElement('div');
    div.className = `cctv-card ${borderClass}${offClass}`;
    div.style.animation = `fadeInUp 0.4s ease ${idx * 0.06}s both`;
    div.innerHTML = `
      <img src="${imgObj.url}" alt="${cam.name}" onerror="this.src='${imgFallback(cam.status)}'">
      <div class="ai-chip ${cam.status}">${aiLabels[cam.status]}</div>
      <div class="cctv-live-pill">
        <div class="cctv-live-dot ${cam.online ? 'on' : 'off'}"></div>
        ${cam.online ? 'LIVE' : 'OFFLINE'}
      </div>
      <div class="cctv-card-overlay">
        <span class="cctv-card-id">${cam.id}</span>
        <span class="cctv-card-name">${cam.name}</span>
        <span class="cctv-card-kec">Kec. ${cam.kec || '—'}</span>
      </div>`;
    grid.appendChild(div);
  });
}

function renderCCTVDonut(full, scattered, clean) {
  const canvas = document.getElementById('cctvDonutChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const colors = getChartColors();

  if (cctvDonutInstance) cctvDonutInstance.destroy();
  cctvDonutInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Full Load', 'Berserakan', 'Bersih'],
      datasets: [{
        data: [full, scattered, clean],
        backgroundColor: ['rgba(239,68,68,0.8)', 'rgba(245,158,11,0.8)', 'rgba(16,185,129,0.8)'],
        borderColor: [getTheme() === 'dark' ? '#0f1629' : '#ffffff'],
        borderWidth: 3,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: colors.fontColor,
            font: { family: 'Inter', size: 11, weight: '600' },
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
          },
        },
        tooltip: {
          backgroundColor: getTheme() === 'dark' ? '#1e293b' : '#fff',
          titleColor: getTheme() === 'dark' ? '#f1f5f9' : '#0f172a',
          bodyColor: getTheme() === 'dark' ? '#94a3b8' : '#334155',
          borderColor: getTheme() === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          cornerRadius: 10,
          padding: 12,
        },
      },
    },
  });
}

window.filterCCTV = function(status, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const filtered = status === 'all' ? cctvData : cctvData.filter(c => c.status === status);
  renderCCTVGrid(filtered);
};

// ══════════════════════════════════════════════════════════════════════════════
// PETA PAGE
// ══════════════════════════════════════════════════════════════════════════════
let petaMapInstance = null;

async function loadPetaPage() {
  const data = await apiFetch('/api/locations');
  if (!data) return;

  const full = data.locations.filter(l => l.status === 'full').length;
  const scattered = data.locations.filter(l => l.status === 'scattered').length;
  const clean = data.locations.filter(l => l.status === 'clean').length;

  setEl('peta-full-count', full);
  setEl('peta-scattered-count', scattered);
  setEl('peta-clean-count', clean);

  const petaBadges = document.querySelectorAll('.peta-map-badge');
  if (petaBadges[0]) petaBadges[0].textContent = `${full} Kritis`;
  if (petaBadges[1]) petaBadges[1].textContent = `${scattered} Sedang`;
  if (petaBadges[2]) petaBadges[2].textContent = `${clean} Aman`;

  // Init map
  const mapEl = document.getElementById('peta-map');
  if (mapEl && !petaMapInstance) {
    const theme = getTheme();
    petaMapInstance = L.map('peta-map', { zoomControl: true }).setView([-5.3965, 105.2669], 12);

    L.tileLayer(getMapTileUrl(theme), {
      attribution: '&copy; OSM &copy; CARTO',
      maxZoom: 19,
    }).addTo(petaMapInstance);

    data.locations.forEach((loc, i) => {
      const imgObj = getImg(loc.status, i);
      L.marker([loc.lat, loc.lng], { icon: makeMarkerIcon(loc.status) })
        .addTo(petaMapInstance)
        .bindPopup(buildPopupHTML(loc, imgObj), { maxWidth: 250 });
    });
  }

  // Location list
  const list = document.getElementById('peta-location-list');
  if (list) {
    list.innerHTML = '';
    data.locations.forEach((loc, i) => {
      const div = document.createElement('div');
      div.className = 'peta-loc-item';
      div.style.animation = `slideInLeft 0.3s ease ${i * 0.04}s both`;
      div.innerHTML = `
        <div class="peta-loc-dot ${loc.status}"></div>
        <div>
          <div class="peta-loc-name">${loc.name}</div>
          <div class="peta-loc-kec">Kec. ${loc.kec}</div>
        </div>
        <div class="peta-loc-time">🕐 ${loc.time}</div>`;
      div.onclick = () => {
        if (petaMapInstance) {
          petaMapInstance.setView([loc.lat, loc.lng], 16, { animate: true });
        }
      };
      list.appendChild(div);
    });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// LAPORAN PAGE
// ══════════════════════════════════════════════════════════════════════════════
let lapDonutInstance = null;

async function loadLaporanPage() {
  const data = await apiFetch('/api/report');
  if (!data) return;

  setEl('laporan-date', data.date);
  setEl('lap-full-count', data.summary.full);
  setEl('lap-scattered-count', data.summary.scattered);
  setEl('lap-clean-count', data.summary.clean);

  // AI text
  const aiEl = document.getElementById('lap-ai-text');
  if (aiEl) aiEl.innerHTML = data.ai_recommendation.replace(
    /(Pasar Bambu Kuning|Jl\. Raden Intan)/g,
    `<strong style="color:var(--danger)">$1</strong>`
  );

  // Photo strip
  const strip = document.getElementById('lap-photos');
  if (strip) {
    strip.innerHTML = '';
    const samples = [
      ...WASTE_IMAGES.full.map(i => ({ ...i, status: 'full' })),
      ...WASTE_IMAGES.scattered.slice(0, 2).map(i => ({ ...i, status: 'scattered' })),
      ...WASTE_IMAGES.clean.map(i => ({ ...i, status: 'clean' })),
    ];
    samples.forEach(img => {
      const d = document.createElement('div');
      d.className = `modal-photo-item ${img.status === 'full' ? 'critical' : img.status === 'scattered' ? 'warning' : ''}`;
      d.innerHTML = `
        <img src="${img.url}" alt="${img.caption}" onerror="this.src='${imgFallback(img.status)}'">
        <div class="modal-photo-caption">${img.caption}</div>`;
      strip.appendChild(d);
    });
  }

  // Report table
  const tbody = document.getElementById('lap-report-body');
  if (tbody) {
    tbody.innerHTML = '';
    const handlingMap = { full: 'Belum ditangani', scattered: 'Dalam proses', clean: 'Selesai' };
    const hColors = { full: 'var(--danger)', scattered: 'var(--warning)', clean: 'var(--success)' };

    data.detail.forEach((loc, i) => {
      const imgObj = getImg(loc.status, i);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family:var(--font-mono);color:var(--text-muted);font-size:11px">${String(i + 1).padStart(2, '0')}</td>
        <td><img class="thumb-sm" src="${imgObj.url}" alt="${loc.name}" onerror="this.src='${imgFallback(loc.status)}'"></td>
        <td style="font-weight:700;color:var(--text-primary)">${loc.name}</td>
        <td style="color:var(--text-muted);font-size:12px">${loc.kec}</td>
        <td><span class="status-pill ${loc.status}"><span class="status-pill-dot"></span>${statusLabels[loc.status]}</span></td>
        <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${loc.time}</td>
        <td style="color:var(--text-muted);font-size:12px">${loc.officer}</td>
        <td style="color:${hColors[loc.status]};font-size:11px;font-weight:700">${handlingMap[loc.status]}</td>`;
      tbody.appendChild(tr);
    });
  }

  // Donut chart
  const canvas = document.getElementById('lapDonutChart');
  if (canvas && typeof Chart !== 'undefined') {
    const colors = getChartColors();
    if (lapDonutInstance) lapDonutInstance.destroy();
    lapDonutInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Full Load', 'Berserakan', 'Bersih'],
        datasets: [{
          data: [data.summary.full, data.summary.scattered, data.summary.clean],
          backgroundColor: ['rgba(239,68,68,0.8)', 'rgba(245,158,11,0.8)', 'rgba(16,185,129,0.8)'],
          borderColor: [getTheme() === 'dark' ? '#0f1629' : '#ffffff'],
          borderWidth: 3,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: colors.fontColor,
              font: { family: 'Inter', size: 11, weight: '600' },
              padding: 14,
              usePointStyle: true,
            },
          },
        },
      },
    });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  // Apply saved theme
  const savedTheme = getTheme();
  setTheme(savedTheme);

  // Clock
  updateClock();
  setInterval(updateClock, 1000);

  // Sidebar overlay click
  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) overlay.addEventListener('click', toggleSidebar);

  // Date
  const dateEl = document.getElementById('report-date');
  if (dateEl && !dateEl.textContent.includes('—')) {
    dateEl.textContent = 'Provinsi Lampung — ' +
      new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  const lapDateEl = document.getElementById('laporan-date');
  if (lapDateEl) {
    lapDateEl.textContent = new Date().toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  // Dashboard page init
  if (document.getElementById('stats-row')) {
    await Promise.all([
      loadStats(),
      initMap('map'),
      loadAlerts(),
      loadPhotoGallery(),
      loadReportTable(),
      loadChart(),
    ]);
    typeAI();

    // Modal close on overlay click
    const modalOverlay = document.getElementById('modal');
    if (modalOverlay) modalOverlay.addEventListener('click', e => {
      if (e.target === modalOverlay) closeModal();
    });

    // Auto-refresh
    setInterval(() => { loadStats(); loadAlerts(); loadReportTable(); }, 30000);
  }
});


// ══════════════════════════════════════════════════════════════════════════════
// PETUGAS PAGE
// ══════════════════════════════════════════════════════════════════════════════

async function loadPetugasPage() {
  await loadOfficers();
  await loadWALogs();
}

async function loadOfficers() {
  try {
    const res = await fetch('/api/officers');
    const data = await res.json();

    const el = (id) => document.getElementById(id);
    if (el('petugas-active'))  el('petugas-active').textContent  = data.active;
    if (el('petugas-inactive')) el('petugas-inactive').textContent = data.inactive;
    if (el('petugas-total'))   el('petugas-total').textContent    = data.total;
    if (el('petugas-count-badge')) el('petugas-count-badge').textContent = `${data.total} Petugas`;

    const tbody = el('petugas-body');
    if (!tbody) return;

    if (!data.officers || data.officers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:20px">Belum ada data petugas</td></tr>';
      return;
    }

    tbody.innerHTML = data.officers.map((o, i) => {
      const statusBadge = o.is_active
        ? '<span class="status-badge status-normal">Aktif</span>'
        : '<span class="status-badge status-scattered">Non-Aktif</span>';
      const phoneFormatted = formatPhone(o.phone);
      const initials = o.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

      return `<tr>
        <td>${i + 1}</td>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="officer-avatar">${initials}</div>
            <div>
              <div style="font-weight:600;color:var(--text)">${o.name}</div>
              <div style="font-size:11px;color:var(--text-muted)">${o.position}</div>
            </div>
          </div>
        </td>
        <td>
          <a href="https://wa.me/${o.phone}" target="_blank"
             style="color:#25D366;text-decoration:none;font-weight:500;display:flex;align-items:center;gap:4px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            </svg>
            ${phoneFormatted}
          </a>
        </td>
        <td>${o.kecamatan || '—'}</td>
        <td><span class="position-badge">${o.position}</span></td>
        <td>${statusBadge}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn-icon btn-wa-small" title="Kirim Alert WA" onclick="openWAModal(${o.id}, '${o.name}', '${o.phone}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
            </button>
            <button class="btn-icon btn-edit" title="Edit" onclick="editOfficer(${o.id})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon btn-delete" title="Hapus" onclick="deleteOfficer(${o.id}, '${o.name}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');

  } catch (err) {
    console.error('Load officers error:', err);
  }
}

async function loadWALogs() {
  try {
    const res  = await fetch('/api/wa-alert/logs');
    const data = await res.json();

    const logCount = document.getElementById('wa-log-count');
    if (logCount) logCount.textContent = `${data.count} Terkirim`;

    const tbody = document.getElementById('wa-log-body');
    if (!tbody) return;

    if (!data.logs || data.logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:20px">Belum ada riwayat alert</td></tr>';
      return;
    }

    tbody.innerHTML = data.logs.map(log => {
      const time = log.sent_at ? new Date(log.sent_at).toLocaleString('id-ID') : '—';
      return `<tr>
        <td style="white-space:nowrap;font-size:12px">${time}</td>
        <td style="font-weight:600">${log.officer_name || '—'}</td>
        <td style="font-family:'JetBrains Mono',monospace;font-size:12px">${formatPhone(log.phone)}</td>
        <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px">${log.message}</td>
        <td><span class="status-badge status-normal">Terkirim</span></td>
      </tr>`;
    }).join('');

  } catch (err) {
    console.error('Load WA logs error:', err);
  }
}

function formatPhone(phone) {
  if (!phone) return '—';
  // Format: +62 812-3456-7801
  const clean = phone.replace(/\D/g, '');
  if (clean.length >= 12) {
    return `+${clean.slice(0,2)} ${clean.slice(2,5)}-${clean.slice(5,9)}-${clean.slice(9)}`;
  }
  return phone;
}

// ── Modal handlers ──

function openAddPetugasModal() {
  document.getElementById('petugas-modal-title').textContent = '➕ Tambah Petugas Baru';
  document.getElementById('pf-id').value = '';
  document.getElementById('pf-name').value = '';
  document.getElementById('pf-phone').value = '';
  document.getElementById('pf-kec').value = '';
  document.getElementById('pf-position').value = 'Petugas Lapangan';
  document.getElementById('petugas-modal').classList.add('active');
}

function closePetugasModal() {
  document.getElementById('petugas-modal').classList.remove('active');
}

async function editOfficer(id) {
  try {
    const res = await fetch('/api/officers');
    const data = await res.json();
    const officer = data.officers.find(o => o.id === id);
    if (!officer) return;

    document.getElementById('petugas-modal-title').textContent = '✏️ Edit Petugas';
    document.getElementById('pf-id').value = officer.id;
    document.getElementById('pf-name').value = officer.name;
    document.getElementById('pf-phone').value = officer.phone;
    document.getElementById('pf-kec').value = officer.kecamatan || '';
    document.getElementById('pf-position').value = officer.position;
    document.getElementById('petugas-modal').classList.add('active');
  } catch (err) {
    console.error('Edit officer error:', err);
  }
}

async function savePetugas(e) {
  e.preventDefault();
  const id       = document.getElementById('pf-id').value;
  const name     = document.getElementById('pf-name').value.trim();
  const phone    = document.getElementById('pf-phone').value.trim();
  const kecamatan = document.getElementById('pf-kec').value.trim();
  const position = document.getElementById('pf-position').value;

  if (!name || !phone) { alert('Nama dan No. WA wajib diisi!'); return; }

  try {
    if (id) {
      // Update
      await fetch(`/api/officers/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, phone, kecamatan, position})
      });
    } else {
      // Create
      await fetch('/api/officers', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, phone, kecamatan, position})
      });
    }
    closePetugasModal();
    await loadOfficers();
  } catch (err) {
    console.error('Save officer error:', err);
    alert('Gagal menyimpan data petugas');
  }
}

async function deleteOfficer(id, name) {
  if (!confirm(`Hapus petugas "${name}"?`)) return;
  try {
    await fetch(`/api/officers/${id}`, {method: 'DELETE'});
    await loadOfficers();
  } catch (err) {
    console.error('Delete officer error:', err);
  }
}

// ── WA Alert ──

function openWAModal(id, name, phone) {
  document.getElementById('wa-officer-id').value = id;
  document.getElementById('wa-officer-phone').value = phone;
  document.getElementById('wa-modal-sub').textContent = `Kirim pesan ke ${name} (${formatPhone(phone)})`;

  const now = new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});
  document.getElementById('wa-message').value =
    `🚨 *ALERT SIGAP LAMPUNG*\n\nTerdeteksi tumpukan sampah kritis di area Anda.\nMohon segera ditindaklanjuti.\n\n📍 Lokasi: Area ${name}\n⏰ Waktu: ${now} WIB\n📊 Status: FULL LOAD\n\n_Dikirim otomatis oleh Sistem SIGAP Lampung_`;

  document.getElementById('wa-modal').classList.add('active');
}

function closeWAModal() {
  document.getElementById('wa-modal').classList.remove('active');
}

function sendWAAlert() {
  const phone   = document.getElementById('wa-officer-phone').value;
  const message = document.getElementById('wa-message').value;
  const waURL   = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(waURL, '_blank');
}

async function logWAAlert() {
  const officerId = document.getElementById('wa-officer-id').value;
  const phone     = document.getElementById('wa-officer-phone').value;
  const message   = document.getElementById('wa-message').value;

  try {
    await fetch('/api/wa-alert', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({officer_id: parseInt(officerId), phone, message})
    });
    closeWAModal();
    await loadWALogs();
    alert('✅ Alert berhasil dicatat!');
  } catch (err) {
    console.error('Log WA alert error:', err);
  }
}

async function sendBulkWAAlert() {
  if (!confirm('Kirim alert WhatsApp ke SEMUA petugas aktif?')) return;
  try {
    const res  = await fetch('/api/officers');
    const data = await res.json();
    const active = data.officers.filter(o => o.is_active);
    if (active.length === 0) { alert('Tidak ada petugas aktif'); return; }

    const now = new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});
    const msg = `🚨 *ALERT SIGAP LAMPUNG*\n\nTerdeteksi kondisi sampah kritis di beberapa titik.\nMohon segera ditindaklanjuti.\n\n⏰ Waktu: ${now} WIB\n\n_Dikirim otomatis oleh Sistem SIGAP Lampung_`;

    for (const o of active) {
      await fetch('/api/wa-alert', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({officer_id: o.id, phone: o.phone, message: msg})
      });
    }
    await loadWALogs();
    alert(`✅ Alert berhasil dikirim ke ${active.length} petugas!`);
  } catch (err) {
    console.error('Bulk WA error:', err);
  }
}


// Make functions globally accessible
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleTheme = toggleTheme;
window.toggleSidebar = toggleSidebar;
window.loadCCTVPage = loadCCTVPage;
window.loadPetaPage = loadPetaPage;
window.loadLaporanPage = loadLaporanPage;
window.loadPetugasPage = loadPetugasPage;
window.openAddPetugasModal = openAddPetugasModal;
window.closePetugasModal = closePetugasModal;
window.editOfficer = editOfficer;
window.savePetugas = savePetugas;
window.deleteOfficer = deleteOfficer;
window.openWAModal = openWAModal;
window.closeWAModal = closeWAModal;
window.sendWAAlert = sendWAAlert;
window.logWAAlert = logWAAlert;
window.sendBulkWAAlert = sendBulkWAAlert;