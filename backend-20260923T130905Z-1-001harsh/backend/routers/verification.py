from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any, List
from data_store import db
from models import VerificationStatus, UpdateVerificationRequest

router = APIRouter(prefix="/api/verification", tags=["Verification"])

@router.get("/summary")
def get_verification_summary() -> Dict[str, Any]:
    counts = {
        VerificationStatus.MULTI_VERIFIED.value: 0,
        VerificationStatus.EMPLOYER_VERIFIED.value: 0,
        VerificationStatus.SELF_REPORTED.value: 0,
        VerificationStatus.PENDING_VERIFICATION.value: 0,
        VerificationStatus.CONFLICTING_INFORMATION.value: 0,
        VerificationStatus.INSUFFICIENT_EVIDENCE.value: 0
    }
    
    for t in db.trainees:
        v = t.verification_status.value
        if v in counts:
            counts[v] += 1
            
    total = sum(counts.values())
    verified_total = counts[VerificationStatus.MULTI_VERIFIED.value] + counts[VerificationStatus.EMPLOYER_VERIFIED.value]
    
    return {
        "total_records": total,
        "verified_rate": round((verified_total / total) * 100, 1) if total > 0 else 0,
        "counts": counts,
        "conflict_count": counts[VerificationStatus.CONFLICTING_INFORMATION.value],
        "pending_count": counts[VerificationStatus.PENDING_VERIFICATION.value]
    }

@router.get("/conflicts")
def get_conflicts() -> List[Dict[str, Any]]:
    conflicts = []
    for t in db.trainees:
        if t.verification_status == VerificationStatus.CONFLICTING_INFORMATION:
            conflicts.append({
                "trainee_id": t.id,
                "trainee_name": t.name,
                "district": t.district,
                "programme": t.programme,
                "reported_employer": t.employer,
                "reported_wage": t.current_wage,
                "verifications": t.verifications,
                "conflict_reason": "Trainee reported active employment but Employer verification reported contract termination / non-attendance."
            })
    return conflicts

@router.post("/{trainee_id}/status")
def update_status(trainee_id: str, payload: UpdateVerificationRequest):
    updated = db.update_trainee_verification(
        trainee_id=trainee_id,
        new_status=payload.verification_status,
        notes=payload.notes,
        verified_by=payload.verified_by
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Trainee not found")
    return {
        "status": "success",
        "message": f"Verification status updated to {payload.verification_status.value}",
        "trainee_id": trainee_id,
        "new_status": payload.verification_status.value
    }
