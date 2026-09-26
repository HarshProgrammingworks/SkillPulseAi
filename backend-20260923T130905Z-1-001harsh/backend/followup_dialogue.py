"""Adaptive natural-language follow-up dialogue engine for SkillPulse AI.

Supports dynamic multi-turn conversational follow-up via WhatsApp simulation:
- Trainees can click quick-reply suggestions OR type completely free-text responses.
- Natural-language intent detection classifies answers into 5 core situations:
  1. Still employed
  2. Changed employer
  3. Unemployed / looking for work
  4. Self-employed / independent practice
  5. Studying / further training
- Gracefully handles unclear or ambiguous answers with helpful clarification prompts.
- Synthesizes completed conversations into verified outcome records marked as
  'Self-Reported' (unless corroborated by institutional sources).
"""
import re
from typing import Any, Dict, List, Optional


def classify_employment_intent(text: str) -> str:
    """Classifies natural language reply into one of 5 situations, or 'unclear'."""
    raw = (text or "").strip().lower()
    lowered = f" {raw} "

    # Unclear / unsure expressions
    if any(phrase in lowered for phrase in ("not sure", "don't know", "dont know", "not really sure", "unsure", "confused", "maybe")):
        return "unclear"

    # Changed employer / changed company (check before still employed, e.g. "Yes I am working but moved to another company")
    changed_signals = (
        "changed employer", "changed company", "changed my company", "changed job", "changed my job",
        "moved to another", "another company", "new company", "new employer", "switched company",
        "switched job", "different company", "different employer", "joined another", "got another job",
        "new role in another", "transferred to", "shifted to another"
    )
    if any(sig in lowered for sig in changed_signals):
        return "changed_employer"

    # Self-employed / business / freelance
    self_emp_signals = (
        "self-employed", "self employed", "own business", "freelance", "freelancing",
        "my own shop", "my own workshop", "contractor", "independent practice", "client service",
        "started a business", "started my own", "running a shop", "consultant"
    )
    if any(sig in lowered for sig in self_emp_signals):
        return "self_employed"

    # Further training / studying / education
    training_signals = (
        "further training", "studying", "study", "another course", "enrolled", "college",
        "diploma", "degree", "higher education", "training program", "preparing for exam",
        "upskilling", "doing another course"
    )
    if any(sig in lowered for sig in training_signals):
        return "further_training"

    # Unemployed / looking for work / left job
    unemployed_signals = (
        "looking for a job", "looking for work", "not currently working", "not working",
        "unemployed", "left my job", "left previous job", "left the company", "quit",
        "resigned", "lost my job", "without work", "jobless", "searching for a job",
        "no job", "not employed", "laid off"
    )
    if any(sig in lowered for sig in unemployed_signals):
        return "unemployed"

    # Still employed / working
    still_emp_signals = (
        "still employed", "still working", "i am working", "i'm working", "working as",
        "currently working", "working with", "working at", "employed", "have a job",
        "same company", "same employer", "same role", "yes", "yeah", "yep", "haan", "haa"
    )
    if any(sig in lowered for sig in still_emp_signals):
        return "still_employed"

    # Strict "no" without context implies unemployed
    if any(f" {w} " in lowered or raw.startswith(w) for w in ("no", "nope", "nah", "nahi")):
        return "unemployed"

    return "unclear"


def get_opening_question(trainee: Dict[str, Any]) -> Dict[str, Any]:
    name = (trainee.get("name") or "there").split()[0]
    stage = trainee.get("stage") or "9M"
    stage_text = f"{stage} career" if stage else "career"
    return {
        "topic": "employment_check",
        "question": f"Hi {name}, we'd like to update your employment status for your {stage_text} follow-up.\n\nAre you currently employed?",
        "quick_replies": [
            "Still employed",
            "Changed employer",
            "Looking for a job",
            "Self-employed",
            "Further training",
            "Not currently working"
        ],
        "suggested_replies": [
            "Still employed",
            "Changed employer",
            "Looking for a job",
            "Self-employed",
            "Further training",
            "Not currently working"
        ],
        "complete": False
    }


def next_turn(history: List[Dict[str, str]], trainee: Dict[str, Any]) -> Dict[str, Any]:
    """Determines the next dialogue turn from the conversation history."""
    if not history or history[-1].get("role") != "user":
        return get_opening_question(trainee)

    name = (trainee.get("name") or "there").split()[0]
    programme = trainee.get("programme") or "training"
    district = trainee.get("district") or "your district"
    stage = trainee.get("stage") or "9M"
    job_role = trainee.get("job_role") or programme

    # Find the topic of the last assistant question
    last_assistant_topic = "employment_check"
    for item in reversed(history[:-1]):
        if item.get("role") == "assistant" and item.get("topic"):
            last_assistant_topic = item["topic"]
            break

    last_user_content = history[-1].get("content") or ""

    # 1. Opening Question: employment_check or clarify_employment
    if last_assistant_topic in ("employment_check", "clarify_employment"):
        intent = classify_employment_intent(last_user_content)
        if intent == "still_employed":
            return {
                "topic": "still_role_confirm",
                "question": f"Great to hear! Are you still working as {job_role} with {trainee.get('employer') or 'your employer'}?",
                "quick_replies": ["Yes, same role & employer", "Role changed slightly", "Promoted to senior role"],
                "suggested_replies": ["Yes, same role & employer", "Role changed slightly", "Promoted to senior role"],
                "complete": False
            }
        elif intent == "changed_employer":
            return {
                "topic": "new_employer_name",
                "question": "Thanks for the update. What is the name of your current employer?",
                "quick_replies": [f"{district} Renewable Dynamics", "National Energy Corp", "Regional Tech Solutions"],
                "suggested_replies": [f"{district} Renewable Dynamics", "National Energy Corp", "Regional Tech Solutions"],
                "complete": False
            }
        elif intent == "unemployed":
            return {
                "topic": "unemployed_when",
                "question": "Thank you for letting us know. When did your previous employment end?",
                "quick_replies": ["Within the last month", "1–3 months ago", "More than 3 months ago"],
                "suggested_replies": ["Within the last month", "1–3 months ago", "More than 3 months ago"],
                "complete": False
            }
        elif intent == "self_employed":
            return {
                "topic": "self_emp_type",
                "question": "Excellent! What type of business, freelance, or independent technical work are you doing?",
                "quick_replies": ["Technical installation & repair", "Independent service provider", "Small enterprise / workshop"],
                "suggested_replies": ["Technical installation & repair", "Independent service provider", "Small enterprise / workshop"],
                "complete": False
            }
        elif intent == "further_training":
            return {
                "topic": "training_course",
                "question": "That's great! What course, certification, or program are you currently enrolled in?",
                "quick_replies": [f"Advanced {programme}", "Polytechnic / Diploma", "Competitive exam preparation"],
                "suggested_replies": [f"Advanced {programme}", "Polytechnic / Diploma", "Competitive exam preparation"],
                "complete": False
            }
        else:
            return {
                "topic": "clarify_employment",
                "question": "No problem. Are you currently working, looking for a job, studying, or doing self-employed work?",
                "quick_replies": ["Still employed", "Changed employer", "Looking for a job", "Self-employed", "Further training"],
                "suggested_replies": ["Still employed", "Changed employer", "Looking for a job", "Self-employed", "Further training"],
                "complete": False
            }

    # 2. Branch A: Still Employed
    if last_assistant_topic == "still_role_confirm":
        return {
            "topic": "still_tenure",
            "question": "How long have you been working in this position?",
            "quick_replies": ["6 to 9 months", "9 to 12 months", "More than 12 months"],
            "suggested_replies": ["6 to 9 months", "9 to 12 months", "More than 12 months"],
            "complete": False
        }
    if last_assistant_topic == "still_tenure":
        return {
            "topic": "still_skill_util",
            "question": f"Does your current role actively use the skills you learned during your {programme} training?",
            "quick_replies": ["Yes, high daily utilization", "Moderate utilization", "Partially relevant"],
            "suggested_replies": ["Yes, high daily utilization", "Moderate utilization", "Partially relevant"],
            "complete": False
        }
    if last_assistant_topic == "still_skill_util":
        return {
            "topic": "still_wage",
            "question": "What is your approximate monthly wage bracket?",
            "quick_replies": ["Below ₹18,000", "₹18,000–₹25,000", "Above ₹25,000"],
            "suggested_replies": ["Below ₹18,000", "₹18,000–₹25,000", "Above ₹25,000"],
            "complete": False
        }
    if last_assistant_topic == "still_wage":
        return _finish_turn(history, trainee, "Employed")

    # 3. Branch B: Changed Employer
    if last_assistant_topic == "new_employer_name":
        return {
            "topic": "new_role_title",
            "question": "What is your current job role at your new company?",
            "quick_replies": [job_role, "Senior Technician", "Field Operations Specialist"],
            "suggested_replies": [job_role, "Senior Technician", "Field Operations Specialist"],
            "complete": False
        }
    if last_assistant_topic == "new_role_title":
        return {
            "topic": "new_tenure",
            "question": "How long have you been working there?",
            "quick_replies": ["Less than 1 month", "1–3 months", "3–6 months"],
            "suggested_replies": ["Less than 1 month", "1–3 months", "3–6 months"],
            "complete": False
        }
    if last_assistant_topic == "new_tenure":
        return {
            "topic": "new_skill_util",
            "question": f"Does your current role use the skills you learned during your {programme} training?",
            "quick_replies": ["Yes, directly relevant", "Partially relevant", "Different domain"],
            "suggested_replies": ["Yes, directly relevant", "Partially relevant", "Different domain"],
            "complete": False
        }
    if last_assistant_topic == "new_skill_util":
        return {
            "topic": "new_wage",
            "question": "What is your approximate monthly wage in this new role?",
            "quick_replies": ["₹18,000–₹22,000", "₹22,000–₹28,000", "Above ₹28,000"],
            "suggested_replies": ["₹18,000–₹22,000", "₹22,000–₹28,000", "Above ₹28,000"],
            "complete": False
        }
    if last_assistant_topic == "new_wage":
        return _finish_turn(history, trainee, "Employed")

    # 4. Branch C: Unemployed
    if last_assistant_topic == "unemployed_when":
        return {
            "topic": "unemployed_search",
            "question": "Are you currently actively looking for work?",
            "quick_replies": ["Yes, actively looking", "Preparing for exams", "Not looking right now"],
            "suggested_replies": ["Yes, actively looking", "Preparing for exams", "Not looking right now"],
            "complete": False
        }
    if last_assistant_topic == "unemployed_search":
        return {
            "topic": "unemployed_target",
            "question": f"What type of job are you looking for?",
            "quick_replies": [f"{programme} roles in {district}", "Any technical job", "Open to relocation"],
            "suggested_replies": [f"{programme} roles in {district}", "Any technical job", "Open to relocation"],
            "complete": False
        }
    if last_assistant_topic == "unemployed_target":
        return {
            "topic": "unemployed_training",
            "question": "Do you need additional training or placement support from SkillPulse AI?",
            "quick_replies": ["Yes, need placement assistance", "Yes, upskilling courses", "No, applying directly"],
            "suggested_replies": ["Yes, need placement assistance", "Yes, upskilling courses", "No, applying directly"],
            "complete": False
        }
    if last_assistant_topic == "unemployed_training":
        return _finish_turn(history, trainee, "Unemployed")

    # 5. Branch D: Self-Employed
    if last_assistant_topic == "self_emp_type":
        return {
            "topic": "self_emp_location",
            "question": "Where are you currently operating your work or business?",
            "quick_replies": [f"Within {district}", "Multi-district client visits", "Home workshop"],
            "suggested_replies": [f"Within {district}", "Multi-district client visits", "Home workshop"],
            "complete": False
        }
    if last_assistant_topic == "self_emp_location":
        return {
            "topic": "self_emp_skill_util",
            "question": f"Are the skills from your {programme} training being used in your business?",
            "quick_replies": ["Yes, core technical foundation", "Partially utilized", "New unrelated field"],
            "suggested_replies": ["Yes, core technical foundation", "Partially utilized", "New unrelated field"],
            "complete": False
        }
    if last_assistant_topic == "self_emp_skill_util":
        return {
            "topic": "self_emp_earnings",
            "question": "What is your approximate monthly net income from your work?",
            "quick_replies": ["Below ₹18,000", "₹18,000–₹25,000", "Above ₹25,000"],
            "suggested_replies": ["Below ₹18,000", "₹18,000–₹25,000", "Above ₹25,000"],
            "complete": False
        }
    if last_assistant_topic == "self_emp_earnings":
        return _finish_turn(history, trainee, "Self-Employed")

    # 6. Branch E: Further Training
    if last_assistant_topic == "training_course":
        return {
            "topic": "training_institution",
            "question": "Which institution or training centre are you attending?",
            "quick_replies": [f"Government ITI in {district}", "National Skill Development Partner", "Online Institute"],
            "suggested_replies": [f"Government ITI in {district}", "National Skill Development Partner", "Online Institute"],
            "complete": False
        }
    if last_assistant_topic == "training_institution":
        return {
            "topic": "training_completion",
            "question": "When is your expected completion date?",
            "quick_replies": ["Within 3 months", "In 3–6 months", "Next year"],
            "suggested_replies": ["Within 3 months", "In 3–6 months", "Next year"],
            "complete": False
        }
    if last_assistant_topic == "training_completion":
        return {
            "topic": "training_skills",
            "question": "What specific skills or competencies are you developing?",
            "quick_replies": ["Advanced Automation", "Software & Diagnostics", "Supervisory Operations"],
            "suggested_replies": ["Advanced Automation", "Software & Diagnostics", "Supervisory Operations"],
            "complete": False
        }
    if last_assistant_topic == "training_skills":
        return _finish_turn(history, trainee, "Further Education")

    # Default fallback
    return _finish_turn(history, trainee, "Employed")


def _finish_turn(history: List[Dict[str, str]], trainee: Dict[str, Any], default_status: str) -> Dict[str, Any]:
    name = (trainee.get("name") or "there").split()[0]
    stage = trainee.get("stage") or "9M"
    collected = _collected(history, trainee, default_status)
    return {
        "topic": "done",
        "question": f"Thank you {name}! Your {stage} follow-up check-in has been logged successfully as Self-Reported and synchronized with your Longitudinal Career Journey.",
        "quick_replies": [],
        "suggested_replies": [],
        "complete": True,
        "collected": collected
    }


def _collected(history: List[Dict[str, str]], trainee: Dict[str, Any], default_status: str = "Employed") -> Dict[str, Any]:
    answers: Dict[str, str] = {}
    pending_topic = None
    for item in history:
        if item.get("role") == "assistant":
            pending_topic = item.get("topic")
        elif item.get("role") == "user" and pending_topic:
            answers[pending_topic] = item.get("content") or ""

    status = default_status
    employer = trainee.get("employer") or "Enterprise Partner"
    role = trainee.get("job_role") or trainee.get("programme") or "Technician"
    wage = trainee.get("wage") or trainee.get("current_wage") or 22000
    duration = "9 months"
    role_relevance = "Relevant"
    skill_utilisation = "High"

    # Derive employer name
    if "new_employer_name" in answers:
        employer = answers["new_employer_name"]
    # Derive role
    if "new_role_title" in answers:
        role = answers["new_role_title"]
    # Derive tenure
    if "still_tenure" in answers:
        duration = answers["still_tenure"]
    elif "new_tenure" in answers:
        duration = answers["new_tenure"]

    # Derive wage
    wage_str = answers.get("new_wage") or answers.get("still_wage") or answers.get("self_emp_earnings") or ""
    if "above" in wage_str.lower() or "28" in wage_str:
        wage = 28500
    elif "18" in wage_str or "22" in wage_str:
        wage = 22500
    elif "below" in wage_str.lower():
        wage = 16500

    if status == "Unemployed":
        employer = "Not actively employed"
        wage = 0
        role = "Seeking Opportunities"
        role_relevance = "None"
        skill_utilisation = "None"
    elif status == "Self-Employed":
        employer = "Independent Technical Practice"
        role = answers.get("self_emp_type") or "Self-Employed Specialist"

    return {
        "employment_status": status,
        "employer": employer,
        "job_role": role,
        "wage": wage,
        "duration": duration,
        "role_relevance": role_relevance,
        "skill_utilisation": skill_utilisation,
        "verification_status": "Self-Reported",
        "verification_sources": ["Trainee self-declaration (WhatsApp conversation)"],
        "channel_used": "WhatsApp",
        "answers": answers
    }
