"""
SIGAP Lampung v3.0 — Backend Flask (Multi-page + Auth)
Sistem Informasi Pengelolaan Sampah Provinsi Lampung
=====================================================
Roboflow AI Integration + REST API + Multi-page Dashboard
"""

import os
import random
import functools
from datetime import datetime
from flask import (Flask, render_template, jsonify, request,
                   redirect, url_for, session)
from flask_cors import CORS

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

# ── Simple Auth ────────────────────────────────────────────────────────────────
USERS = {
    "admin":    {"password": "admin123",    "name": "Administrator",    "role": "Super Admin",    "initials": "AD"},
    "gubernur": {"password": "lampung2024", "name": "Gubernur Lampung", "role": "Administrator",  "initials": "GU"},
    "operator": {"password": "operator123", "name": "Operator CCTV",   "role": "Operator",       "initials": "OP"},
}

def login_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        if "user" not in session:
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated

# ── Gambar dummy: foto sampah dari Wikimedia Commons (public domain / CC) ─────
WASTE_IMAGES = {
    "full": [
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Garbage_piled_up_on_the_streets_of_a_city.jpg/640px-Garbage_piled_up_on_the_streets_of_a_city.jpg",
            "src": "https://commons.wikimedia.org/wiki/File:Garbage_piled_up_on_the_streets_of_a_city.jpg",
            "caption": "Tumpukan sampah penuh di jalan kota",
        },
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Jakarta_garbage.jpg/640px-Jakarta_garbage.jpg",
            "src": "https://commons.wikimedia.org/wiki/File:Jakarta_garbage.jpg",
            "caption": "Sampah menumpuk — Jakarta",
        },
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Waste_dumped_on_a_road_in_India.jpg/640px-Waste_dumped_on_a_road_in_India.jpg",
            "src": "https://commons.wikimedia.org/wiki/File:Waste_dumped_on_a_road_in_India.jpg",
            "caption": "Sampah di tepi jalan raya",
        },
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Rubbish_in_East_Jakarta.jpg/640px-Rubbish_in_East_Jakarta.jpg",
            "src": "https://commons.wikimedia.org/wiki/File:Rubbish_in_East_Jakarta.jpg",
            "caption": "Penuh — Jakarta Timur",
        },
    ],
    "scattered": [
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Litter_on_the_ground.jpg/640px-Litter_on_the_ground.jpg",
            "src": "https://commons.wikimedia.org/wiki/File:Litter_on_the_ground.jpg",
            "caption": "Sampah berserakan di trotoar",
        },
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Litter_-_San_Gabriel_River%2C_California.jpg/640px-Litter_-_San_Gabriel_River%2C_California.jpg",
            "src": "https://commons.wikimedia.org/wiki/File:Litter_-_San_Gabriel_River,_California.jpg",
            "caption": "Sampah berserakan di tepi sungai",
        },
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/LitteringHighway.jpg/640px-LitteringHighway.jpg",
            "src": "https://commons.wikimedia.org/wiki/File:LitteringHighway.jpg",
            "caption": "Sampah di tepi jalan raya",
        },
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Plastic_waste_in_Asia.jpg/640px-Plastic_waste_in_Asia.jpg",
            "src": "https://commons.wikimedia.org/wiki/File:Plastic_waste_in_Asia.jpg",
            "caption": "Plastik berserakan — Asia",
        },
    ],
    "clean": [
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Clean_street_Singapore.jpg/640px-Clean_street_Singapore.jpg",
            "src": "https://commons.wikimedia.org/wiki/File:Clean_street_Singapore.jpg",
            "caption": "Jalan bersih — Singapura",
        },
        {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Clean_alley_Kyoto_Japan.jpg/640px-Clean_alley_Kyoto_Japan.jpg",
            "src": "https://commons.wikimedia.org/wiki/File:Clean_alley_Kyoto_Japan.jpg",
            "caption": "Gang bersih — Kyoto, Jepang",
        },
    ],
}

def get_img(status: str, idx: int = 0) -> dict:
    arr = WASTE_IMAGES.get(status, WASTE_IMAGES["clean"])
    return arr[idx % len(arr)]

# ── Data Lokasi ────────────────────────────────────────────────────────────────
LOCATIONS = [
    {"id": 1,  "name": "Pasar Bambu Kuning",      "kec": "Enggal",             "lat": -5.3965, "lng": 105.2669, "status": "full",      "time": "07:42", "officer": "Agus S."},
    {"id": 2,  "name": "Jl. Raden Intan",         "kec": "T. Karang Pusat",    "lat": -5.3890, "lng": 105.2601, "status": "full",      "time": "07:55", "officer": "Budi H."},
    {"id": 3,  "name": "Pasar Rajabasa",          "kec": "Rajabasa",           "lat": -5.3637, "lng": 105.2425, "status": "full",      "time": "08:10", "officer": "Dedi K."},
    {"id": 4,  "name": "Jl. Teuku Umar",          "kec": "Kedaton",            "lat": -5.3982, "lng": 105.2521, "status": "scattered", "time": "08:22", "officer": "Eko P."},
    {"id": 5,  "name": "Pasar Tugu",              "kec": "T. Karang Timur",    "lat": -5.3701, "lng": 105.2805, "status": "full",      "time": "08:35", "officer": "Feri W."},
    {"id": 6,  "name": "Jl. Kartini",             "kec": "T. Karang Barat",    "lat": -5.4018, "lng": 105.2558, "status": "clean",     "time": "09:01", "officer": "Gunawan"},
    {"id": 7,  "name": "Pasar Way Halim",         "kec": "Way Halim",          "lat": -5.3805, "lng": 105.2720, "status": "scattered", "time": "09:12", "officer": "Hendra T."},
    {"id": 8,  "name": "Jl. Sultan Agung",        "kec": "Kedaton",            "lat": -5.3925, "lng": 105.2610, "status": "clean",     "time": "09:25", "officer": "Irwan D."},
    {"id": 9,  "name": "TPA Bakung",              "kec": "Teluk Betung Barat", "lat": -5.4623, "lng": 105.2218, "status": "full",      "time": "09:31", "officer": "Joko S."},
    {"id": 10, "name": "Pasar Pasir Gintung",     "kec": "T. Karang Pusat",    "lat": -5.3834, "lng": 105.2643, "status": "scattered", "time": "09:48", "officer": "Karyono"},
    {"id": 11, "name": "Jl. Pangeran Diponegoro", "kec": "Enggal",             "lat": -5.4055, "lng": 105.2627, "status": "full",      "time": "10:02", "officer": "Lutfi A."},
    {"id": 12, "name": "Terminal Rajabasa",       "kec": "Rajabasa",           "lat": -5.3580, "lng": 105.2398, "status": "scattered", "time": "10:15", "officer": "Mahmud"},
    {"id": 13, "name": "Pasar Koga",              "kec": "Kedaton",            "lat": -5.3861, "lng": 105.2541, "status": "clean",     "time": "10:22", "officer": "Nasrul"},
    {"id": 14, "name": "Jl. Ahmad Yani",          "kec": "T. Karang Pusat",    "lat": -5.3912, "lng": 105.2684, "status": "scattered", "time": "10:30", "officer": "Osman R."},
    {"id": 15, "name": "Pasar Kangkung",          "kec": "Bumi Waras",         "lat": -5.4312, "lng": 105.2834, "status": "full",      "time": "10:44", "officer": "Purnomo"},
    {"id": 16, "name": "Jl. Wolter Monginsidi",   "kec": "Teluk Betung Utara", "lat": -5.4256, "lng": 105.2785, "status": "clean",     "time": "10:55", "officer": "Rahmat"},
    {"id": 17, "name": "Pasar Tamin",             "kec": "T. Karang Pusat",    "lat": -5.3978, "lng": 105.2715, "status": "scattered", "time": "11:01", "officer": "Sugeng"},
    {"id": 18, "name": "Jl. Hayam Wuruk",         "kec": "Enggal",             "lat": -5.4007, "lng": 105.2632, "status": "full",      "time": "11:14", "officer": "Teguh W."},
]

CCTV_LIST = [
    {"id": "CAM-01", "name": "Pasar Bambu Kuning",      "kec": "Enggal",          "status": "full",      "online": True},
    {"id": "CAM-02", "name": "Jl. Raden Intan",         "kec": "T. Karang Pusat", "status": "scattered", "online": True},
    {"id": "CAM-03", "name": "Pasar Rajabasa",          "kec": "Rajabasa",        "status": "clean",     "online": True},
    {"id": "CAM-04", "name": "Jl. Teuku Umar",          "kec": "Kedaton",         "status": "scattered", "online": True},
    {"id": "CAM-05", "name": "Pasar Tugu",              "kec": "T. Karang Timur", "status": "full",      "online": True},
    {"id": "CAM-06", "name": "Jl. Kartini",             "kec": "T. Karang Barat", "status": "clean",     "online": False},
    {"id": "CAM-07", "name": "TPA Bakung",              "kec": "Teluk Betung Barat","status": "full",    "online": True},
    {"id": "CAM-08", "name": "Pasar Pasir Gintung",     "kec": "T. Karang Pusat", "status": "scattered", "online": True},
]

TREND_DATA = {
    "labels":    ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
    "full":      [8, 11, 9, 14, 10, 13, 12],
    "scattered": [15, 18, 14, 20, 17, 19, 19],
    "clean":     [25, 19, 25, 14, 21, 16, 17],
}

# ── Helpers ────────────────────────────────────────────────────────────────────
def _summary(locations):
    return {
        "full":       sum(1 for l in locations if l["status"] == "full"),
        "scattered":  sum(1 for l in locations if l["status"] == "scattered"),
        "clean":      sum(1 for l in locations if l["status"] == "clean"),
        "total_cctv": 48,
    }

def _with_image(loc, idx):
    img = get_img(loc["status"], idx)
    return {**loc, "img_url": img["url"], "img_src": img["src"], "img_caption": img["caption"]}

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
        statuses   = ["full", "scattered", "clean"]
        mock_status = random.choice(statuses)
        label_map  = {"full": "Rubbish_Full_Load", "scattered": "Rubbish_Scatterred", "clean": "Container"}
        img        = get_img(mock_status, random.randint(0, 3))
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

# ── Page Routes ────────────────────────────────────────────────────────────────
@app.route("/login", methods=["GET", "POST"])
def login():
    if "user" in session:
        return redirect(url_for("dashboard"))
    error = None
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        user = USERS.get(username)
        if user and user["password"] == password:
            session["user"] = username
            session["name"] = user["name"]
            session["role"] = user["role"]
            session["initials"] = user["initials"]
            return redirect(url_for("dashboard"))
        error = "Username atau password salah!"
    return render_template("login.html", error=error)

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

# ── API Routes ─────────────────────────────────────────────────────────────────
@app.route("/api/stats")
def api_stats():
    summary = _summary(LOCATIONS)
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
    data = LOCATIONS
    if status_filter:
        data = [l for l in data if l["status"] == status_filter]
    data_with_img = [_with_image(loc, i) for i, loc in enumerate(data)]
    return jsonify({"locations": data_with_img, "count": len(data_with_img)})

@app.route("/api/alerts")
def api_alerts():
    limit = int(request.args.get("limit", 12))
    label_map    = {"full": "Rubbish_Full_Load", "scattered": "Rubbish_Scatterred", "clean": "Container_Clean"}
    severity_map = {"full": "critical", "scattered": "warning", "clean": "normal"}
    alerts = []
    for i, loc in enumerate(LOCATIONS[:limit]):
        img = get_img(loc["status"], i)
        alerts.append({
            "id":        loc["id"],
            "name":      loc["name"],
            "kec":       loc["kec"],
            "status":    loc["status"],
            "label":     label_map[loc["status"]],
            "severity":  severity_map[loc["status"]],
            "time":      loc["time"],
            "officer":   loc["officer"],
            "img_url":   img["url"],
            "img_src":   img["src"],
        })
    return jsonify({"alerts": alerts, "new_count": sum(1 for a in alerts if a["severity"] == "critical")})

@app.route("/api/cctv")
def api_cctv():
    cams = []
    for i, cam in enumerate(CCTV_LIST):
        img = get_img(cam["status"], i)
        cams.append({**cam, "img_url": img["url"], "img_src": img["src"],
                     "kec": cam.get("kec", "")})
    return jsonify({"cameras": cams, "online": sum(1 for c in CCTV_LIST if c["online"])})

@app.route("/api/trend")
def api_trend():
    return jsonify(TREND_DATA)

@app.route("/api/report")
def api_report():
    summary = _summary(LOCATIONS)
    handling_map = {"full": "Belum ditangani", "scattered": "Dalam proses", "clean": "Selesai"}
    detail = [{**_with_image(loc, i), "handling": handling_map[loc["status"]]} for i, loc in enumerate(LOCATIONS)]
    return jsonify({
        "date":    datetime.now().strftime("%A, %d %B %Y"),
        "summary": summary,
        "detail":  detail,
        "ai_recommendation": (
            "Berdasarkan pemantauan 48 titik CCTV di seluruh Provinsi Lampung, "
            "sistem AI mendeteksi peningkatan volume sampah sebesar 23% dibanding hari sebelumnya. "
            "Titik paling kritis: Pasar Bambu Kuning (Kec. Enggal) dan Jl. Raden Intan "
            "(Kec. Tanjung Karang Pusat). "
            "Rekomendasi: mobilisasi 2 unit armada tambahan ke zona utara sebelum pukul 10.00 WIB. "
            "Tingkat akurasi model: 96.4%."
        ),
        "model_info": {"workspace": ROBOFLOW_WORKSPACE, "workflow_id": ROBOFLOW_WORKFLOW, "accuracy": 96.4},
    })

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
    return jsonify({
        "status": "ok", "app": "SIGAP Lampung", "version": "3.0.0",
        "timestamp": datetime.now().isoformat(),
        "roboflow": {"api_url": ROBOFLOW_URL, "workspace": ROBOFLOW_WORKSPACE, "workflow_id": ROBOFLOW_WORKFLOW},
    })

# ── Entry Point ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"""
  ╔══════════════════════════════════════════════════════╗
  ║   SIGAP Lampung v3.0  — Flask Backend                ║
  ║   Sistem Informasi Pengelolaan Sampah                ║
  ╠══════════════════════════════════════════════════════╣
  ║   http://localhost:{PORT}                               
  ║   DEBUG  : {DEBUG}                                    
  ║   PORT   : {PORT}   (ubah via env PORT=xxxx)           
  ╚══════════════════════════════════════════════════════╝
    """)
    app.run(host=HOST, port=PORT, debug=DEBUG)