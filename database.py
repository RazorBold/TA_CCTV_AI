"""
SIGAP Lampung — Database Module (SQLite3)
=========================================
Semua data: users, locations, CCTV, trend, waste images
"""

import sqlite3
import os
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

DATABASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sigap.db')


def get_db():
    """Get a new database connection."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def dict_from_row(row):
    """Convert sqlite3.Row to dict."""
    if row is None:
        return None
    return dict(row)


def dict_list(rows):
    """Convert list of sqlite3.Row to list of dicts."""
    return [dict(r) for r in rows]


# ══════════════════════════════════════════════════════════════════════════════
# SCHEMA — Create Tables
# ══════════════════════════════════════════════════════════════════════════════

def init_db():
    """Initialize database — create all tables."""
    conn = get_db()
    try:
        conn.executescript("""
            -- ── Users ────────────────────────────────────────────
            CREATE TABLE IF NOT EXISTS users (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                username    TEXT    UNIQUE NOT NULL,
                password    TEXT    NOT NULL,
                name        TEXT    NOT NULL,
                role        TEXT    DEFAULT 'Operator',
                initials    TEXT    DEFAULT '',
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- ── Locations (titik pemantauan sampah) ──────────────
            CREATE TABLE IF NOT EXISTS locations (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT    NOT NULL,
                kecamatan   TEXT    NOT NULL,
                latitude    REAL    NOT NULL,
                longitude   REAL    NOT NULL,
                status      TEXT    DEFAULT 'clean'
                                    CHECK(status IN ('full','scattered','clean')),
                detection_time TEXT,
                officer     TEXT,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- ── CCTV Cameras ─────────────────────────────────────
            CREATE TABLE IF NOT EXISTS cctv_cameras (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                cam_id      TEXT    UNIQUE NOT NULL,
                name        TEXT    NOT NULL,
                kecamatan   TEXT    DEFAULT '',
                status      TEXT    DEFAULT 'clean'
                                    CHECK(status IN ('full','scattered','clean')),
                is_online   INTEGER DEFAULT 1,
                location_id INTEGER,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (location_id) REFERENCES locations(id)
            );

            -- ── Trend Data (statistik harian) ────────────────────
            CREATE TABLE IF NOT EXISTS trend_data (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                day_label       TEXT    NOT NULL,
                day_order       INTEGER NOT NULL,
                full_count      INTEGER DEFAULT 0,
                scattered_count INTEGER DEFAULT 0,
                clean_count     INTEGER DEFAULT 0
            );

            -- ── Waste Images (gambar referensi) ──────────────────
            CREATE TABLE IF NOT EXISTS waste_images (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                status      TEXT    NOT NULL
                                    CHECK(status IN ('full','scattered','clean')),
                url         TEXT    NOT NULL,
                source_url  TEXT,
                caption     TEXT
            );

            -- ── Officers (petugas lapangan) ──────────────────────
            CREATE TABLE IF NOT EXISTS officers (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT    NOT NULL,
                phone       TEXT    NOT NULL,
                kecamatan   TEXT    DEFAULT '',
                position    TEXT    DEFAULT 'Petugas Lapangan',
                is_active   INTEGER DEFAULT 1,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- ── WA Alert Logs ────────────────────────────────────
            CREATE TABLE IF NOT EXISTS wa_alert_logs (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                officer_id  INTEGER,
                phone       TEXT    NOT NULL,
                message     TEXT    NOT NULL,
                status      TEXT    DEFAULT 'sent',
                sent_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (officer_id) REFERENCES officers(id)
            );

            -- ── Detection Logs (riwayat deteksi AI) ──────────────
            CREATE TABLE IF NOT EXISTS detection_logs (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                camera_id   INTEGER,
                location_id INTEGER,
                status      TEXT    NOT NULL,
                label       TEXT,
                confidence  REAL,
                image_url   TEXT,
                detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (camera_id)   REFERENCES cctv_cameras(id),
                FOREIGN KEY (location_id) REFERENCES locations(id)
            );
        """)
        conn.commit()
        print("[DB] ✅ Tables created successfully")
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# SEED — Insert Initial Data
# ══════════════════════════════════════════════════════════════════════════════

def seed_db():
    """Seed database with initial data if empty."""
    conn = get_db()
    try:
        # Check if already seeded
        count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        if count > 0:
            print("[DB] ℹ️  Database already seeded, skipping")
            return

        print("[DB] 🌱 Seeding database...")

        # ── Seed Users ────────────────────────────────────────
        users = [
            ("admin",    "admin123",    "Administrator",    "Super Admin",    "AD"),
            ("gubernur", "lampung2024", "Gubernur Lampung", "Administrator",  "GU"),
            ("operator", "operator123", "Operator CCTV",    "Operator",       "OP"),
        ]
        for u in users:
            conn.execute(
                "INSERT INTO users (username, password, name, role, initials) VALUES (?,?,?,?,?)",
                (u[0], generate_password_hash(u[1], method='pbkdf2:sha256'), u[2], u[3], u[4])
            )

        # ── Seed Locations ────────────────────────────────────
        locations = [
            ("Pasar Bambu Kuning",      "Enggal",             -5.3965, 105.2669, "full",      "07:42", "Agus S."),
            ("Jl. Raden Intan",         "T. Karang Pusat",    -5.3890, 105.2601, "full",      "07:55", "Budi H."),
            ("Pasar Rajabasa",          "Rajabasa",           -5.3637, 105.2425, "full",      "08:10", "Dedi K."),
            ("Jl. Teuku Umar",          "Kedaton",            -5.3982, 105.2521, "scattered", "08:22", "Eko P."),
            ("Pasar Tugu",              "T. Karang Timur",    -5.3701, 105.2805, "full",      "08:35", "Feri W."),
            ("Jl. Kartini",             "T. Karang Barat",    -5.4018, 105.2558, "clean",     "09:01", "Gunawan"),
            ("Pasar Way Halim",         "Way Halim",          -5.3805, 105.2720, "scattered", "09:12", "Hendra T."),
            ("Jl. Sultan Agung",        "Kedaton",            -5.3925, 105.2610, "clean",     "09:25", "Irwan D."),
            ("TPA Bakung",              "Teluk Betung Barat", -5.4623, 105.2218, "full",      "09:31", "Joko S."),
            ("Pasar Pasir Gintung",     "T. Karang Pusat",    -5.3834, 105.2643, "scattered", "09:48", "Karyono"),
            ("Jl. Pangeran Diponegoro", "Enggal",             -5.4055, 105.2627, "full",      "10:02", "Lutfi A."),
            ("Terminal Rajabasa",       "Rajabasa",           -5.3580, 105.2398, "scattered", "10:15", "Mahmud"),
            ("Pasar Koga",              "Kedaton",            -5.3861, 105.2541, "clean",     "10:22", "Nasrul"),
            ("Jl. Ahmad Yani",          "T. Karang Pusat",    -5.3912, 105.2684, "scattered", "10:30", "Osman R."),
            ("Pasar Kangkung",          "Bumi Waras",         -5.4312, 105.2834, "full",      "10:44", "Purnomo"),
            ("Jl. Wolter Monginsidi",   "Teluk Betung Utara", -5.4256, 105.2785, "clean",     "10:55", "Rahmat"),
            ("Pasar Tamin",             "T. Karang Pusat",    -5.3978, 105.2715, "scattered", "11:01", "Sugeng"),
            ("Jl. Hayam Wuruk",         "Enggal",             -5.4007, 105.2632, "full",      "11:14", "Teguh W."),
        ]
        for loc in locations:
            conn.execute(
                "INSERT INTO locations (name, kecamatan, latitude, longitude, status, detection_time, officer) "
                "VALUES (?,?,?,?,?,?,?)", loc
            )

        # ── Seed CCTV Cameras ─────────────────────────────────
        cameras = [
            ("CAM-01", "Pasar Bambu Kuning",  "Enggal",             "full",      1, 1),
            ("CAM-02", "Jl. Raden Intan",     "T. Karang Pusat",    "scattered", 1, 2),
            ("CAM-03", "Pasar Rajabasa",       "Rajabasa",           "clean",     1, 3),
            ("CAM-04", "Jl. Teuku Umar",       "Kedaton",            "scattered", 1, 4),
            ("CAM-05", "Pasar Tugu",           "T. Karang Timur",    "full",      1, 5),
            ("CAM-06", "Jl. Kartini",          "T. Karang Barat",    "clean",     0, 6),
            ("CAM-07", "TPA Bakung",           "Teluk Betung Barat", "full",      1, 9),
            ("CAM-08", "Pasar Pasir Gintung",  "T. Karang Pusat",    "scattered", 1, 10),
        ]
        for cam in cameras:
            conn.execute(
                "INSERT INTO cctv_cameras (cam_id, name, kecamatan, status, is_online, location_id) "
                "VALUES (?,?,?,?,?,?)", cam
            )

        # ── Seed Trend Data ───────────────────────────────────
        trend = [
            ("Sen", 1, 8,  15, 25),
            ("Sel", 2, 11, 18, 19),
            ("Rab", 3, 9,  14, 25),
            ("Kam", 4, 14, 20, 14),
            ("Jum", 5, 10, 17, 21),
            ("Sab", 6, 13, 19, 16),
            ("Min", 7, 12, 19, 17),
        ]
        for t in trend:
            conn.execute(
                "INSERT INTO trend_data (day_label, day_order, full_count, scattered_count, clean_count) "
                "VALUES (?,?,?,?,?)", t
            )

        # ── Seed Waste Images (LOCAL FILES) ───────────────────
        # Foto di: static/images/waste/{full,scattered,clean}/
        # Ganti file .jpg di folder tersebut untuk update foto
        images = [
            # Full Load — sampah menumpuk / penuh
            ("full", "/static/images/waste/full/full_01.jpg", "", "Sampah penuh — Foto 1"),
            ("full", "/static/images/waste/full/full_02.jpg", "", "Sampah penuh — Foto 2"),
            ("full", "/static/images/waste/full/full_03.jpg", "", "Sampah penuh — Foto 3"),
            ("full", "/static/images/waste/full/full_04.jpg", "", "Sampah penuh — Foto 4"),
            # Scattered — sampah berserakan
            ("scattered", "/static/images/waste/scattered/scattered_01.jpg", "", "Sampah berserakan — Foto 1"),
            ("scattered", "/static/images/waste/scattered/scattered_02.jpg", "", "Sampah berserakan — Foto 2"),
            ("scattered", "/static/images/waste/scattered/scattered_03.jpg", "", "Sampah berserakan — Foto 3"),
            ("scattered", "/static/images/waste/scattered/scattered_04.jpg", "", "Sampah berserakan — Foto 4"),
            # Clean — kondisi bersih
            ("clean", "/static/images/waste/clean/clean_01.jpg", "", "Kondisi bersih — Foto 1"),
            ("clean", "/static/images/waste/clean/clean_02.jpg", "", "Kondisi bersih — Foto 2"),
            ("clean", "/static/images/waste/clean/clean_03.jpg", "", "Kondisi bersih — Foto 3"),
            ("clean", "/static/images/waste/clean/clean_04.jpg", "", "Kondisi bersih — Foto 4"),
        ]
        for img in images:
            conn.execute(
                "INSERT INTO waste_images (status, url, source_url, caption) VALUES (?,?,?,?)", img
            )

        # ── Seed Officers (Petugas Lapangan) ───────────────
        officers = [
            ("Agus Setiawan",    "6281234567801", "Enggal",             "Koordinator Wilayah"),
            ("Budi Hartono",     "6281234567802", "T. Karang Pusat",    "Petugas Lapangan"),
            ("Dedi Kurniawan",   "6281234567803", "Rajabasa",           "Petugas Lapangan"),
            ("Eko Prasetyo",     "6281234567804", "Kedaton",            "Petugas Lapangan"),
            ("Feri Wibowo",      "6281234567805", "T. Karang Timur",    "Supir Armada"),
            ("Gunawan",          "6281234567806", "T. Karang Barat",    "Petugas Lapangan"),
            ("Hendra Tanjung",   "6281234567807", "Way Halim",          "Koordinator Wilayah"),
            ("Irwan Darmawan",   "6281234567808", "Kedaton",            "Supir Armada"),
            ("Joko Susilo",      "6281234567809", "Teluk Betung Barat", "Petugas TPA"),
            ("Karyono",          "6281234567810", "T. Karang Pusat",    "Petugas Lapangan"),
        ]
        for off in officers:
            conn.execute(
                "INSERT INTO officers (name, phone, kecamatan, position) VALUES (?,?,?,?)", off
            )

        conn.commit()
        print("[DB] ✅ Database seeded successfully")

    except Exception as e:
        conn.rollback()
        print(f"[DB] ❌ Seed error: {e}")
        raise
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# USER CRUD
# ══════════════════════════════════════════════════════════════════════════════

def get_user_by_username(username):
    """Get user by username."""
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        return dict_from_row(row)
    finally:
        conn.close()


def verify_user(username, password):
    """Verify username + password. Returns user dict or None."""
    user = get_user_by_username(username)
    if user and check_password_hash(user['password'], password):
        return user
    return None


def create_user(username, password, name, role='Operator', initials=''):
    """Create a new user. Returns user id or None if username exists."""
    conn = get_db()
    try:
        if not initials:
            parts = name.strip().split()
            initials = ''.join([p[0].upper() for p in parts[:2]]) if parts else 'XX'
        conn.execute(
            "INSERT INTO users (username, password, name, role, initials) VALUES (?,?,?,?,?)",
            (username, generate_password_hash(password, method='pbkdf2:sha256'), name, role, initials)
        )
        conn.commit()
        return conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()


def get_all_users():
    """Get all users (without passwords)."""
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT id, username, name, role, initials, created_at FROM users ORDER BY id"
        ).fetchall()
        return dict_list(rows)
    finally:
        conn.close()


def delete_user(user_id):
    """Delete a user by ID."""
    conn = get_db()
    try:
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        return True
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# LOCATION CRUD
# ══════════════════════════════════════════════════════════════════════════════

def get_locations(status=None):
    """Get all locations, optionally filtered by status."""
    conn = get_db()
    try:
        if status:
            rows = conn.execute(
                "SELECT * FROM locations WHERE status = ? ORDER BY id", (status,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM locations ORDER BY id").fetchall()
        return dict_list(rows)
    finally:
        conn.close()


def get_location(location_id):
    """Get a single location by ID."""
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM locations WHERE id = ?", (location_id,)).fetchone()
        return dict_from_row(row)
    finally:
        conn.close()


def update_location_status(location_id, status, officer=None):
    """Update location status."""
    conn = get_db()
    try:
        now = datetime.now().strftime("%H:%M")
        if officer:
            conn.execute(
                "UPDATE locations SET status=?, detection_time=?, officer=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                (status, now, officer, location_id)
            )
        else:
            conn.execute(
                "UPDATE locations SET status=?, detection_time=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                (status, now, location_id)
            )
        conn.commit()
        return True
    finally:
        conn.close()


def create_location(name, kecamatan, lat, lng, status='clean', officer=''):
    """Create a new location."""
    conn = get_db()
    try:
        now = datetime.now().strftime("%H:%M")
        conn.execute(
            "INSERT INTO locations (name, kecamatan, latitude, longitude, status, detection_time, officer) "
            "VALUES (?,?,?,?,?,?,?)",
            (name, kecamatan, lat, lng, status, now, officer)
        )
        conn.commit()
        return conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    finally:
        conn.close()


def delete_location(location_id):
    """Delete a location."""
    conn = get_db()
    try:
        conn.execute("DELETE FROM locations WHERE id = ?", (location_id,))
        conn.commit()
        return True
    finally:
        conn.close()


def get_location_summary():
    """Get summary counts by status."""
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT status, COUNT(*) as count FROM locations GROUP BY status"
        ).fetchall()
        summary = {"full": 0, "scattered": 0, "clean": 0}
        for r in rows:
            summary[r["status"]] = r["count"]
        total_cctv = conn.execute("SELECT COUNT(*) FROM cctv_cameras").fetchone()[0]
        summary["total_cctv"] = total_cctv
        return summary
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# CCTV CRUD
# ══════════════════════════════════════════════════════════════════════════════

def get_cameras(status=None):
    """Get all cameras, optionally filtered by status."""
    conn = get_db()
    try:
        if status:
            rows = conn.execute(
                "SELECT * FROM cctv_cameras WHERE status = ? ORDER BY id", (status,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM cctv_cameras ORDER BY id").fetchall()
        return dict_list(rows)
    finally:
        conn.close()


def get_online_camera_count():
    """Get count of online cameras."""
    conn = get_db()
    try:
        return conn.execute("SELECT COUNT(*) FROM cctv_cameras WHERE is_online = 1").fetchone()[0]
    finally:
        conn.close()


def update_camera_status(cam_id, status=None, is_online=None):
    """Update camera status and/or online state."""
    conn = get_db()
    try:
        if status is not None and is_online is not None:
            conn.execute(
                "UPDATE cctv_cameras SET status=?, is_online=?, updated_at=CURRENT_TIMESTAMP WHERE cam_id=?",
                (status, is_online, cam_id)
            )
        elif status is not None:
            conn.execute(
                "UPDATE cctv_cameras SET status=?, updated_at=CURRENT_TIMESTAMP WHERE cam_id=?",
                (status, cam_id)
            )
        elif is_online is not None:
            conn.execute(
                "UPDATE cctv_cameras SET is_online=?, updated_at=CURRENT_TIMESTAMP WHERE cam_id=?",
                (is_online, cam_id)
            )
        conn.commit()
        return True
    finally:
        conn.close()


def create_camera(cam_id, name, kecamatan='', status='clean', is_online=1, location_id=None):
    """Create a new camera."""
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO cctv_cameras (cam_id, name, kecamatan, status, is_online, location_id) "
            "VALUES (?,?,?,?,?,?)",
            (cam_id, name, kecamatan, status, is_online, location_id)
        )
        conn.commit()
        return conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# TREND DATA
# ══════════════════════════════════════════════════════════════════════════════

def get_trend_data():
    """Get trend data formatted for Chart.js."""
    conn = get_db()
    try:
        rows = conn.execute("SELECT * FROM trend_data ORDER BY day_order").fetchall()
        data = dict_list(rows)
        return {
            "labels":    [d["day_label"] for d in data],
            "full":      [d["full_count"] for d in data],
            "scattered": [d["scattered_count"] for d in data],
            "clean":     [d["clean_count"] for d in data],
        }
    finally:
        conn.close()


def update_trend_data(day_order, full_count=None, scattered_count=None, clean_count=None):
    """Update trend data for a specific day."""
    conn = get_db()
    try:
        updates = []
        params = []
        if full_count is not None:
            updates.append("full_count=?")
            params.append(full_count)
        if scattered_count is not None:
            updates.append("scattered_count=?")
            params.append(scattered_count)
        if clean_count is not None:
            updates.append("clean_count=?")
            params.append(clean_count)
        if updates:
            params.append(day_order)
            conn.execute(f"UPDATE trend_data SET {','.join(updates)} WHERE day_order=?", params)
            conn.commit()
        return True
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# WASTE IMAGES
# ══════════════════════════════════════════════════════════════════════════════

def get_waste_images(status=None):
    """Get waste images, optionally filtered by status."""
    conn = get_db()
    try:
        if status:
            rows = conn.execute(
                "SELECT * FROM waste_images WHERE status = ? ORDER BY id", (status,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM waste_images ORDER BY id").fetchall()
        return dict_list(rows)
    finally:
        conn.close()


def get_waste_image(status, idx=0):
    """Get a single waste image by status and index."""
    images = get_waste_images(status)
    if not images:
        images = get_waste_images("clean")
    if not images:
        return {"url": "", "source_url": "", "caption": "No image"}
    img = images[idx % len(images)]
    return {"url": img["url"], "src": img["source_url"], "caption": img["caption"]}


# ══════════════════════════════════════════════════════════════════════════════
# DETECTION LOGS
# ══════════════════════════════════════════════════════════════════════════════

def log_detection(camera_id=None, location_id=None, status='', label='', confidence=0.0, image_url=''):
    """Log an AI detection event."""
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO detection_logs (camera_id, location_id, status, label, confidence, image_url) "
            "VALUES (?,?,?,?,?,?)",
            (camera_id, location_id, status, label, confidence, image_url)
        )
        conn.commit()
        return True
    finally:
        conn.close()


def get_detection_logs(limit=50):
    """Get recent detection logs."""
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT dl.*, c.cam_id, c.name as camera_name, l.name as location_name "
            "FROM detection_logs dl "
            "LEFT JOIN cctv_cameras c ON dl.camera_id = c.id "
            "LEFT JOIN locations l ON dl.location_id = l.id "
            "ORDER BY dl.detected_at DESC LIMIT ?",
            (limit,)
        ).fetchall()
        return dict_list(rows)
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# OFFICERS CRUD
# ══════════════════════════════════════════════════════════════════════════════

def get_officers(active_only=False):
    """Get all officers."""
    conn = get_db()
    try:
        if active_only:
            rows = conn.execute("SELECT * FROM officers WHERE is_active = 1 ORDER BY id").fetchall()
        else:
            rows = conn.execute("SELECT * FROM officers ORDER BY id").fetchall()
        return dict_list(rows)
    finally:
        conn.close()


def get_officer(officer_id):
    """Get a single officer."""
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM officers WHERE id = ?", (officer_id,)).fetchone()
        return dict_from_row(row)
    finally:
        conn.close()


def create_officer(name, phone, kecamatan='', position='Petugas Lapangan'):
    """Create a new officer."""
    conn = get_db()
    try:
        # Normalize phone: remove +, spaces, dashes
        phone = phone.replace('+', '').replace(' ', '').replace('-', '')
        if phone.startswith('0'):
            phone = '62' + phone[1:]
        conn.execute(
            "INSERT INTO officers (name, phone, kecamatan, position) VALUES (?,?,?,?)",
            (name, phone, kecamatan, position)
        )
        conn.commit()
        return conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    finally:
        conn.close()


def update_officer(officer_id, name=None, phone=None, kecamatan=None, position=None, is_active=None):
    """Update officer details."""
    conn = get_db()
    try:
        updates = []
        params = []
        if name is not None:
            updates.append("name=?")
            params.append(name)
        if phone is not None:
            phone = phone.replace('+', '').replace(' ', '').replace('-', '')
            if phone.startswith('0'):
                phone = '62' + phone[1:]
            updates.append("phone=?")
            params.append(phone)
        if kecamatan is not None:
            updates.append("kecamatan=?")
            params.append(kecamatan)
        if position is not None:
            updates.append("position=?")
            params.append(position)
        if is_active is not None:
            updates.append("is_active=?")
            params.append(is_active)
        if updates:
            params.append(officer_id)
            conn.execute(f"UPDATE officers SET {','.join(updates)} WHERE id=?", params)
            conn.commit()
        return True
    finally:
        conn.close()


def delete_officer(officer_id):
    """Delete an officer."""
    conn = get_db()
    try:
        conn.execute("DELETE FROM officers WHERE id = ?", (officer_id,))
        conn.commit()
        return True
    finally:
        conn.close()


def get_officers_by_kecamatan(kecamatan):
    """Get officers assigned to a specific kecamatan."""
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM officers WHERE kecamatan = ? AND is_active = 1 ORDER BY name",
            (kecamatan,)
        ).fetchall()
        return dict_list(rows)
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# WA ALERT LOGS
# ══════════════════════════════════════════════════════════════════════════════

def log_wa_alert(officer_id, phone, message, status='sent'):
    """Log a WA alert that was sent."""
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO wa_alert_logs (officer_id, phone, message, status) VALUES (?,?,?,?)",
            (officer_id, phone, message, status)
        )
        conn.commit()
        return True
    finally:
        conn.close()


def get_wa_alert_logs(limit=50):
    """Get recent WA alert logs."""
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT w.*, o.name as officer_name "
            "FROM wa_alert_logs w "
            "LEFT JOIN officers o ON w.officer_id = o.id "
            "ORDER BY w.sent_at DESC LIMIT ?",
            (limit,)
        ).fetchall()
        return dict_list(rows)
    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# INIT + SEED
# ══════════════════════════════════════════════════════════════════════════════

def setup_database():
    """Full database setup — init + seed."""
    init_db()
    seed_db()


if __name__ == "__main__":
    print(f"[DB] Database path: {DATABASE}")
    setup_database()
    print(f"[DB] Done! Users: {len(get_all_users())}, Locations: {len(get_locations())}, "
          f"Cameras: {len(get_cameras())}, Officers: {len(get_officers())}")
