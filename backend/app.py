from datetime import datetime
import os
import sqlite3

from dotenv import load_dotenv
from flask import Flask, g, jsonify, request
from flask_cors import CORS

load_dotenv()

DATABASE_PATH = os.environ.get("DATABASE_PATH", "data/tickets.db")
DEFAULT_STATUS = os.environ.get("DEFAULT_STATUS", "pending")
BACKEND_PORT = int(os.environ.get("BACKEND_PORT", "5000"))

app = Flask(__name__)
CORS(app)

ADDITIONAL_COLUMNS = {
    "title": "TEXT NOT NULL DEFAULT ''",
    "description": "TEXT NOT NULL DEFAULT ''",
    "target_agent": "TEXT NOT NULL DEFAULT ''",
    "tagged_agents": "TEXT NOT NULL DEFAULT ''",
    "owner_approved": "INTEGER NOT NULL DEFAULT 0",
    "admin_approved": "INTEGER NOT NULL DEFAULT 0",
    "rationale": "TEXT NOT NULL DEFAULT ''",
}


def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        directory = os.path.dirname(DATABASE_PATH) or "."
        os.makedirs(directory, exist_ok=True)
        db = sqlite3.connect(DATABASE_PATH)
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
            rationale TEXT NOT NULL DEFAULT ''
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
    owner_approved = bool(payload.get("owner_approved", False))
    admin_approved = bool(payload.get("admin_approved", False))
    timestamp = now_iso()

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
            created_at,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    status = payload.get("status", "reviewed" if reviewed else DEFAULT_STATUS)
    row = update_status(ticket_id, reviewed=int(reviewed), status=status)
    if row is None:
        return jsonify({"error": "Ticket not found"}), 404
    return jsonify(row_to_dict(row))


@app.route("/tickets/<int:ticket_id>/confidential", methods=["PATCH"])
def mark_confidential(ticket_id):
    payload = request.get_json(force=True)
    confidential = bool(payload.get("confidential", True))
    timestamp = now_iso()
    db = get_db()
    row = db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Ticket not found"}), 404
    db.execute(
        """
        UPDATE tickets
        SET confidential = ?, updated_at = ?
        WHERE id = ?
        """,
        (int(confidential), timestamp, ticket_id),
    )
    db.commit()
    updated = db.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
    return jsonify(row_to_dict(updated))


@app.route("/tickets/<int:ticket_id>/owner-approval", methods=["PATCH"])
def owner_approval(ticket_id):
    payload = request.get_json(force=True)
    approved = bool(payload.get("approved", True))
    row = set_approval_flag(ticket_id, "owner_approved", approved)
    if row is None:
        return jsonify({"error": "Ticket not found"}), 404
    return jsonify(row_to_dict(row))


@app.route("/tickets/<int:ticket_id>/admin-approval", methods=["PATCH"])
def admin_approval(ticket_id):
    payload = request.get_json(force=True)
    approved = bool(payload.get("approved", True))
    row = set_approval_flag(ticket_id, "admin_approved", approved)
    if row is None:
        return jsonify({"error": "Ticket not found"}), 404
    return jsonify(row_to_dict(row))


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "database": DATABASE_PATH})


if __name__ == "__main__":
    print(f"Starting ticketing API on port {BACKEND_PORT}, database at {DATABASE_PATH}")
    app.run(host="0.0.0.0", port=BACKEND_PORT)
