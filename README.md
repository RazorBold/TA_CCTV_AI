# SIGAP Lampung v3.1

**Sistem Informasi Pengelolaan Sampah Provinsi Lampung**

SIGAP Lampung adalah platform berbasis web yang memanfaatkan kecerdasan buatan (AI) untuk memantau dan mengelola kebersihan tempat sampah di Provinsi Lampung. Sistem ini mendeteksi tingkat kepenuhan tempat sampah menggunakan model computer vision, mengirimkan notifikasi otomatis ke petugas terkait, serta menyediakan dasbor analitik dan pemetaan real-time.

## Fitur Utama

- **Deteksi Sampah Otomatis**
  - Menggunakan model AI yang dilatih dengan Roboflow untuk mendeteksi kondisi tempat sampah: **Penuh (Full)**, **Berserakan (Scattered)**, atau **Bersih (Clean)**.
  - Integrasi real-time dengan kamera CCTV.

- **Notifikasi Cerdas**
  - Notifikasi otomatis terkirim via WhatsApp ke petugas terkait saat tempat sampah terdeteksi penuh atau berserakan.
  - Notifikasi mencakup lokasi, foto bukti, dan tingkat kepenuhan.

- **Dasbor Analitik**
  - Visualisasi data real-time mengenai jumlah tempat sampah berdasarkan status.
  - Grafik tren kepenuhan dari waktu ke waktu.
  - Statistik jumlah deteksi per hari.

- **Peta Interaktif**
  - Menampilkan lokasi tempat sampah pada peta interaktif (Leaflet + OpenStreetMap).
  - Indikator warna pada peta sesuai status tempat sampah.
  - Filter berdasarkan kecamatan.

- **Manajemen Petugas**
  - Sistem login dan register untuk petugas.
  - Role-based access control (Admin dan Operator).
  - Manajemen data petugas (CRUD).

- **Laporan & Riwayat**
  - Riwayat deteksi sampah dengan filter tanggal.
  - Laporan dapat diunduh dalam format PDF.
  - Log notifikasi WhatsApp.

## Teknologi yang Digunakan

- **Backend**: Python 3.10+, Flask
- **Database**: SQLite3
- **AI/ML**: Roboflow Inference API
- **Frontend**: HTML, CSS, JavaScript (Vanilla JS)
- **Library**: Leaflet (Peta), Chart.js (Grafik), jsPDF (Laporan)
- **Deployment**: Serverless (misalnya Vercel, Render, atau server lokal)

## Instalasi & Setup

### Prasyarat
- Python 3.10 atau lebih tinggi
- pip (Python package installer)

### Langkah Instalasi

1. **Clone Repository**
   ```bash
   git clone <url-repository>
   cd TA_CCTV_AI
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Konfigurasi Environment**
   Buat file `.env` di direktori root (jika menggunakan environment variables) atau edit langsung file `app.py`.

   ```env
   # Roboflow Configuration
   ROBOFLOW_API_KEY=your_roboflow_api_key
   ROBOFLOW_WORKSPACE=your_workspace
   ROBOFLOW_WORKFLOW_ID=your_workflow_id
   ROBOFLOW_API_URL=https://serverless.roboflow.com

   # WhatsApp Configuration
   WA_ALERT=your_whatsapp_alert_id

   # Flask Secret Key
   SECRET_KEY=your_secret_key
   ```

4. **Setup Database**
   Sistem akan otomatis membuat file `sigap.db` saat pertama kali dijalankan. Anda juga bisa menjalankan script setup manual:
   ```bash
   python database.py
   ```

5. **Jalankan Aplikasi**
   ```bash
   python app.py
   ```
   Aplikasi akan berjalan pada `http://[IP_ADDRESS]` (atau `http://localhost:5011`).

## Cara Penggunaan

1. **Login**
   - Akses `http://[IP_ADDRESS]/login`.
   - Gunakan kredensial default: `admin`/`admin123` atau register akun baru.

2. **Dashboard**
   - Tampilkan statistik real-time, grafik tren, dan notifikasi terbaru.
   - Toggle antara dark mode dan light mode.

3. **Peta**
   - Lihat lokasi tempat sampah pada peta.
   - Klik marker untuk melihat detail dan foto.

4. **CCTV**
   - Tampilkan feed CCTV (jika terintegrasi) dan status deteksi terakhir.

5. **Laporan**
   - Pilih rentang tanggal dan generate laporan PDF.

6. **Petugas**
   - Tambah, edit, atau hapus data petugas.

## Struktur Proyek

```
TA_CCTV_AI/
├── app.py                  # Aplikasi utama Flask
├── database.py             # Manajemen database SQLite
├── update_images.py        # Script untuk update gambar
├── requirements.txt        # Dependencies
├── .env                    # Konfigurasi environment
├── static/
│   ├── css/
│   │   └── style.css       # Styling aplikasi
│   ├── js/
│   │   └── dashboard.js    # Logika JavaScript
│   └── images/
│       └── waste/          # Gambar sampel sampah
│           ├── full/
│           ├── scattered/
│           └── clean/
└── templates/
    ├── base.html           # Template dasar
    ├── login.html          # Halaman login
    ├── register.html       # Halaman register
    ├── dashboard.html      # Halaman utama
    ├── peta.html           # Halaman peta
    ├── cctv.html           # Halaman CCTV
    ├── laporan.html         # Halaman laporan
    └── petugas.html        # Halaman manajemen petugas
```

## Integrasi AI

Sistem menggunakan **Roboflow Inference API** untuk menjalankan model computer vision. Pastikan Anda telah melatih model di Roboflow dan mendapatkan:
- API Key
- Workspace Name
- Workflow ID

Contoh payload deteksi yang diharapkan dari Roboflow:
```json
{
  "predictions": [
    {
      "label": "Rubbish_Full_Load",
      "confidence": 0.95,
      "x": 123,
      "y": 456,
      "width": 100,
      "height": 150
    }
  ]
}
```

## Lisensi

MIT License
