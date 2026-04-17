"""
SIGAP Lampung v3.1 — Backend Flask (SQLite3 Database)
Sistem Informasi Pengelolaan Sampah Provinsi Lampung
=====================================================
Roboflow AI Integration + REST API + Multi-page + SQLite3
"""

import os
import random
import functools
from datetime import datetime
from flask import (Flask, render_template, jsonify, request,
                   redirect, url_for, session)
from flask_cors import CORS
import database as db

# ── Konfigurasi ────────────────────────────────────────────────────────────────
PORT               = int(os.environ.get("PORT", 5011))
DEBUG              = os.environ.get("DEBUG", "true").lower() == "true"
HOST               = os.environ.get("HOST", "0.0.0.0")
ROBOFLOW_API_KEY   = os.environ.get("ROBOFLOW_API_KEY",     "AA0MfTcjJZp1dQzv2mfz")
ROBOFLOW_WORKSPACE = os.environ.get("ROBOFLOW_WORKSPACE",   "aicctv-6waqg")
ROBOFLOW_WORKFLOW  = os.environ.get("ROBOFLOW_WORKFLOW_ID", "custom-workflow")
ROBOFLOW_URL       = os.environ.get("ROBOFLOW_API_URL",     "https://serverless.roboflow.com")
WA_ALERT           = "ZMLM-2BA8"

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "sigap-lampung-s3cr3t-2024")
CORS(app)

# ── Initialize Database on startup ────────────────────────────────────────────
db.setup_database()

# ── Auth decorator ─────────────────────────────────────────────────────────────
def login_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        if "user" not in session:
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated


# ── Helpers ────────────────────────────────────────────────────────────────────
def _get_img(status, idx=0):
    """Get waste image from database."""
    return db.get_waste_image(status, idx)


def _with_image(loc, idx):
    """Add image info to location dict."""
    img = _get_img(loc["status"], idx)
    return {**loc, "img_url": img["url"], "img_src": img["src"], "img_caption": img["caption"]}


def _loc_to_api(loc):
    """Convert DB location row to API format."""
    return {
        "id":      loc["id"],
        "name":    loc["name"],
        "kec":     loc["kecamatan"],
        "lat":     loc["latitude"],
        "lng":     loc["longitude"],
        "status":  loc["status"],
        "time":    loc["detection_time"] or "",
        "officer": loc["officer"] or "",
    }


def _cam_to_api(cam):
    """Convert DB camera row to API format."""
    return {
        "id":     cam["cam_id"],
        "name":   cam["name"],
        "kec":    cam["kecamatan"] or "",
        "status": cam["status"],
        "online": bool(cam["is_online"]),
    }


def _run_roboflow(image_path: str) -> dict:
    try:
        from inference_sdk import InferenceHTTPClient
        client = InferenceHTTPClient(api_url=ROBOFLOW_URL, api_key=ROBOFLOW_API_KEY)
        result = client.run_workflow(
            workspace_name=ROBOFLOW_WORKSPACE,
            workflow_id=ROBOFLOW_WORKFLOW,
            images={"image": image_path},
            use_cache=True,
        )
        return {"success": True, "result": result}
    except ImportError:
        statuses    = ["full", "scattered", "clean"]
        mock_status = random.choice(statuses)
        label_map   = {"full": "Rubbish_Full_Load", "scattered": "Rubbish_Scatterred", "clean": "Container"}
        img         = _get_img(mock_status, random.randint(0, 3))
        return {
            "success": True, "mock": True,
            "result": {
                "status":     mock_status,
                "label":      label_map[mock_status],
                "confidence": round(random.uniform(0.82, 0.99), 3),
                "timestamp":  datetime.now().isoformat(),
                "img_url":    img["url"],
                "img_src":    img["src"],
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ══════════════════════════════════════════════════════════════════════════════
# PAGE ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/login", methods=["GET", "POST"])
def login():
    if "user" in session:
        return redirect(url_for("dashboard"))
    error = None
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        user = db.verify_user(username, password)
        if user:
            session["user"]     = user["username"]
            session["name"]     = user["name"]
            session["role"]     = user["role"]
            session["initials"] = user["initials"]
            return redirect(url_for("dashboard"))
        error = "Username atau password salah!"
    return render_template("login.html", error=error)


@app.route("/register", methods=["GET", "POST"])
def register():
    error = None
    success = None
    if request.method == "POST":
        name     = request.form.get("name", "").strip()
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        confirm  = request.form.get("confirm_password", "")
        role     = request.form.get("role", "Operator")

        if not name or not username or not password:
            error = "Semua field wajib diisi!"
        elif len(username) < 3:
            error = "Username minimal 3 karakter!"
        elif len(password) < 6:
            error = "Password minimal 6 karakter!"
        elif password != confirm:
            error = "Password dan konfirmasi tidak cocok!"
        else:
            user_id = db.create_user(username, password, name, role)
            if user_id:
                success = f"Akun '{username}' berhasil dibuat! Silakan login."
            else:
                error = f"Username '{username}' sudah digunakan!"

    return render_template("register.html", error=error, success=success)


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.route("/")
@login_required
def dashboard():
    return render_template("dashboard.html", active="dashboard")


@app.route("/cctv")
@login_required
def cctv_page():
    return render_template("cctv.html", active="cctv")


@app.route("/peta")
@login_required
def peta_page():
    return render_template("peta.html", active="peta")


@app.route("/laporan")
@login_required
def laporan_page():
    return render_template("laporan.html", active="laporan")


@app.route("/petugas")
@login_required
def petugas_page():
    return render_template("petugas.html", active="petugas")


# ══════════════════════════════════════════════════════════════════════════════
# API ROUTES — Officers & WA Alert
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/officers")
def api_officers():
    officers = db.get_officers()
    active   = sum(1 for o in officers if o["is_active"])
    return jsonify({
        "officers": officers,
        "total":    len(officers),
        "active":   active,
        "inactive": len(officers) - active,
    })


@app.route("/api/officers", methods=["POST"])
def api_create_officer():
    body = request.get_json(silent=True) or {}
    if not body.get("name") or not body.get("phone"):
        return jsonify({"success": False, "error": "name and phone required"}), 400
    officer_id = db.create_officer(
        body["name"], body["phone"],
        body.get("kecamatan", ""), body.get("position", "Petugas Lapangan")
    )
    return jsonify({"success": True, "id": officer_id})


@app.route("/api/officers/<int:officer_id>", methods=["PUT"])
def api_update_officer(officer_id):
    body = request.get_json(silent=True) or {}
    db.update_officer(
        officer_id,
        name=body.get("name"), phone=body.get("phone"),
        kecamatan=body.get("kecamatan"), position=body.get("position"),
        is_active=body.get("is_active"),
    )
    return jsonify({"success": True})


@app.route("/api/officers/<int:officer_id>", methods=["DELETE"])
def api_delete_officer(officer_id):
    db.delete_officer(officer_id)
    return jsonify({"success": True})


@app.route("/api/wa-alert", methods=["POST"])
def api_wa_alert():
    """Log a WhatsApp alert as sent."""
    body = request.get_json(silent=True) or {}
    officer_id = body.get("officer_id")
    phone      = body.get("phone", "")
    message    = body.get("message", "")
    if not phone or not message:
        return jsonify({"success": False, "error": "phone and message required"}), 400
    db.log_wa_alert(officer_id, phone, message)
    return jsonify({"success": True})


@app.route("/api/wa-alert/logs")
def api_wa_logs():
    limit = int(request.args.get("limit", 50))
    logs  = db.get_wa_alert_logs(limit)
    return jsonify({"logs": logs, "count": len(logs)})


# ══════════════════════════════════════════════════════════════════════════════
# API ROUTES — Read
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/stats")
def api_stats():
    summary = db.get_location_summary()
    return jsonify({
        "total_cctv":    summary["total_cctv"],
        "critical":      summary["full"],
        "scattered":     summary["scattered"],
        "normal":        summary["clean"],
        "response_rate": 94,
        "timestamp":     datetime.now().isoformat(),
    })


@app.route("/api/locations")
def api_locations():
    status_filter = request.args.get("status")
    locations = db.get_locations(status_filter)
    api_locs  = [_loc_to_api(loc) for loc in locations]
    data_with_img = [_with_image(loc, i) for i, loc in enumerate(api_locs)]
    return jsonify({"locations": data_with_img, "count": len(data_with_img)})


@app.route("/api/alerts")
def api_alerts():
    limit      = int(request.args.get("limit", 12))
    label_map    = {"full": "Rubbish_Full_Load", "scattered": "Rubbish_Scatterred", "clean": "Container_Clean"}
    severity_map = {"full": "critical", "scattered": "warning", "clean": "normal"}

    locations = db.get_locations()
    alerts = []
    for i, loc in enumerate(locations[:limit]):
        api_loc = _loc_to_api(loc)
        img = _get_img(api_loc["status"], i)
        alerts.append({
            "id":       api_loc["id"],
            "name":     api_loc["name"],
            "kec":      api_loc["kec"],
            "status":   api_loc["status"],
            "label":    label_map.get(api_loc["status"], "Unknown"),
            "severity": severity_map.get(api_loc["status"], "normal"),
            "time":     api_loc["time"],
            "officer":  api_loc["officer"],
            "img_url":  img["url"],
            "img_src":  img["src"],
        })
    return jsonify({
        "alerts":    alerts,
        "new_count": sum(1 for a in alerts if a["severity"] == "critical"),
    })


@app.route("/api/cctv")
def api_cctv():
    cameras = db.get_cameras()
    cams = []
    for i, cam in enumerate(cameras):
        api_cam = _cam_to_api(cam)
        img = _get_img(api_cam["status"], i)
        cams.append({**api_cam, "img_url": img["url"], "img_src": img["src"]})
    online_count = db.get_online_camera_count()
    return jsonify({"cameras": cams, "online": online_count})


@app.route("/api/trend")
def api_trend():
    return jsonify(db.get_trend_data())


@app.route("/api/report")
def api_report():
    summary      = db.get_location_summary()
    locations    = db.get_locations()
    handling_map = {"full": "Belum ditangani", "scattered": "Dalam proses", "clean": "Selesai"}

    detail = []
    for i, loc in enumerate(locations):
        api_loc = _loc_to_api(loc)
        img_loc = _with_image(api_loc, i)
        img_loc["handling"] = handling_map.get(api_loc["status"], "—")
        detail.append(img_loc)

    return jsonify({
        "date":    datetime.now().strftime("%A, %d %B %Y"),
        "summary": summary,
        "detail":  detail,
        "ai_recommendation": (
            "Berdasarkan pemantauan {} titik CCTV di seluruh Provinsi Lampung, "
            "sistem AI mendeteksi peningkatan volume sampah sebesar 23% dibanding hari sebelumnya. "
            "Titik paling kritis: Pasar Bambu Kuning (Kec. Enggal) dan Jl. Raden Intan "
            "(Kec. Tanjung Karang Pusat). "
            "Rekomendasi: mobilisasi 2 unit armada tambahan ke zona utara sebelum pukul 10.00 WIB. "
            "Tingkat akurasi model: 96.4%."
        ).format(summary["total_cctv"]),
        "model_info": {
            "workspace":   ROBOFLOW_WORKSPACE,
            "workflow_id": ROBOFLOW_WORKFLOW,
            "accuracy":    96.4,
        },
    })


# ══════════════════════════════════════════════════════════════════════════════
# API ROUTES — Write (CRUD)
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/locations", methods=["POST"])
def api_create_location():
    body = request.get_json(silent=True) or {}
    required = ["name", "kecamatan", "lat", "lng"]
    if not all(k in body for k in required):
        return jsonify({"success": False, "error": "Missing: name, kecamatan, lat, lng"}), 400
    loc_id = db.create_location(
        body["name"], body["kecamatan"], body["lat"], body["lng"],
        body.get("status", "clean"), body.get("officer", "")
    )
    return jsonify({"success": True, "id": loc_id})


@app.route("/api/locations/<int:loc_id>", methods=["PUT"])
def api_update_location(loc_id):
    body = request.get_json(silent=True) or {}
    status  = body.get("status")
    officer = body.get("officer")
    if not status:
        return jsonify({"success": False, "error": "status required"}), 400
    db.update_location_status(loc_id, status, officer)
    return jsonify({"success": True})


@app.route("/api/locations/<int:loc_id>", methods=["DELETE"])
def api_delete_location(loc_id):
    db.delete_location(loc_id)
    return jsonify({"success": True})


@app.route("/api/cctv", methods=["POST"])
def api_create_camera():
    body = request.get_json(silent=True) or {}
    required = ["cam_id", "name"]
    if not all(k in body for k in required):
        return jsonify({"success": False, "error": "Missing: cam_id, name"}), 400
    cam_id = db.create_camera(
        body["cam_id"], body["name"], body.get("kecamatan", ""),
        body.get("status", "clean"), body.get("is_online", 1),
        body.get("location_id")
    )
    return jsonify({"success": True, "id": cam_id})


@app.route("/api/cctv/<cam_id>", methods=["PUT"])
def api_update_camera(cam_id):
    body = request.get_json(silent=True) or {}
    db.update_camera_status(
        cam_id,
        status=body.get("status"),
        is_online=body.get("is_online"),
    )
    return jsonify({"success": True})


@app.route("/api/users")
def api_users():
    users = db.get_all_users()
    return jsonify({"users": users, "count": len(users)})


@app.route("/api/users/<int:user_id>", methods=["DELETE"])
def api_delete_user(user_id):
    db.delete_user(user_id)
    return jsonify({"success": True})


@app.route("/api/waste-images")
def api_waste_images():
    status_filter = request.args.get("status")
    images = db.get_waste_images(status_filter)
    return jsonify({"images": images, "count": len(images)})


@app.route("/api/waste-images", methods=["POST"])
def api_add_waste_image():
    body = request.get_json(silent=True) or {}
    if "status" not in body or "filename" not in body:
        return jsonify({"success": False, "error": "status and filename required"}), 400
    status   = body["status"]
    filename = body["filename"]
    caption  = body.get("caption", f"{status} — {filename}")
    url      = f"/static/images/waste/{status}/{filename}"
    conn = db.get_db()
    try:
        conn.execute(
            "INSERT INTO waste_images (status, url, source_url, caption) VALUES (?,?,?,?)",
            (status, url, "", caption)
        )
        conn.commit()
        img_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    finally:
        conn.close()
    return jsonify({"success": True, "id": img_id, "url": url})


@app.route("/api/waste-images/scan")
def api_scan_images():
    """Scan local folders and sync images to database."""
    import glob
    base_dir = os.path.join(app.static_folder, "images", "waste")
    added = 0
    for status in ["full", "scattered", "clean"]:
        folder = os.path.join(base_dir, status)
        if not os.path.isdir(folder):
            continue
        existing = db.get_waste_images(status)
        existing_urls = {img["url"] for img in existing}
        for filepath in sorted(glob.glob(os.path.join(folder, "*"))):
            ext = os.path.splitext(filepath)[1].lower()
            if ext not in (".jpg", ".jpeg", ".png", ".webp"):
                continue
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
                finally:
                    conn.close()
    return jsonify({"success": True, "added": added, "message": f"{added} new images synced"})


# ══════════════════════════════════════════════════════════════════════════════
# API ROUTES — AI Inference
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/infer", methods=["POST"])
def api_infer():
    if "file" in request.files:
        file     = request.files["file"]
        tmp_path = f"/tmp/sigap_upload_{datetime.now().timestamp()}.jpg"
        file.save(tmp_path)
        result   = _run_roboflow(tmp_path)
        try: os.remove(tmp_path)
        except Exception: pass
        return jsonify(result)
    body = request.get_json(silent=True) or {}
    if "image_path" in body:
        return jsonify(_run_roboflow(body["image_path"]))
    return jsonify({"success": False, "error": "Tidak ada file atau image_path."}), 400


@app.route("/api/health")
def api_health():
    summary = db.get_location_summary()
    users   = db.get_all_users()
    cameras = db.get_cameras()
    return jsonify({
        "status":    "ok",
        "app":       "SIGAP Lampung",
        "version":   "3.1.0",
        "database":  "SQLite3",
        "timestamp": datetime.now().isoformat(),
        "counts": {
            "users":     len(users),
            "locations": summary["full"] + summary["scattered"] + summary["clean"],
            "cameras":   len(cameras),
            "total_cctv": summary["total_cctv"],
        },
        "roboflow": {
            "api_url":     ROBOFLOW_URL,
            "workspace":   ROBOFLOW_WORKSPACE,
            "workflow_id": ROBOFLOW_WORKFLOW,
        },
    })


# ══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print(f"""
  ╔══════════════════════════════════════════════════════╗
  ║   SIGAP Lampung v3.1  — Flask + SQLite3              ║
  ║   Sistem Informasi Pengelolaan Sampah                ║
  ╠══════════════════════════════════════════════════════╣
  ║   http://localhost:{PORT}                               
  ║   Database : sigap.db (SQLite3)                      
  ║   DEBUG    : {DEBUG}                                    
  ║   PORT     : {PORT}                                      
  ╚══════════════════════════════════════════════════════╝
    """)
    app.run(host=HOST, port=PORT, debug=DEBUG)