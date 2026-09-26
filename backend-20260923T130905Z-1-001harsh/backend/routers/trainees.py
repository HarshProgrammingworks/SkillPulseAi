from fastapi import APIRouter, HTTPException, Query, Request
from typing import Optional, Dict, Any
from data_store import db
from intelligence import redact_trainee
from models import CreateTraineeRequest, Trainee, UpdateOutcomeRequest, UpdateVerificationRequest

router = APIRouter(prefix="/api/trainees", tags=["Trainees"])

@router.post("", response_model=Trainee)
def create_trainee(payload: CreateTraineeRequest):
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Name is required.")
    if payload.age < 16 or payload.age > 70:
        raise HTTPException(status_code=400, detail="Age must be between 16 and 70.")
    if not payload.education.strip() or not payload.programme.strip():
        raise HTTPException(status_code=400, detail="Education and training programme are required.")
    if not payload.enrollment_date.strip():
        raise HTTPException(status_code=400, detail="Enrollment date is required.")
    try:
        return db.add_trainee(payload.dict())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.get("", response_model=Dict[str, Any])
def list_trainees(
    request: Request,
    district: Optional[str] = None,
    state: Optional[str] = None,
    programme: Optional[str] = None,
    skill: Optional[str] = None,
    status: Optional[str] = None,
    verification: Optional[str] = None,
    batch: Optional[str] = None,
    risk: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100)
):
    all_matched = db.get_trainees(
        district=district,
        state=state,
        programme=programme,
        skill=skill,
        status=status,
        verification=verification,
        batch=batch,
        risk=risk,
        search=search
    )
    
    total = len(all_matched)
    start = (page - 1) * page_size
    end = start + page_size
    items = all_matched[start:end]
    role = getattr(request.state, "user", {}).get("role", "admin")
    if role == "employer":
        items = [redact_trainee(item, "employer") for item in items]

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total > 0 else 1,
        "items": items
    }

@router.get("/export")
def export_trainees(
    district: Optional[str] = None,
    programme: Optional[str] = None,
    status: Optional[str] = None
):
    trainees = db.get_trainees(district=district, programme=programme, status=status)
    export_data = []
    for t in trainees:
        export_data.append({
            "Trainee ID": t.id,
            "Name": t.name,
            "District": t.district,
            "Gender": t.gender,
            "Programme": t.programme,
            "Certification Score": f"{t.certification_score}%",
            "Employment Status": t.employment_status.value,
            "Employer": t.employer or "N/A",
            "Role": t.job_role or "N/A",
            "Current Wage": t.current_wage or 0,
            "Retention Status": t.retention_status.value,
            "Verification Status": t.verification_status.value,
            "Last Follow-Up": t.last_follow_up_date or "Pending"
        })
    return {"count": len(export_data), "data": export_data}

@router.get("/{trainee_id}")
def get_trainee(trainee_id: str, request: Request):
    trainee = db.get_trainee_by_id(trainee_id)
    if not trainee:
        raise HTTPException(status_code=404, detail="Trainee record not found")
    role = getattr(request.state, "user", {}).get("role", "admin")
    if role == "employer":
        return redact_trainee(trainee, "employer")
    return trainee

@router.post("/{trainee_id}/update-outcome", response_model=Trainee)
def update_outcome(trainee_id: str, payload: UpdateOutcomeRequest):
    data = payload.dict(exclude_unset=True)
    updated = db.update_trainee_outcome(trainee_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Trainee record not found")
    return updated

@router.post("/{trainee_id}/update-verification", response_model=Trainee)
def update_verification(trainee_id: str, payload: UpdateVerificationRequest):
    updated = db.update_trainee_verification(
        trainee_id,
        new_status=payload.verification_status,
        notes=payload.notes,
        verified_by=payload.verified_by
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Trainee record not found")
    return updated
