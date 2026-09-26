"""In-memory session tokens for the SkillPulse prototype.

Roles are enforced by middleware. Demo passwords are prototype credentials only.
"""
import secrets
from typing import Any, Dict, Optional

# Prototype sign-in. Not a production identity store.
DEMO_USERS = {
    "admin": {
        "identifier": "admin@skillpulse.in",
        "password": "admin123",
        "display_name": "Dr. S. K. Roy",
        "role": "admin",
    },
    "employer": {
        "identifier": "employer@skillpulse.in",
        "password": "employer123",
        "display_name": "Hiring Desk",
        "role": "employer",
    },
}

TRAINEE_PASSWORD = "trainee123"
SIMULATED_OTP = "123456"

_sessions: Dict[str, Dict[str, Any]] = {}
_otp_challenges: Dict[str, str] = {}


def login(role: str, identifier: str, password: str) -> Dict[str, Any]:
    role = (role or "").strip().lower()
    identifier = (identifier or "").strip()
    password = password or ""

    if role == "admin":
        user = DEMO_USERS["admin"]
        if identifier.lower() != user["identifier"] or password != user["password"]:
            return {}
        session = {"role": "admin", "display_name": user["display_name"], "identifier": user["identifier"]}
    elif role == "employer":
        user = DEMO_USERS["employer"]
        if identifier.lower() != user["identifier"] or password != user["password"]:
            return {}
        session = {"role": "employer", "display_name": user["display_name"], "identifier": user["identifier"]}
    elif role == "trainee":
        if password != TRAINEE_PASSWORD:
            return {}
        from data_store import db
        trainee = db.get_trainee_by_id(identifier.strip())
        if not trainee:
            # Allow email match when a record has one.
            trainee = next((t for t in db.trainees if (t.email or "").lower() == identifier.lower()), None)
        if not trainee:
            return {}
        session = {
            "role": "trainee",
            "display_name": trainee.name,
            "identifier": trainee.id,
            "trainee_id": trainee.id,
        }
    else:
        return {}

    token = secrets.token_urlsafe(32)
    _sessions[token] = session
    return {"token": token, **session}


def _digits(value: str) -> str:
    return "".join(ch for ch in (value or "") if ch.isdigit())[-10:]


def request_otp(mobile: str) -> Dict[str, Any]:
    """Simulated OTP. Replace `_otp_challenges` with an SMS provider later."""
    phone = _digits(mobile)
    if len(phone) != 10:
        return {}
    _otp_challenges[phone] = SIMULATED_OTP
    from data_store import db
    existing = db.get_trainee_by_phone(phone)
    return {
        "sent": True,
        "simulated": True,
        "provider_note": "Prototype OTP. A real SMS provider can replace this step.",
        "demo_otp": SIMULATED_OTP,
        "exists": bool(existing),
        "skillpulse_id": existing.skillpulse_id if existing else None,
    }


def verify_otp(mobile: str, otp: str) -> Dict[str, Any]:
    phone = _digits(mobile)
    expected = _otp_challenges.get(phone)
    if not expected or otp.strip() != expected:
        return {"ok": False}
    from data_store import db
    trainee = db.get_trainee_by_phone(phone)
    if not trainee:
        return {"ok": True, "needs_registration": True, "mobile": phone}
    session = {
        "role": "trainee",
        "display_name": trainee.name,
        "identifier": trainee.skillpulse_id or trainee.id,
        "trainee_id": trainee.id,
        "skillpulse_id": trainee.skillpulse_id,
    }
    token = secrets.token_urlsafe(32)
    _sessions[token] = session
    return {"ok": True, "needs_registration": False, "token": token, **session}


def register_trainee_account(payload: Dict[str, Any]) -> Dict[str, Any]:
    from data_store import db
    from ecosystem import SECTORS, STATE_CODE, _make
    from models import EmploymentStatus
    phone = _digits(payload.get("phone") or payload.get("mobile") or "")
    if db.get_trainee_by_phone(phone):
        return {}
    state = payload.get("state") or "Bihar"
    code = STATE_CODE.get(state, "IN")
    number = 10000 + len(db.trainees)
    skillpulse_id = f"SP-{code}-{number}"
    sector_name = payload.get("sector") or payload.get("programme") or "Renewable Energy"
    sector_row = next((row for row in SECTORS if row["sector"] == sector_name or row["programme"] == payload.get("programme")), SECTORS[0])
    skills = payload.get("skills") or []
    if skills:
        sector_row = {**sector_row, "skills": [(item.get("name"), item.get("level") or "Beginner") for item in skills if item.get("name")]}
    status_text = payload.get("employment_status") or "Unemployed"
    try:
        status = EmploymentStatus(status_text)
    except ValueError:
        status = EmploymentStatus.UNEMPLOYED
    trainee = _make(
        7000 + len(db.trainees),
        payload.get("name") or "New Trainee",
        phone,
        skillpulse_id,
        state,
        payload.get("district") or "Patna",
        sector_row,
        status,
    )
    trainee.education = payload.get("education") or trainee.education
    trainee.training_centre = payload.get("training_centre") or trainee.training_centre
    trainee.certification_status = payload.get("certification_status") or trainee.certification_status
    trainee.age = int(payload.get("age") or trainee.age)
    db.trainees.insert(0, trainee)
    session = {
        "role": "trainee",
        "display_name": trainee.name,
        "identifier": trainee.skillpulse_id,
        "trainee_id": trainee.id,
        "skillpulse_id": trainee.skillpulse_id,
    }
    token = secrets.token_urlsafe(32)
    _sessions[token] = session
    return {"token": token, **session, "trainee": trainee.dict()}


def get_session(token: Optional[str]) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    return _sessions.get(token)


def logout(token: Optional[str]) -> None:
    if token and token in _sessions:
        del _sessions[token]


def is_allowed(role: str, method: str, path: str, session: Dict[str, Any]) -> bool:
    """Path-level permission check. Field redaction is applied in the trainee routes."""
    if path in ("/api/auth/me", "/api/auth/logout"):
        return True

    admin_only_prefixes = (
        "/api/reports",
        "/api/verification",
        "/api/followups",
    )
    if path.startswith(admin_only_prefixes) or path == "/api/ai/set-key":
        # Adaptive WhatsApp questions are part of follow-up monitoring (admin).
        return role == "admin"

    if path == "/api/trainees/export":
        return role == "admin"

    if method == "POST" and path == "/api/trainees":
        return role == "admin"

    if path.startswith("/api/trainees/") and ("update-outcome" in path or "update-verification" in path):
        return role == "admin"

    if path.startswith("/api/employers") or path.startswith("/api/jobs"):
        if path.startswith("/api/jobs") and method == "GET":
            return True
        return role in ("admin", "employer")

    if path.startswith("/api/applications"):
        return role in ("admin", "employer", "trainee")

    if path.startswith("/api/search") or path.startswith("/api/quality"):
        return role == "admin" or (path.startswith("/api/search") and role in ("admin", "employer", "trainee"))

    if path.startswith("/api/trainees"):
        if role == "admin":
            return True
        if role == "employer":
            return method == "GET"
        if role == "trainee" and method == "GET":
            own = session.get("trainee_id")
            parts = [p for p in path.split("/") if p]
            # /api/trainees/{id}
            if len(parts) >= 3 and parts[0] == "api" and parts[1] == "trainees":
                return parts[2] == own
        return False

    # Read-only intelligence used by every signed-in role.
    read_prefixes = ("/api/analytics", "/api/skillmap", "/api/ai", "/api/health", "/api/geo")
    if path.startswith(read_prefixes):
        if path == "/api/ai/set-key":
            return role == "admin"
        return True

    return role == "admin"
