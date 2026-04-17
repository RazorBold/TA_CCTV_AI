/* ─────────────────────────────────────────────────────────────────────────────
   SIGAP Lampung v3.0 — Dashboard JS
   Dark/Light Theme + Chart.js + Multi-page + Glassmorphism
───────────────────────────────────────────────────────────────────────────── */

// ── Waste Images (Wikimedia Commons — public domain / CC) ────────────────────
const WASTE_IMAGES = {
  full: [
    { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Garbage_piled_up_on_the_streets_of_a_city.jpg/640px-Garbage_piled_up_on_the_streets_of_a_city.jpg", src: "https://commons.wikimedia.org/wiki/File:Garbage_piled_up_on_the_streets_of_a_city.jpg", caption: "Tumpukan sampah penuh" },
    { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Jakarta_garbage.jpg/640px-Jakarta_garbage.jpg", src: "https://commons.wikimedia.org/wiki/File:Jakarta_garbage.jpg", caption: "Sampah menumpuk — Jakarta" },
    { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Waste_dumped_on_a_road_in_India.jpg/640px-Waste_dumped_on_a_road_in_India.jpg", src: "https://commons.wikimedia.org/wiki/File:Waste_dumped_on_a_road_in_India.jpg", caption: "Sampah di tepi jalan" },
    { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Rubbish_in_East_Jakarta.jpg/640px-Rubbish_in_East_Jakarta.jpg", src: "https://commons.wikimedia.org/wiki/File:Rubbish_in_East_Jakarta.jpg", caption: "Penuh — Jakarta Timur" },
  ],
  scattered: [
    { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Litter_on_the_ground.jpg/640px-Litter_on_the_ground.jpg", src: "https://commons.wikimedia.org/wiki/File:Litter_on_the_ground.jpg", caption: "Sampah berserakan" },
    { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Litter_-_San_Gabriel_River%2C_California.jpg/640px-Litter_-_San_Gabriel_River%2C_California.jpg", src: "https://commons.wikimedia.org/wiki/File:Litter_-_San_Gabriel_River,_California.jpg", caption: "Berserakan di tepi sungai" },
    { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/LitteringHighway.jpg/640px-LitteringHighway.jpg", src: "https://commons.wikimedia.org/wiki/File:LitteringHighway.jpg", caption: "Sampah di jalan raya" },
    { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Plastic_waste_in_Asia.jpg/640px-Plastic_waste_in_Asia.jpg", src: "https://commons.wikimedia.org/wiki/File:Plastic_waste_in_Asia.jpg", caption: "Plastik berserakan" },
  ],
  clean: [
    { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Clean_street_Singapore.jpg/640px-Clean_street_Singapore.jpg", src: "https://commons.wikimedia.org/wiki/File:Clean_street_Singapore.jpg", caption: "Jalan bersih — Singapura" },
    { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Clean_alley_Kyoto_Japan.jpg/640px-Clean_alley_Kyoto_Japan.jpg", src: "https://commons.wikimedia.org/wiki/File:Clean_alley_Kyoto_Japan.jpg", caption: "Gang bersih — Kyoto" },
  ],
};

const FALLBACK = {
  full:      "https://placehold.co/400x300/1a0a0a/ef4444?text=Full+Load",
  scattered: "https://placehold.co/400x300/1a1400/f59e0b?text=Berserakan",
  clean:     "https://placehold.co/400x300/0a1a0f/10b981?text=Bersih",
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

// Make functions globally accessible
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleTheme = toggleTheme;
window.toggleSidebar = toggleSidebar;
window.loadCCTVPage = loadCCTVPage;
window.loadPetaPage = loadPetaPage;
window.loadLaporanPage = loadLaporanPage;