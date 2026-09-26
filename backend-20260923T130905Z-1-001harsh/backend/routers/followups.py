from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from data_store import db
from followup_dialogue import next_turn
from gemini_service import gemini_service
from models import FollowUpStatus, FollowUpStage, CompleteFollowUpRequest, CommChannel

class NextQuestionRequest(BaseModel):
    trainee_id: str
    stage: Optional[str] = None
    history: List[Dict[str, Any]] = Field(default_factory=list)

router = APIRouter(prefix="/api/followups", tags=["Follow-ups"])

@router.get("")
def list_followups(
    status: Optional[str] = None,
    stage: Optional[str] = None,
    channel: Optional[str] = None,
    district: Optional[str] = None,
    state: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=500)
) -> Dict[str, Any]:
    matched_items = []
    search_lower = (search or "").strip().lower()
    
    for t in db.trainees:
        if state and state not in ("All States", "All", "") and (t.state or "").lower() != state.lower():
            continue
        if district and district not in ("All Districts", "All", "") and (t.district or "").lower() != district.lower():
            continue
        for fu in t.follow_ups:
            fu_status_str = fu.status.value if hasattr(fu.status, "value") else str(fu.status)
            fu_stage_str = fu.stage.value if hasattr(fu.stage, "value") else str(fu.stage)
            fu_channel_str = fu.channel.value if hasattr(fu.channel, "value") else str(fu.channel)

            if stage and stage not in ("All Stages", "All", ""):
                s_lower = stage.lower()
                fs_lower = fu_stage_str.lower()
                match = (s_lower == fs_lower or
                    (s_lower in ("9m", "9 months") and fs_lower in ("9m", "9 months")) or
                    (s_lower in ("12m", "12 months", "365 days") and fs_lower in ("12m", "12 months", "365 days")) or
                    (s_lower in ("30d", "30 days") and fs_lower in ("30d", "30 days")) or
                    (s_lower in ("90d", "90 days") and fs_lower in ("90d", "90 days")) or
                    (s_lower in ("180d", "180 days") and fs_lower in ("180d", "180 days")) or
                    (s_lower in ("270d", "270 days") and fs_lower in ("270d", "270 days")))
                if not match:
                    continue
            if channel and channel not in ("All Channels", "All", "") and fu_channel_str.lower() != channel.lower():
                continue

            if search_lower:
                candidate_text = f"{t.name} {t.id} {t.skillpulse_id or ''} {fu.employer or t.employer or ''} {fu.job_role or t.job_role or ''} {t.district} {t.programme}".lower()
                if search_lower not in candidate_text:
                    continue

            emp_status_val = fu.employment_status or (t.employment_status.value if hasattr(t.employment_status, "value") else str(t.employment_status))
            verif_status_val = fu.verification_status or (t.verification_status.value if hasattr(t.verification_status, "value") else str(t.verification_status))

            matched_items.append({
                "follow_up_id": fu.id,
                "trainee_id": t.id,
                "skillpulse_id": t.skillpulse_id or t.id,
                "trainee_name": t.name,
                "district": t.district,
                "state": t.state,
                "programme": t.programme,
                "stage": fu_stage_str,
                "due_date": fu.due_date,
                "channel": fu_channel_str,
                "status": fu_status_str,
                "completed_date": fu.completed_date,
                "employment_status": emp_status_val,
                "employer": fu.employer or t.employer or "N/A",
                "job_role": fu.job_role or t.job_role or "Associate",
                "wage": fu.wage or t.current_wage or 0,
                "verification_status": verif_status_val,
                "verification_sources": fu.verification_sources or ["Trainee confirmation", "Employer confirmation"],
                "last_updated": fu.last_updated or t.last_follow_up_date or "2026-03-12",
                "update_source": fu.update_source or "WhatsApp Follow-up (Simulated Check-in)",
                "consent_given": fu.consent_given,
                "job_satisfaction": fu.job_satisfaction,
                "job_relevance": fu.job_relevance
            })

    # Summary counts derived from the EXACT same matched set (before status filter)
    all_count = len(matched_items)
    pending_count = sum(1 for item in matched_items if item["status"].lower() == "pending")
    completed_count = sum(1 for item in matched_items if item["status"].lower() == "completed")
    overdue_count = sum(1 for item in matched_items if item["status"].lower() == "overdue")
    response_rate = round((completed_count / (pending_count + completed_count + overdue_count)) * 100, 1) if (pending_count + completed_count + overdue_count) > 0 else 0

    summary = {
        "all": all_count,
        "pending": pending_count,
        "completed": completed_count,
        "overdue": overdue_count,
        "response_rate": response_rate
    }

    # Now filter by status if specified
    if status and status.lower() not in ("all", "all statuses", ""):
        status_filtered = [item for item in matched_items if item["status"].lower() == status.lower()]
    else:
        status_filtered = matched_items

    total = len(status_filtered)
    start = (page - 1) * page_size
    end = start + page_size
    items = status_filtered[start:end]
    total_pages = max(1, (total + page_size - 1) // page_size)

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "summary": summary,
        "items": items
    }

@router.post("/next-question")
async def next_followup_question(payload: NextQuestionRequest):
    trainee = db.get_trainee_by_id(payload.trainee_id)
    if not trainee:
        raise HTTPException(status_code=404, detail="Trainee record not found")
    profile = {
        "name": trainee.name,
        "programme": trainee.programme,
        "district": trainee.district,
        "employment_status": trainee.employment_status.value,
        "job_role": trainee.job_role,
        "stage": payload.stage or "career",
    }
    turn = next_turn(payload.history, profile)
    if not turn.get("complete") and turn.get("topic") not in ("employment_check", "clarify_employment", "employment"):
        last_answer = ""
        for item in reversed(payload.history):
            if item.get("role") == "user":
                last_answer = item.get("content") or ""
                break
        phrased = await gemini_service.phrase_followup(turn["question"], last_answer, turn["topic"])
        if phrased:
            turn["question"] = phrased
            turn["phrased_by"] = "gemini"
        else:
            turn["phrased_by"] = "adaptive_rules"
    else:
        turn["phrased_by"] = "adaptive_rules"
    turn["suggested_replies"] = turn.get("quick_replies", [])
    return turn

@router.post("/{trainee_id}/complete")
def complete_follow_up_endpoint(trainee_id: str, payload: CompleteFollowUpRequest):
    updated = db.complete_follow_up(
        trainee_id=trainee_id,
        follow_up_id=payload.follow_up_id,
        data=payload.dict()
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Trainee or follow-up record not found")
    return {
        "status": "success",
        "message": "Follow-up record successfully captured and added to longitudinal career ledger.",
        "trainee": updated
    }
