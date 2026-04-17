/* ─────────────────────────────────────────────────────────────────────────────
   SIGAP Lampung — Dashboard JS (Light Theme)
   static/js/dashboard.js
───────────────────────────────────────────────────────────────────────────── */

// ── Gambar dummy dari Wikimedia Commons (public domain / CC) ─────────────────
// Gambar asli sampah berserakan, penuh, dan bersih di jalanan Asia
const WASTE_IMAGES = {
  full: [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Garbage_piled_up_on_the_streets_of_a_city.jpg/640px-Garbage_piled_up_on_the_streets_of_a_city.jpg",
      src: "https://commons.wikimedia.org/wiki/File:Garbage_piled_up_on_the_streets_of_a_city.jpg",
      caption: "Tumpukan sampah penuh di jalan kota"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Jakarta_garbage.jpg/640px-Jakarta_garbage.jpg",
      src: "https://commons.wikimedia.org/wiki/File:Jakarta_garbage.jpg",
      caption: "Sampah menumpuk — Jakarta"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Waste_dumped_on_a_road_in_India.jpg/640px-Waste_dumped_on_a_road_in_India.jpg",
      src: "https://commons.wikimedia.org/wiki/File:Waste_dumped_on_a_road_in_India.jpg",
      caption: "Tumpukan sampah di tepi jalan"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Rubbish_in_East_Jakarta.jpg/640px-Rubbish_in_East_Jakarta.jpg",
      src: "https://commons.wikimedia.org/wiki/File:Rubbish_in_East_Jakarta.jpg",
      caption: "Penuh — Jakarta Timur"
    },
  ],
  scattered: [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Litter_on_the_ground.jpg/640px-Litter_on_the_ground.jpg",
      src: "https://commons.wikimedia.org/wiki/File:Litter_on_the_ground.jpg",
      caption: "Sampah berserakan di trotoar"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Litter_-_San_Gabriel_River%2C_California.jpg/640px-Litter_-_San_Gabriel_River%2C_California.jpg",
      src: "https://commons.wikimedia.org/wiki/File:Litter_-_San_Gabriel_River,_California.jpg",
      caption: "Sampah berserakan di tepi sungai"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/LitteringHighway.jpg/640px-LitteringHighway.jpg",
      src: "https://commons.wikimedia.org/wiki/File:LitteringHighway.jpg",
      caption: "Sampah di tepi jalan raya"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Plastic_waste_in_Asia.jpg/640px-Plastic_waste_in_Asia.jpg",
      src: "https://commons.wikimedia.org/wiki/File:Plastic_waste_in_Asia.jpg",
      caption: "Plastik berserakan — Asia"
    },
  ],
  clean: [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Clean_street_Singapore.jpg/640px-Clean_street_Singapore.jpg",
      src: "https://commons.wikimedia.org/wiki/File:Clean_street_Singapore.jpg",
      caption: "Jalan bersih — Singapura"
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Clean_alley_Kyoto_Japan.jpg/640px-Clean_alley_Kyoto_Japan.jpg",
      src: "https://commons.wikimedia.org/wiki/File:Clean_alley_Kyoto_Japan.jpg",
      caption: "Gang bersih — Kyoto, Jepang"
    },
  ],
};

// Fallback gambar jika URL tidak bisa dimuat (pakai placeholder service)
const FALLBACK = {
  full:      "https://placehold.co/400x300/fef2f2/dc2626?text=Full+Load",
  scattered: "https://placehold.co/400x300/fffbeb/d97706?text=Berserakan",
  clean:     "https://placehold.co/400x300/f0fdf4/16a34a?text=Bersih",
};

function getImg(status, idx = 0) {
  const arr = WASTE_IMAGES[status] || WASTE_IMAGES.clean;
  return arr[idx % arr.length];
}

function imgWithFallback(url, status) {
  return `${url}" onerror="this.src='${FALLBACK[status]}'`;
}

// ── Clock ─────────────────────────────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById('clock');
  if (el) el.textContent =
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
}
setInterval(updateClock, 1000);
updateClock();

// ── API ───────────────────────────────────────────────────────────────────────
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

// ── Stat Cards ────────────────────────────────────────────────────────────────
async function loadStats() {
  const data = await apiFetch('/api/stats');
  if (!data) return;
  setEl('critical-count', data.critical);
  setEl('scattered-count', data.scattered);
  setEl('normal-count', data.normal);
}

// ── Map (light tile) ──────────────────────────────────────────────────────────
let mapInstance = null;

function makeMarkerIcon(status) {
  const cfg = {
    full:      { bg: '#dc2626', ring: '#fecaca', shadow: 'rgba(220,38,38,.35)' },
    scattered: { bg: '#d97706', ring: '#fde68a', shadow: 'rgba(217,119,6,.35)' },
    clean:     { bg: '#16a34a', ring: '#bbf7d0', shadow: 'rgba(22,163,74,.35)' },
  };
  const c = cfg[status] || cfg.clean;
  return L.divIcon({
    html: `<div style="
      width:16px;height:16px;border-radius:50%;
      background:${c.bg};
      border:3px solid ${c.ring};
      box-shadow:0 0 10px ${c.shadow}, 0 2px 4px rgba(0,0,0,.2);
    "></div>`,
    className: '',
    iconAnchor: [8, 8],
  });
}

function buildPopupHTML(loc, imgObj) {
  const statusColors = { full: '#dc2626', scattered: '#d97706', clean: '#16a34a' };
  const statusLabels = { full: 'Penuh / Full Load', scattered: 'Berserakan', clean: 'Bersih / Normal' };
  const c = statusColors[loc.status] || '#16a34a';
  const imgTag = imgObj
    ? `<img src="${imgObj.url}" onerror="this.src='${FALLBACK[loc.status]}'"
         style="width:100%;height:80px;object-fit:cover;display:block;border-radius:6px;margin-bottom:8px">`
    : '';
  return `
    <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;color:#0f172a;
      background:#fff;padding:12px;border-radius:10px;min-width:210px;
      border:1px solid #dde3ec;box-shadow:0 8px 24px rgba(15,23,42,.12)">
      ${imgTag}
      <div style="font-size:14px;font-weight:800;margin-bottom:4px">${loc.name}</div>
      <div style="color:#64748b;font-size:11px;margin-bottom:6px">Kec. ${loc.kec}</div>
      <div style="display:inline-flex;align-items:center;gap:5px;background:${c}18;
        border:1px solid ${c}55;border-radius:99px;padding:2px 9px;font-size:10px;font-weight:700;color:${c}">
        ● ${statusLabels[loc.status]}
      </div>
      <div style="color:#94a3b8;font-size:10px;margin-top:7px;font-family:'JetBrains Mono',monospace">
        🕐 ${loc.time} WIB &nbsp;|&nbsp; 👤 ${loc.officer}
      </div>
    </div>`;
}

async function initMap() {
  mapInstance = L.map('map', { zoomControl: true }).setView([-5.3965, 105.2669], 13);

  // Light tile — CartoDB Positron (clean, bright, white/grey map)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  }).addTo(mapInstance);

  const data = await apiFetch('/api/locations');
  if (!data) return;

  data.locations.forEach((loc, i) => {
    const imgObj = getImg(loc.status, i);
    L.marker([loc.lat, loc.lng], { icon: makeMarkerIcon(loc.status) })
      .addTo(mapInstance)
      .bindPopup(buildPopupHTML(loc, imgObj), { className: 'sigap-popup', maxWidth: 230 });
  });

  const full      = data.locations.filter(l => l.status === 'full').length;
  const scattered = data.locations.filter(l => l.status === 'scattered').length;
  const clean     = data.locations.filter(l => l.status === 'clean').length;
  const badges = document.querySelectorAll('.map-badge');
  if (badges[0]) badges[0].textContent = `${full} Kritis`;
  if (badges[1]) badges[1].textContent = `${scattered} Sedang`;
  if (badges[2]) badges[2].textContent = `${clean} Aman`;
}

// ── Alerts ────────────────────────────────────────────────────────────────────
async function loadAlerts() {
  const data = await apiFetch('/api/alerts');
  if (!data) return;

  const container = document.getElementById('alerts-list');
  const countEl   = document.getElementById('alert-count');
  if (!container) return;

  container.innerHTML = '';
  if (countEl) countEl.textContent = `${data.new_count} Baru`;

  const severityLabel = { critical: 'KRITIS', warning: 'SEDANG', normal: 'AMAN' };

  data.alerts.forEach((alert, i) => {
    const imgObj = getImg(alert.status, i);
    const div = document.createElement('div');
    div.className = `alert-item ${alert.severity}`;
    div.innerHTML = `
      <div class="alert-thumb">
        <img src="${imgObj.url}" alt="${alert.name}" onerror="this.src='${FALLBACK[alert.status]}'">
      </div>
      <div class="alert-content">
        <div class="alert-location">${alert.name}</div>
        <div class="alert-detail">Kec. ${alert.kec} · ${alert.label}</div>
        <span class="alert-time">🕐 ${alert.time}</span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">
        <span class="alert-severity-pill ${alert.severity}">${severityLabel[alert.severity]}</span>
        <a href="${imgObj.src}" target="_blank" style="font-family:var(--font-mono);font-size:9px;color:var(--muted);text-decoration:none;white-space:nowrap">
          📷 Lihat foto
        </a>
      </div>`;
    container.appendChild(div);
  });
}

// ── Photo Gallery (CCTV panel) ────────────────────────────────────────────────
async function loadPhotoGallery() {
  const data = await apiFetch('/api/cctv');
  if (!data) return;

  const grid = document.getElementById('photo-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const onlineEl = document.querySelector('.cctv-online-count');
  if (onlineEl) onlineEl.textContent = `${data.online} Online`;

  const aiLabels = { full: 'FULL LOAD', scattered: 'SCATTERED', clean: 'CLEAN' };

  data.cameras.forEach((cam, idx) => {
    const imgObj = getImg(cam.status, idx);
    const div = document.createElement('div');
    div.className = `photo-card ${cam.status === 'full' ? 'critical' : cam.status === 'scattered' ? 'warning' : 'clean'}`;
    div.innerHTML = `
      <img class="photo-img" src="${imgObj.url}" alt="${cam.name}" onerror="this.src='${FALLBACK[cam.status]}'">
      <div class="ai-chip ${cam.status === 'full' ? 'full' : cam.status === 'scattered' ? 'scattered' : 'clean'}">
        ${aiLabels[cam.status]}
      </div>
      <a class="src-link" href="${imgObj.src}" target="_blank" title="Sumber foto">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        Sumber
      </a>
      <div class="photo-overlay">
        <span class="photo-label">${cam.id} · ${cam.name}</span>
        <span class="photo-loc">${cam.online ? '🟢 LIVE' : '🔴 OFFLINE'}</span>
      </div>`;
    grid.appendChild(div);
  });
}

// ── Report Table ──────────────────────────────────────────────────────────────
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
      <td>
        <img class="thumb-sm" src="${imgObj.url}" alt="${loc.name}" onerror="this.src='${FALLBACK[loc.status]}'">
      </td>
      <td style="font-weight:600">${loc.name}</td>
      <td><span class="status-pill ${loc.status}"><span class="status-pill-dot"></span>${statusLabels[loc.status]}</span></td>
      <td style="font-family:var(--font-mono);font-size:11px;color:var(--muted)">${loc.time}</td>
      <td style="font-size:12px;color:var(--muted)">${loc.officer}</td>
      <td>
        <a href="${imgObj.src}" target="_blank" style="font-family:var(--font-mono);font-size:10px;color:var(--accent);text-decoration:none">
          🔗 Foto
        </a>
      </td>`;
    tbody.appendChild(tr);
  });
}

// ── Trend Chart ───────────────────────────────────────────────────────────────
async function loadChart() {
  const data = await apiFetch('/api/trend');
  if (!data) return;
  const canvas = document.getElementById('trendChart');
  if (!canvas) return;

  function draw() {
    const w = canvas.offsetWidth || 300;
    const h = 180;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    const pad   = { top: 16, right: 16, bottom: 28, left: 32 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top  - pad.bottom;
    const maxVal = 30;

    // Grid + Y labels
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + plotH * (i / 4);
      ctx.strokeStyle = '#e8eef5'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
      ctx.fillStyle = '#94a3b8'; ctx.font = '9px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal * (1 - i / 4)), pad.left - 5, y + 3);
    }

    // X labels
    data.labels.forEach((d, i) => {
      const x = pad.left + (i / (data.labels.length - 1)) * plotW;
      ctx.fillStyle = '#94a3b8'; ctx.font = '9px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(d, x, h - 6);
    });

    function drawArea(series, color, alpha) {
      ctx.beginPath();
      series.forEach((v, i) => {
        const x = pad.left + (i / (series.length - 1)) * plotW;
        const y = pad.top  + plotH * (1 - v / maxVal);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      const last = series.length - 1;
      ctx.lineTo(pad.left + plotW, pad.top + plotH);
      ctx.lineTo(pad.left, pad.top + plotH);
      ctx.closePath();
      ctx.fillStyle = color + alpha;
      ctx.fill();
    }

    function drawLine(series, color) {
      ctx.beginPath();
      series.forEach((v, i) => {
        const x = pad.left + (i / (series.length - 1)) * plotW;
        const y = pad.top  + plotH * (1 - v / maxVal);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round'; ctx.stroke();

      series.forEach((v, i) => {
        const x = pad.left + (i / (series.length - 1)) * plotW;
        const y = pad.top  + plotH * (1 - v / maxVal);
        ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff'; ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
      });
    }

    drawArea(data.full,      '#dc2626', '18');
    drawArea(data.scattered, '#d97706', '12');
    drawArea(data.clean,     '#16a34a', '12');
    drawLine(data.full,      '#dc2626');
    drawLine(data.scattered, '#d97706');
    drawLine(data.clean,     '#16a34a');
  }

  draw();
  window.addEventListener('resize', draw);
}

// ── AI Typewriter ─────────────────────────────────────────────────────────────
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
    el.textContent = text.slice(0, charIdx + 1);
    charIdx++;
    setTimeout(typeAI, 28);
  } else {
    setTimeout(() => { aiIdx = (aiIdx + 1) % aiTexts.length; charIdx = 0; typeAI(); }, 3000);
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────
async function openModal() {
  document.getElementById('modal').classList.add('open');

  const data = await apiFetch('/api/report');
  if (!data) return;

  const dateEl = document.getElementById('report-date');
  if (dateEl) dateEl.textContent = `Provinsi Lampung — ${data.date}`;

  setEl('modal-full-count',      data.summary.full);
  setEl('modal-scattered-count', data.summary.scattered);
  setEl('modal-clean-count',     data.summary.clean);

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
      ...WASTE_IMAGES.full.slice(0,2).map(i => ({ ...i, status: 'full' })),
      ...WASTE_IMAGES.scattered.slice(0,2).map(i => ({ ...i, status: 'scattered' })),
    ];
    samples.forEach(img => {
      const d = document.createElement('div');
      d.className = `modal-photo-item ${img.status === 'full' ? 'critical' : 'warning'}`;
      d.innerHTML = `
        <img src="${img.url}" alt="${img.caption}" onerror="this.src='${FALLBACK[img.status]}'">
        <div class="modal-photo-caption">
          ${img.caption}<br>
          <a href="${img.src}" target="_blank" style="color:var(--accent);font-size:9px">🔗 Sumber Wikimedia</a>
        </div>`;
      strip.appendChild(d);
    });
  }

  // Populate table
  const tbody = document.getElementById('modal-report-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const handlingMap = { full: 'Belum ditangani', scattered: 'Dalam proses', clean: 'Selesai' };
  const hColors     = { full: 'var(--danger)', scattered: 'var(--warning)', clean: 'var(--success)' };

  data.detail.forEach((loc, i) => {
    const imgObj = getImg(loc.status, i);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family:var(--font-mono);color:var(--muted);font-size:11px">${String(i+1).padStart(2,'0')}</td>
      <td>
        <img class="thumb-sm" src="${imgObj.url}" alt="${loc.name}" onerror="this.src='${FALLBACK[loc.status]}'">
      </td>
      <td style="font-weight:600">${loc.name}</td>
      <td style="color:var(--muted);font-size:12px">${loc.kec}</td>
      <td><span class="status-pill ${loc.status}"><span class="status-pill-dot"></span>${statusLabels[loc.status]}</span></td>
      <td style="font-family:var(--font-mono);font-size:11px;color:var(--muted)">${loc.time}</td>
      <td style="color:${hColors[loc.status]};font-size:11px;font-weight:600">${handlingMap[loc.status]}</td>
      <td>
        <a href="${imgObj.src}" target="_blank"
           style="font-family:var(--font-mono);font-size:10px;color:var(--accent);text-decoration:none">🔗</a>
      </td>`;
    tbody.appendChild(tr);
  });
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const dateEl = document.getElementById('report-date');
  if (dateEl) dateEl.textContent = 'Provinsi Lampung — ' +
    new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  await Promise.all([
    loadStats(),
    initMap(),
    loadAlerts(),
    loadPhotoGallery(),
    loadReportTable(),
    loadChart(),
  ]);

  typeAI();

  const overlay = document.getElementById('modal');
  if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  setInterval(() => { loadStats(); loadAlerts(); loadReportTable(); }, 30_000);
});