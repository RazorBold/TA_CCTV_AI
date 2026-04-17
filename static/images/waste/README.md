# 📸 Folder Foto Sampah — SIGAP Lampung

Ganti foto-foto di bawah ini dengan foto asli dari CCTV / lapangan.
Format: **JPG/PNG**, ukuran rekomendasi: **640x480 px** atau lebih besar.

## Struktur Folder

```
static/images/waste/
├── full/               ← Sampah MENUMPUK / PENUH (Full Load)
│   ├── full_01.jpg     ← Foto full load ke-1
│   ├── full_02.jpg     ← Foto full load ke-2
│   ├── full_03.jpg     ← Foto full load ke-3
│   └── full_04.jpg     ← Foto full load ke-4
│
├── scattered/          ← Sampah BERSERAKAN
│   ├── scattered_01.jpg
│   ├── scattered_02.jpg
│   ├── scattered_03.jpg
│   └── scattered_04.jpg
│
└── clean/              ← Kondisi BERSIH / Normal
    ├── clean_01.jpg
    ├── clean_02.jpg
    ├── clean_03.jpg
    └── clean_04.jpg
```

## Cara Ganti Foto

1. Siapkan foto dengan nama yang **sama persis** dengan format di atas
2. Ganti/timpa file yang ada di folder masing-masing
3. Restart server (`python3 app.py`)
4. Foto baru akan langsung tampil di dashboard

## Menambah Foto Baru

Jika ingin menambah lebih dari 4 foto per kategori:
- Tambahkan file dengan nama `full_05.jpg`, `full_06.jpg`, dst
- Jalankan: `python3 update_images.py` (akan otomatis update database)
- Atau update manual via API:
  ```
  POST /api/waste-images
  { "status": "full", "filename": "full_05.jpg", "caption": "TPA Bakung penuh" }
  ```

## Catatan
- Foto saat ini adalah **placeholder** (contoh), silakan ganti dengan foto asli
- Semua foto di-serve dari `/static/images/waste/...`
- Database `sigap.db` menyimpan referensi path ke setiap foto
