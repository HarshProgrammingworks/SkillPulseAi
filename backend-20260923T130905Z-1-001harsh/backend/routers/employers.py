from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from data_store import db
from intelligence import match_candidates
from models import MatchRequest

router = APIRouter(prefix="/api/employers", tags=["Employers"])


@router.get("")
def list_employers():
    return {"notice": "Synthetic demonstration employers. Not an official registry.", "items": db.organisations}


@router.post("")
def add_employer(payload: Dict[str, Any]):
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Organisation name is required.")
    record = {
        "id": f"EMP-{len(db.organisations) + 1:04d}",
        "name": name,
        "industry": payload.get("industry") or "",
        "contact_person": payload.get("contact_person") or "",
        "email": payload.get("email") or "",
        "phone": payload.get("phone") or "",
        "state": payload.get("state") or "",
        "district": payload.get("district") or "",
        "address": payload.get("address") or "",
        "location": payload.get("address") or payload.get("district") or "",
        "organisation_type": payload.get("organisation_type") or "Private",
        "required_skills": payload.get("required_skills") or [],
        "workforce_requirement": payload.get("workforce_requirement") or 1,
        "verification_status": payload.get("verification_status") or "Pending Verification",
        "active_jobs": 0,
        "matched_talent": 0,
        "hires": 0,
        "outcomes": "No outcomes recorded yet",
    }
    db.organisations.insert(0, record)
    return record


@router.post("/match")
def match(payload: MatchRequest):
    data = payload.dict()
    return match_candidates(data)
