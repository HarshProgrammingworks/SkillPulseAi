from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from data_store import STATE_NAME
from gemini_service import gemini_service
from intelligence import build_grounding
from models import AiStructuredResponse, AskAiRequest

router = APIRouter(prefix="/api/ai", tags=["AI Intelligence"])

class SetKeyRequest(BaseModel):
    api_key: str

@router.get("/status")
def get_ai_status():
    return gemini_service.get_status()

@router.post("/set-key")
def set_api_key(payload: SetKeyRequest):
    gemini_service.set_api_key(payload.api_key)
    return {
        "status": "success",
        "message": "Gemini API key updated.",
        "ai_status": gemini_service.get_status()
    }

@router.post("/grounding")
def grounding(payload: AskAiRequest):
    """Structured data for the exact question, including every compared entity."""
    return build_grounding(
        question=payload.question,
        selected_district=payload.context_district,
        selected_skill=payload.context_skill,
        selected_programme=payload.context_programme,
        dashboard_metrics=payload.dashboard_metrics,
        compare_trainee_ids=payload.compare_trainee_ids,
    )

@router.post("/ask", response_model=AiStructuredResponse)
async def ask_skillpulse(payload: AskAiRequest):
    context_data = build_grounding(
        question=payload.question,
        selected_district=payload.context_district,
        selected_skill=payload.context_skill,
        selected_programme=payload.context_programme,
        dashboard_metrics=payload.dashboard_metrics,
        compare_trainee_ids=payload.compare_trainee_ids,
    )
    return await gemini_service.ask_analytics(
        question=payload.question,
        context_data=context_data,
        conversation_history=payload.conversation_history,
        tone=payload.tone or "formal"
    )

@router.get("/insights", response_model=List[Dict[str, Any]])
def get_ai_insights(district: Optional[str] = None):
    dist = district if district and district != "All Districts" else "Pune"
    
    insights = [
        {
            "id": "INS-MH-01",
            "category": "High-Demand Skill Shortage",
            "tag": "Urgent Policy Action",
            "observation": f"In {dist}, critical workforce deficits exist in EV Diagnostics and Advanced CNC Automation compared with available certified talent.",
            "supporting_data": [
                {"metric": "Industry Job Requisitions", "value": "1,850 open positions"},
                {"metric": "Certified Candidate Supply", "value": "820 trained candidates"},
                {"metric": "Net Workforce Deficit", "value": "1,030 technicians", "alert": True},
                {"metric": "Average Verified Wage", "value": "₹26,500/mo (+24% over clerical)"}
            ],
            "possible_explanation": "Rapid fleet electrification in Western Maharashtra and automotive factory automation in Chakan & Bhosari has outpaced local training batch completions.",
            "suggested_action": "Sanction 4 additional specialized EV Diagnostic labs at Government ITIs with auto OEM lab infrastructure."
        },
        {
            "id": "INS-MH-02",
            "category": "Retention Risk Pattern",
            "tag": "Early Intervention",
            "observation": "Trainees placed outside their home cluster with daily commutes exceeding 25 km exhibit a 31% higher 90-day attrition rate.",
            "supporting_data": [
                {"metric": "Inter-District Commute (Nashik-Pune)", "value": "22% of cohort"},
                {"metric": "90-Day Retention (Commuters)", "value": "63.2%"},
                {"metric": "90-Day Retention (Local Placement)", "value": "84.5%", "positive": True},
                {"metric": "Reported Factor", "value": "Transit fare & urban accommodation costs"}
            ],
            "possible_explanation": "Entry salaries of ₹18,000–₹20,000 in major urban industrial nodes create living cost pressures during the initial 90-day probationary period.",
            "suggested_action": "Provide a ₹2,000/mo 3-month transition stipend and mandate employer transit bus facilitation for industrial cluster placements."
        },
        {
            "id": "INS-MH-03",
            "category": "Curriculum-Market Mismatch",
            "tag": "Curriculum Modernization",
            "observation": "Conventional 'Domestic Data Entry Operator' exhibits oversupply (-550 net deficit) and wage stagnation at ₹15,000/mo.",
            "supporting_data": [
                {"metric": "Active Trained Supply", "value": "1,200 candidates"},
                {"metric": "Authorized Market Openings", "value": "650 positions"},
                {"metric": "Wage Stagnation Rate", "value": "68% remain under ₹16,000/mo"},
                {"metric": "Surging Alternative Demand", "value": "+42% for Cloud Support & Python Scripting"}
            ],
            "possible_explanation": "Enterprise automation and AI tools have diminished demand for manual keying, while surging demand for cloud infrastructure support and CRM management.",
            "suggested_action": "Phase out standalone data entry courses and transition batches into 'Cloud Support & Business Data Operations Assistant'."
        }
    ]
    return insights

@router.get("/explain-gap/{skill_name}", response_model=AiStructuredResponse)
async def explain_skill_gap(skill_name: str, district: Optional[str] = "Pune"):
    dist = district or "Pune"
    context_data = {
        "skill": skill_name,
        "district": dist,
        "state": STATE_NAME,
        "openings": 1850 if "EV" in skill_name else (1420 if "CNC" in skill_name else 950),
        "available_supply": 820 if "EV" in skill_name else (760 if "CNC" in skill_name else 850),
        "median_wage": "₹26,500/mo" if "EV" in skill_name else "₹22,000/mo",
        "notice": "Demonstration Prototype Data — Synthetic Dataset for SIH Evaluation"
    }
    question = f"Why is there a skill gap in {skill_name} in {dist} and what targeted policy intervention should the Maharashtra State Innovation Society implement?"
    return await gemini_service.ask_analytics(question, context_data)
