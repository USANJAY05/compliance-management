from datetime import datetime
import os
import sqlite3
import json

from dotenv import load_dotenv
from flask import Flask, g, jsonify, request
from flask_cors import CORS

load_dotenv()

DATABASE_PATH = os.environ.get("DATABASE_PATH", "data/tickets.db")
DEFAULT_STATUS = os.environ.get("DEFAULT_STATUS", "pending")
BACKEND_PORT = int(os.environ.get("BACKEND_PORT", "301"))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

ADDITIONAL_COLUMNS = {
    "title": "TEXT NOT NULL DEFAULT ''",
    "description": "TEXT NOT NULL DEFAULT ''",
    "target_agent": "TEXT NOT NULL DEFAULT ''",
    "tagged_agents": "TEXT NOT NULL DEFAULT ''",
    "owner_approved": "INTEGER NOT NULL DEFAULT 0",
    "admin_approved": "INTEGER NOT NULL DEFAULT 0",
    "rationale": "TEXT NOT NULL DEFAULT ''",
    "ticket_type": "TEXT NOT NULL DEFAULT 'Other'",
}


def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db_path = os.path.join(DATA_DIR, "tickets.db")
        db = sqlite3.connect(db_path)
        db.row_factory = sqlite3.Row
        g._database = db
    return db


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()


def ensure_ticket_columns(db):
    existing = {row["name"] for row in db.execute("PRAGMA table_info(tickets)").fetchall()}
    for name, definition in ADDITIONAL_COLUMNS.items():
        if name not in existing:
            db.execute(f"ALTER TABLE tickets ADD COLUMN {name} {definition}")
    db.commit()


def init_db():
    db = get_db()
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            requesting_agent TEXT NOT NULL,
            requested_permissions TEXT NOT NULL,
            sensitivity TEXT NOT NULL,
            status TEXT NOT NULL,
            reviewed INTEGER NOT NULL DEFAULT 0,
            confidential INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            title TEXT NOT NULL DEFAULT '',
            description TEXT NOT NULL DEFAULT '',
            target_agent TEXT NOT NULL DEFAULT '',
            tagged_agents TEXT NOT NULL DEFAULT '',
            owner_approved INTEGER NOT NULL DEFAULT 0,
            admin_approved INTEGER NOT NULL DEFAULT 0,
            rationale TEXT NOT NULL DEFAULT '',
            ticket_type TEXT NOT NULL DEFAULT 'Other',
            region TEXT NOT NULL DEFAULT 'Global',
            team TEXT NOT NULL DEFAULT 'General'
        )
        """
    )
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS leaves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            requesting_agent TEXT NOT NULL,
            leave_type TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            reason TEXT NOT NULL DEFAULT '',
            reviewed_by TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asset_type TEXT NOT NULL,
            serial_number TEXT NOT NULL,
            owner_agent TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'available',
            assigned_at TEXT NOT NULL DEFAULT '',
            notes TEXT NOT NULL DEFAULT ''
        )
        """
    )
    db.commit()
    ensure_ticket_columns(db)


with app.app_context():
    init_db()


def get_row_value(row: sqlite3.Row, key: str, default="") -> str:
    return row[key] if key in row.keys() else default


def row_to_dict(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "requesting_agent": row["requesting_agent"],
        "requested_permissions": row["requested_permissions"],
        "sensitivity": row["sensitivity"],
        "status": row["status"],
        "reviewed": bool(row["reviewed"]),
        "confidential": bool(row["confidential"]),
        "title": get_row_value(row, "title"),
        "description": get_row_value(row, "description"),
        "target_agent": get_row_value(row, "target_agent"),
        "tagged_agents": get_row_value(row, "tagged_agents"),
        "owner_approved": bool(get_row_value(row, "owner_approved", 0)),
        "admin_approved": bool(get_row_value(row, "admin_approved", 0)),
        "rationale": get_row_value(row, "rationale"),
        "ticket_type": get_row_value(row, "ticket_type", "Other"),
        "region": get_row_value(row, "region", "Global"),
        "team": get_row_value(row, "team", "General"),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


@app.route("/tickets", methods=["GET"])
def list_tickets():
    db = get_db()
    rows = db.execute("SELECT * FROM tickets ORDER BY created_at DESC").fetchall()
    return jsonify([row_to_dict(row) for row in rows])


@app.route("/tickets", methods=["POST"])
def create_ticket():
    payload = request.get_json(force=True)
    required_fields = ["requesting_agent", "requested_permissions", "sensitivity"]
    for field in required_fields:
        if not payload.get(field):
            return (
                jsonify({"error": f"{field} is required"}),
                400,
            )

    status = payload.get("status", DEFAULT_STATUS)
    reviewed = bool(payload.get("reviewed", False))
    confidential = bool(payload.get("confidential", False))
    title = payload.get("title", "").strip()
    description = payload.get("description", "").strip()
    target_agent = payload.get("target_agent", "").strip()
    tagged_agents = payload.get("tagged_agents", "").strip()
    rationale = payload.get("rationale", "").strip()
    ticket_type = payload.get("ticket_type", "Other").strip()
    owner_approved = bool(payload.get("owner_approved", False))
    admin_approved = bool(payload.get("admin_approved", False))
    # Auto-inherit from User registry if not provided
    auto_region = "Global"
    auto_team = "General"
    try:
        import json
        with open("data/users.json", "r") as f:
            users_mem = json.load(f)
            for u in users_mem:
                if u["id"] == payload.get("requesting_agent"):
                    auto_region = u.get("region", "Global")
                    auto_team = u.get("team", "General")
                    break
    except:
        pass

    region = payload.get("region", auto_region)
    team = payload.get("team", auto_team)

    db = get_db()
    cursor = db.execute(
        """
        INSERT INTO tickets (
            requesting_agent,
            requested_permissions,
            sensitivity,
            status,
            reviewed,
            confidential,
            title,
            description,
            target_agent,
            tagged_agents,
            owner_approved,
            admin_approved,
            rationale,
            ticket_type,
            region,
            team,
            created_at,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload["requesting_agent"],
            payload["requested_permissions"],
            payload["sensitivity"],
            status,
            int(reviewed),
            int(confidential),
            title,
            description,
            target_agent,
            tagged_agents,
            int(owner_approved),
            int(admin_approved),
            rationale,
            ticket_type,
            region,
            team,
            timestamp,
            timestamp,
        ),
    )
    db.commit()
    ticket_id = cursor.lastrowid
    row = db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
    return jsonify(row_to_dict(row)), 201


def update_status(ticket_id, reviewed=None, status=None):
    db = get_db()
    row = db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
    if row is None:
        return None
    new_reviewed = reviewed if reviewed is not None else row["reviewed"]
    new_status = status if status is not None else row["status"]
    timestamp = now_iso()
    db.execute(
        """
        UPDATE tickets
        SET reviewed = ?, status = ?, updated_at = ?
        WHERE id = ?
        """,
        (new_reviewed, new_status, timestamp, ticket_id),
    )
    db.commit()
    return db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()


def set_approval_flag(ticket_id, column, approved):
    if column not in {"owner_approved", "admin_approved"}:
        return None
    db = get_db()
    row = db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
    if row is None:
        return None
    timestamp = now_iso()
    db.execute(
        f"UPDATE tickets SET {column} = ?, updated_at = ? WHERE id = ?",
        (int(approved), timestamp, ticket_id),
    )
    db.commit()
    return db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()


@app.route("/tickets/<int:ticket_id>/reviewed", methods=["PATCH"])
def mark_reviewed(ticket_id):
    payload = request.get_json(force=True)
    reviewed = bool(payload.get("reviewed", True))
    current_role = payload.get("current_role", "").strip().lower()
    
    # Only Admin or Owner or original Target can mark reviewed
    if current_role not in ["admin", "owner"]:
        # Allow junior agents to review their own assignments if needed?
        # For now, strict: admin/owner only for compliance
        return jsonify({"error": "Only Admins or Owners can finalize reviews."}), 403

    status = payload.get("status", "reviewed" if reviewed else DEFAULT_STATUS)
    row = update_status(ticket_id, reviewed=int(reviewed), status=status)
    if row is None:
        return jsonify({"error": "Ticket not found"}), 404
    return jsonify(row_to_dict(row))


@app.route("/tickets/<int:ticket_id>/confidential", methods=["PATCH"])
def mark_confidential(ticket_id):
    payload = request.get_json(force=True)
    confidential = bool(payload.get("confidential", True))
    current_role = payload.get("current_role", "").strip().lower()

    if current_role not in ["admin", "owner"]:
        return jsonify({"error": "Only Admins or Owners can toggle confidentiality."}), 403

    timestamp = now_iso()
    db = get_db()
    row = db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Ticket not found"}), 404
    db.execute(
        "UPDATE tickets SET confidential = ?, updated_at = ? WHERE id = ?",
        (int(confidential), timestamp, ticket_id),
    )
    db.commit()
    updated = db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
    return jsonify(row_to_dict(updated))


@app.route("/tickets/<int:ticket_id>/owner-approval", methods=["PATCH"])
def owner_approval(ticket_id):
    payload = request.get_json(force=True)
    approved = bool(payload.get("approved", True))
    current_user = payload.get("current_user", "").strip()
    current_role = payload.get("current_role", "").strip()
    next_agent = payload.get("next_agent", "").strip()

    db = get_db()
    row = db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Ticket not found"}), 404

    target = row["target_agent"].strip()
    if target and current_user and target.lower() != current_user.lower():
        if current_role.lower() != "owner":
            return jsonify({"error": f"Only the tagged person ({target}) or an Owner can owner-approve this ticket."}), 403

    timestamp = now_iso()
    
    if approved and next_agent:
        # Proceed to next person in chain
        tagged = row["tagged_agents"]
        new_tagged = f"{tagged}, {next_agent}" if tagged else next_agent
        db.execute(
            """
            UPDATE tickets
            SET target_agent = ?, tagged_agents = ?, owner_approved = 0, updated_at = ?
            WHERE id = ?
            """,
            (next_agent, new_tagged, timestamp, ticket_id),
        )
    else:
        # Normal approval/rejection
        db.execute(
            "UPDATE tickets SET owner_approved = ?, updated_at = ? WHERE id = ?",
            (int(approved), timestamp, ticket_id),
        )
        
    db.commit()
    updated = db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
    return jsonify(row_to_dict(updated))


@app.route("/tickets/<int:ticket_id>/admin-approval", methods=["PATCH"])
def admin_approval(ticket_id):
    payload = request.get_json(force=True)
    approved = bool(payload.get("approved", True))
    current_role = payload.get("current_role", "").strip().lower()

    if current_role not in ["admin", "owner"]:
        return jsonify({"error": "Insufficient privileges. Admin/Owner role required."}), 403

    row = set_approval_flag(ticket_id, "admin_approved", approved)
    if row is None:
        return jsonify({"error": "Ticket not found"}), 404
    return jsonify(row_to_dict(row))


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "database": DATABASE_PATH})

@app.route("/leaves", methods=["GET"])
def get_leaves():
    db = get_db()
    rows = db.execute("SELECT * FROM leaves ORDER BY created_at DESC").fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/leaves", methods=["POST"])
def request_leave():
    payload = request.get_json(force=True)
    req_agent = payload.get("requesting_agent", "").strip()
    l_type = payload.get("leave_type", "annual").strip()
    s_date = payload.get("start_date", "").strip()
    e_date = payload.get("end_date", "").strip()
    reason = payload.get("reason", "").strip()
    
    if not req_agent or not s_date or not e_date:
        return jsonify({"error": "Missing required fields"}), 400
        
    ts = now_iso()
    db = get_db()
    cursor = db.execute(
        "INSERT INTO leaves (requesting_agent, leave_type, start_date, end_date, reason, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (req_agent, l_type, s_date, e_date, reason, ts, ts)
    )
    db.commit()
    row = db.execute("SELECT * FROM leaves WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return jsonify(dict(row)), 201

@app.route("/leaves/<int:leave_id>/approve", methods=["PATCH"])
def approve_leave(leave_id):
    payload = request.get_json(force=True)
    status = payload.get("status", "approved")
    reviewer = payload.get("reviewed_by", "system")
    db = get_db()
    db.execute(
        "UPDATE leaves SET status = ?, reviewed_by = ?, updated_at = ? WHERE id = ?",
        (status, reviewer, now_iso(), leave_id)
    )
    db.commit()
    row = db.execute("SELECT * FROM leaves WHERE id = ?", (leave_id,)).fetchone()
    if not row:
        return jsonify({"error": "Leave not found"}), 404
    return jsonify(dict(row)), 200

@app.route("/assets", methods=["GET"])
def get_assets():
    db = get_db()
    rows = db.execute("SELECT * FROM assets ORDER BY id ASC").fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/assets", methods=["POST"])
def create_asset():
    payload = request.get_json(force=True)
    a_type = payload.get("asset_type", "Laptop").strip()
    serial = payload.get("serial_number", "").strip()
    notes = payload.get("notes", "").strip()
    owner = payload.get("owner_agent", "").strip()
    
    status = "assigned" if owner else "available"
    assigned = now_iso() if owner else ""
    
    if not serial:
        return jsonify({"error": "Serial number is required"}), 400
        
    db = get_db()
    cursor = db.execute(
        "INSERT INTO assets (asset_type, serial_number, owner_agent, status, assigned_at, notes) VALUES (?, ?, ?, ?, ?, ?)",
        (a_type, serial, owner, status, assigned, notes)
    )
    db.commit()
    row = db.execute("SELECT * FROM assets WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return jsonify(dict(row)), 201

@app.route("/assets/<int:asset_id>/assign", methods=["PATCH"])
def assign_asset(asset_id):
    payload = request.get_json(force=True)
    owner = payload.get("owner_agent", "").strip()
    status = payload.get("status", "assigned" if owner else "available")
    assigned_at = now_iso() if owner else ""
    
    db = get_db()
    db.execute(
        "UPDATE assets SET owner_agent = ?, status = ?, assigned_at = ? WHERE id = ?",
        (owner, status, assigned_at, asset_id)
    )
    db.commit()
    row = db.execute("SELECT * FROM assets WHERE id = ?", (asset_id,)).fetchone()
    if not row:
        return jsonify({"error": "Asset not found"}), 404
    return jsonify(dict(row)), 200

@app.route("/ticket-types", methods=["GET", "POST"])
def manage_ticket_types():
    return handle_generic_list("ticket_types.json", ["Other"])

@app.route("/users", methods=["GET", "POST"])
def manage_users():
    filepath = os.path.join(DATA_DIR, "users.json")
    
    if request.method == "GET":
        try:
            with open(filepath, "r") as f:
                return jsonify(json.load(f))
        except:
            return jsonify([])

    if request.method == "POST":
        payload = request.get_json(force=True)
        user_id = payload.get("id", "").strip()
        password = payload.get("password", "").strip()
        role = payload.get("role", "member").strip()
        team = payload.get("team", "General").strip()
        region = payload.get("region", "Global").strip()
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
            
        try:
            with open(filepath, "r") as f:
                users = json.load(f)
        except:
            users = []
            
        # Update or append
        found = False
        for u in users:
            if u["id"] == user_id:
                u["role"] = role
                u["team"] = team
                u["region"] = region
                if password:
                    u["password"] = password
                found = True
                break
        if not found:
            users.append({
                "id": user_id, 
                "role": role, 
                "password": password, 
                "team": team, 
                "region": region
            })
            
        with open(filepath, "w") as f:
            json.dump(users, f, indent=2)
        return jsonify({"message": "User saved", "users": users})

@app.route("/users/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    filepath = os.path.join(DATA_DIR, "users.json")
    try:
        with open(filepath, "r") as f:
            users = json.load(f)
    except:
        return jsonify({"error": "No users found"}), 404
        
    filtered = [u for u in users if u["id"] != user_id]
    with open(filepath, "w") as f:
        json.dump(filtered, f, indent=2)
    return jsonify({"message": "User deleted", "users": filtered})

@app.route("/auth/login", methods=["POST"])
def auth_login():
    payload = request.get_json(force=True)
    user_id = payload.get("id", "").strip()
    password = payload.get("password", "").strip()
    
    if not user_id or not password:
        return jsonify({"error": "System ID and Password are required"}), 400
        
    try:
        with open(os.path.join(DATA_DIR, "users.json"), "r") as f:
            users = json.load(f)
    except Exception:
        return jsonify({"error": "Identity registry offline"}), 500
        
    for u in users:
        if u["id"] == user_id and u.get("password") == password:
            return jsonify({"id": u["id"], "role": u["role"]}), 200
            
    return jsonify({"error": "Invalid credential pair"}), 401

# --- UNIVERSAL REGISTRY HANDLERS ---

def handle_generic_list(filename, protected_items=[]):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        # Create it if it doesn't exist (initial seed)
        if filename == "regions.json":
            initial = ["Global", "North America", "EMEA", "APAC", "LATAM"]
        elif filename == "teams.json":
            initial = ["General", "Operations", "Research", "Security", "DevOps", "Engineering", "Executive"]
        elif filename == "roles.json":
            initial = ["owner", "admin", "member", "agent"]
        else:
            initial = []
        with open(path, "w") as f:
            json.dump(initial, f)
        return jsonify(initial)
    
    if request.method == "POST":
        payload = request.get_json(force=True)
        with open(path, "r") as f:
            items = json.load(f)
        
        if payload.get("action") == "add":
            val = payload.get("value")
            if val and val not in items:
                items.append(val)
        elif payload.get("action") == "remove":
            val = payload.get("value")
            if val in items and val not in protected_items:
                items.remove(val)
        
        with open(path, "w") as f:
            json.dump(items, f)
        return jsonify(items)
        
    with open(path, "r") as f:
        return jsonify(json.load(f))

@app.route("/regions", methods=["GET", "POST"])
def manage_regions():
    return handle_generic_list("regions.json", ["Global"])

@app.route("/teams", methods=["GET", "POST"])
def manage_teams():
    return handle_generic_list("teams.json", ["General"])

@app.route("/roles", methods=["GET", "POST"])
def manage_roles():
    return handle_generic_list("roles.json", ["owner", "admin"])

# --- END UNIVERSAL REGISTRY HANDLERS ---

if __name__ == "__main__":
    print(f"Starting ticketing API on port {BACKEND_PORT}, database at {DATABASE_PATH}")
    app.run(host="0.0.0.0", port=BACKEND_PORT)
