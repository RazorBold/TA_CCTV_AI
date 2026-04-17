#!/usr/bin/env python3
"""
SIGAP Lampung — Update Images Script
=====================================
Scan folder static/images/waste/ dan sinkronkan ke database.

Cara pakai:
  python3 update_images.py          # scan & sync semua
  python3 update_images.py --reset  # hapus semua data image, lalu scan ulang
  python3 update_images.py --list   # tampilkan semua images dari DB
"""

import os
import sys
import glob
import database as db

BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "images", "waste")
VALID_EXT = {".jpg", ".jpeg", ".png", ".webp"}


def scan_and_sync():
    """Scan folder dan tambahkan foto baru ke database."""
    added = 0
    for status in ["full", "scattered", "clean"]:
        folder = os.path.join(BASE_DIR, status)
        if not os.path.isdir(folder):
            print(f"  ⚠️  Folder tidak ditemukan: {folder}")
            continue

        existing = db.get_waste_images(status)
        existing_urls = {img["url"] for img in existing}

        files = sorted(glob.glob(os.path.join(folder, "*")))
        image_files = [f for f in files if os.path.splitext(f)[1].lower() in VALID_EXT]

        print(f"\n  📂 {status}/ — {len(image_files)} file ditemukan, {len(existing)} sudah di DB")

        for filepath in image_files:
            filename = os.path.basename(filepath)
            url = f"/static/images/waste/{status}/{filename}"

            if url not in existing_urls:
                conn = db.get_db()
                try:
                    conn.execute(
                        "INSERT INTO waste_images (status, url, source_url, caption) VALUES (?,?,?,?)",
                        (status, url, "", f"{status} — {filename}")
                    )
                    conn.commit()
                    added += 1
                    print(f"     ✅ Ditambahkan: {filename}")
                finally:
                    conn.close()
            else:
                print(f"     ✓  Sudah ada: {filename}")

    return added


def reset_and_rescan():
    """Hapus semua data waste_images, lalu scan ulang."""
    conn = db.get_db()
    try:
        conn.execute("DELETE FROM waste_images")
        conn.commit()
        print("  🗑️  Semua data waste_images dihapus")
    finally:
        conn.close()

    return scan_and_sync()


def list_images():
    """Tampilkan semua images dari database."""
    images = db.get_waste_images()
    if not images:
        print("  ℹ️  Belum ada data waste_images di database")
        return

    print(f"\n  Total: {len(images)} gambar\n")
    print(f"  {'ID':<5} {'Status':<12} {'Caption':<30} {'URL'}")
    print(f"  {'─'*5} {'─'*12} {'─'*30} {'─'*50}")
    for img in images:
        print(f"  {img['id']:<5} {img['status']:<12} {img['caption']:<30} {img['url']}")


def show_help():
    """Tampilkan petunjuk folder."""
    print("""
  📁 Struktur Folder:

    static/images/waste/
    ├── full/               ← Sampah PENUH (Full Load)
    │   ├── full_01.jpg
    │   ├── full_02.jpg
    │   ├── full_03.jpg
    │   └── full_04.jpg
    │
    ├── scattered/          ← Sampah BERSERAKAN
    │   ├── scattered_01.jpg
    │   ├── scattered_02.jpg
    │   ├── scattered_03.jpg
    │   └── scattered_04.jpg
    │
    └── clean/              ← Kondisi BERSIH
        ├── clean_01.jpg
        ├── clean_02.jpg
        ├── clean_03.jpg
        └── clean_04.jpg

  💡 Tips:
    • Ganti file yang sudah ada dengan foto asli (nama sama)
    • Tambah file baru, lalu jalankan: python3 update_images.py
    • Format yang didukung: .jpg, .jpeg, .png, .webp
    • Ukuran rekomendasi: 640x480 px atau lebih besar
    """)


if __name__ == "__main__":
    print("\n  🖼️  SIGAP Lampung — Image Manager\n" + "  " + "═" * 40)

    if "--help" in sys.argv or "-h" in sys.argv:
        show_help()
    elif "--reset" in sys.argv:
        print("\n  🔄 Reset & Rescan...")
        added = reset_and_rescan()
        print(f"\n  ✅ Selesai! {added} gambar ditambahkan ke database")
    elif "--list" in sys.argv:
        list_images()
    else:
        print("\n  🔍 Scanning folder...")
        added = scan_and_sync()
        if added > 0:
            print(f"\n  ✅ Selesai! {added} gambar baru ditambahkan")
        else:
            print(f"\n  ✅ Semua gambar sudah tersinkron, tidak ada yang baru")

    print()
