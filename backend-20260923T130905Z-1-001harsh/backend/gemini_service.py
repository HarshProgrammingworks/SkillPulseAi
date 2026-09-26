import os
import re
import sys
import json
import httpx
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv
from fastapi import HTTPException
from models import AiStructuredResponse

load_dotenv()

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

# Active Gemini Flash models supported on Google AI Studio
GEMINI_MODELS = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-flash-latest", "gemini-2.5-flash"]

class GeminiService:
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.active_model = "gemini-1.5-flash"
        self._update_mode()

    def _update_mode(self):
        self.mode = "SkillPulse AI" if self.api_key else "SkillPulse AI"

    def set_api_key(self, key: str):
        self.api_key = key.strip()
        self._update_mode()

    def get_status(self) -> Dict[str, Any]:
        return {
            "mode": self.mode,
            "has_key": bool(self.api_key),
            "key_masked": f"AIza...{self.api_key[-4:]}" if len(self.api_key) > 8 else ("Configured" if self.api_key else "Not Configured"),
            "model": self.active_model
        }

    async def ask_analytics(
        self,
        question: str,
        context_data: Dict[str, Any],
        conversation_history: Optional[List[Dict[str, str]]] = None,
        tone: str = "formal"
    ) -> AiStructuredResponse:
        """
        Sends the actual user question, grounded dataset context, and structured
        conversation history directly to the official Google Gemini API.
        No hardcoded canned responses or keyword-based fake answers.
        """
        # 1. Verify API Key is provided
        if not self.api_key:
            raise HTTPException(
                status_code=400,
                detail="Gemini API key is not configured. Please set GEMINI_API_KEY in backend/.env or enter your key in the Settings tab."
            )

        selected_tone = "friendly" if str(tone).strip().lower() == "friendly" else "formal"
        if selected_tone == "friendly":
            tone_directive = (
                "TONE SPECIFICATION: FRIENDLY (Approachable & Conversational)\n"
                "- Write in a warm, conversational, approachable, and encouraging tone.\n"
                "- Use clear, natural, and accessible language rather than dense bureaucratic jargon.\n"
                "- Include a small number of tasteful, relevant emojis (e.g. 📊, 💡, 🎯, 🚀) where helpful to make insights engaging.\n"
                "- Maintain analytical accuracy, respectful demeanor, and actionable utility.\n"
            )
        else:
            tone_directive = (
                "TONE SPECIFICATION: FORMAL (Professional & Structured)\n"
                "- Write in an objective, precise, structured, and formal policy/analytical tone.\n"
                "- Maintain professional standards suitable for ministry and state leadership.\n"
                "- Avoid unnecessary emojis, colloquialisms, or casual wording.\n"
            )

        # 2. Prepare System Instructions
        system_instruction = (
            "You are the Lead Workforce Intelligence AI for SkillPulse AI, operating on behalf of the "
            "Maharashtra State Innovation Society and Department of Skills, Employment & Entrepreneurship.\n\n"
            f"{tone_directive}\n"
            "PRIMARY OBJECTIVES:\n"
            "1. DIRECTLY ANSWER THE SPECIFIC QUESTION: Address the exact topic requested by the user. "
            "Supported places are Bihar (Muzaffarpur, Patna, Gaya), Uttar Pradesh (Lucknow, Varanasi, Prayagraj), and Maharashtra (Pune, Nashik, Nagpur). "
            "If asked to compare districts, compare only those supported districts using the supplied figures. "
            "If asked why retention is low or about attrition, evaluate specific root causes like entry wages under ₹18k, commute distances >25km, or skill mismatches. "
            "If asked about training recommendations, provide concrete interventions based on the top skill gaps.\n"
            "2. GROUNDED IN SKILLPULSE DATASET: Use the quantitative evidence and facts provided in the context. "
            "Always state observations as 'Based on the current SkillPulse Maharashtra prototype dataset...' and do not claim to be official census data.\n"
            "3. BE DISTINCT & PRECISE: Never repeat a generic canned template. Every response must be uniquely tailored to the question.\n"
            "4. COMPARISONS: If the context says comparison_required is true, you MUST analyze every district and every trainee listed in comparison_targets. "
            "Do not answer using only one entity or only the selected filter district. "
            "For each entity include metrics, strengths, skill gaps, and employment situation when those fields exist. "
            "Then give key differences, possible reasons that are supported by the supplied data, and implications. "
            "If a metric is absent, write exactly that the data is unavailable. Never invent numbers.\n"
            "5. RESPONSE SCHEMA: You MUST return strictly a valid JSON object matching this schema:\n"
            "{\n"
            '  "insight": "Concise, direct answer to the user question (1-2 sentences)",\n'
            '  "evidence": ["Data point 1 with specific metrics", "Data point 2", "Data point 3"],\n'
            '  "explanation": "Interpretation. For comparisons, include a headed block for each entity and then Comparison.",\n'
            '  "recommendation": "Concrete next step grounded in the supplied data",\n'
            '  "limitations": "Prototype dataset notice",\n'
            '  "comparison": {"entities": [{"name": "", "metrics": "", "strengths": "", "skill_gaps": "", "employment": ""}], "differences": "", "reasons": "", "implications": ""}\n'
            "}\n"
            "Include comparison only when the question compares two or more entities. Otherwise set comparison to null."
        )
        if context_data.get("comparison_required"):
            targets = context_data.get("comparison_targets") or {}
            system_instruction += (
                "\n\nTHIS QUESTION IS A COMPARISON. Required districts: "
                f"{targets.get('districts')}. Required trainees: {targets.get('trainees')}. "
                "The response is invalid if any listed entity is missing."
            )

        # 3. Build structured contents array with alternating roles
        contents: List[Dict[str, Any]] = []

        if conversation_history:
            last_role = None
            for turn in conversation_history[-8:]:
                raw_role = turn.get("role", "")
                role = "user" if raw_role in ["user", "human"] else "model"
                text = (turn.get("content") or "").strip()
                if not text:
                    continue

                if role == last_role:
                    # Merge consecutive turns with the same role to maintain strict alternation
                    contents[-1]["parts"][0]["text"] += f"\n\n{text}"
                else:
                    contents.append({
                        "role": role,
                        "parts": [{"text": text}]
                    })
                    last_role = role

            # Multiturn must start with user turn
            if contents and contents[0]["role"] != "user":
                contents.pop(0)

        # Build current user prompt with actual question + dynamic dataset context
        current_user_text = (
            f"User Question: {question}\n\n"
            f"SkillPulse Maharashtra Ground-Truth Dataset Context:\n"
            f"{json.dumps(context_data, indent=2)}\n\n"
            f"Provide your structured workforce analysis answering the above question in the required JSON format."
        )

        if contents and contents[-1]["role"] == "user":
            # Add a brief model ack before the new user question to preserve alternation
            contents.append({
                "role": "model",
                "parts": [{"text": "Understood. I will evaluate the SkillPulse Maharashtra dataset context and provide direct structured intelligence."}]
            })

        contents.append({
            "role": "user",
            "parts": [{"text": current_user_text}]
        })

        # 4. Debug Logging (safe: does not log API keys or secrets)
        print("\n" + "=" * 60)
        print(f"[DEBUG] USER QUESTION:\n{question}")
        print("-" * 60)

        last_error_detail = "Failed to communicate with Gemini API"

        # 5. Send request to Gemini API (trying gemini-2.5-flash with fallbacks)
        for model in GEMINI_MODELS:
            endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
            payload = {
                "systemInstruction": {
                    "parts": [{"text": system_instruction}]
                },
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.2,
                    "topP": 0.95,
                    "responseMimeType": "application/json"
                }
            }

            # Safe sanitized payload for debug logging
            sanitized_payload = {
                "model": model,
                "turns_count": len(contents),
                "latest_user_prompt_snippet": current_user_text[:200] + "...",
                "generationConfig": payload["generationConfig"]
            }
            print(f"[DEBUG] REQUEST SENT TO GEMINI (Model: {model}):\n{json.dumps(sanitized_payload, indent=2)}")

            try:
                async with httpx.AsyncClient(timeout=25.0) as client:
                    res = await client.post(endpoint, json=payload)

                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if not candidates:
                            print(f"[DEBUG] Empty candidates from Gemini ({model})")
                            last_error_detail = "Gemini returned an empty response with no candidates."
                            continue

                        first_candidate = candidates[0]
                        finish_reason = first_candidate.get("finishReason", "")
                        parts = first_candidate.get("content", {}).get("parts", [])
                        if not parts or "text" not in parts[0]:
                            print(f"[DEBUG] No text in candidate parts. Finish reason: {finish_reason}")
                            last_error_detail = f"Gemini response contained no text (finishReason: {finish_reason})."
                            continue

                        raw_text = parts[0]["text"].strip()
                        print("-" * 60)
                        print(f"[DEBUG] RESPONSE RECEIVED (Model: {model}):\n{raw_text}")
                        print("=" * 60 + "\n")

                        # Clean potential markdown wrappers
                        cleaned_text = raw_text
                        if cleaned_text.startswith("```json"):
                            cleaned_text = cleaned_text[7:]
                        elif cleaned_text.startswith("```"):
                            cleaned_text = cleaned_text[3:]
                        if cleaned_text.endswith("```"):
                            cleaned_text = cleaned_text[:-3]
                        cleaned_text = cleaned_text.strip()

                        # Parse JSON
                        try:
                            parsed = json.loads(cleaned_text)
                        except json.JSONDecodeError:
                            # Try regex match for outermost JSON object
                            json_match = re.search(r"\{.*\}", cleaned_text, re.DOTALL)
                            if json_match:
                                parsed = json.loads(json_match.group(0))
                            else:
                                raise ValueError("Could not parse JSON from Gemini response")

                        self.active_model = model
                        evidence = parsed.get("evidence") or []
                        if isinstance(evidence, str):
                            evidence = [evidence]
                        return AiStructuredResponse(
                            insight=parsed.get("insight") or "Evaluation completed for the requested inquiry.",
                            evidence=evidence,
                            explanation=parsed.get("explanation") or "",
                            recommendation=parsed.get("recommendation") or "",
                            limitations=parsed.get("limitations") or "Based on the SkillPulse Maharashtra prototype dataset. Not official government statistics.",
                            source_mode=f"Live Gemini AI ({model})",
                            comparison=parsed.get("comparison") if isinstance(parsed.get("comparison"), dict) else None
                        )

                    elif res.status_code in [400, 403]:
                        err_body = res.text
                        print(f"[DEBUG] Gemini API Error {res.status_code} on {model}: {err_body}")
                        if "API_KEY_INVALID" in err_body or "not valid" in err_body.lower() or res.status_code == 403:
                            raise HTTPException(
                                status_code=403,
                                detail="Invalid Gemini API key. Please check your GEMINI_API_KEY in backend/.env or Settings."
                            )
                        # Other 400 error (e.g. model unsupported)
                        last_error_detail = f"Gemini API returned HTTP {res.status_code}: {err_body[:200]}"
                        continue

                    elif res.status_code == 429:
                        print(f"[DEBUG] Gemini API Rate Limit (429) on {model}")
                        last_error_detail = "Gemini API rate limit reached (HTTP 429). Please wait a moment and try again."
                        continue

                    else:
                        err_body = res.text
                        print(f"[DEBUG] Gemini API returned HTTP {res.status_code} on {model}: {err_body}")
                        last_error_detail = f"Gemini API error (HTTP {res.status_code})."
                        continue

            except httpx.TimeoutException:
                print(f"[DEBUG] Gemini API timeout on {model} (25s)")
                last_error_detail = f"Gemini API request timed out on {model}."
                continue
            except HTTPException:
                raise
            except Exception as e:
                print(f"[DEBUG] Gemini invocation error on {model}: {e}")
                last_error_detail = f"Network or execution error: {str(e)}"
                continue

        # If all candidate models failed, raise a clear HTTP error explaining why
        print("=" * 60 + "\n")
        raise HTTPException(
            status_code=503,
            detail=f"Gemini AI is currently unavailable. {last_error_detail}"
        )

    async def phrase_followup(self, draft_question: str, last_answer: str, topic: str) -> Optional[str]:
        """Rephrase one follow-up question. Returns None if Gemini is unavailable."""
        if not self.api_key:
            return None
        prompt = (
            "Rewrite the follow-up question so it responds to the trainee's last answer. "
            "Ask exactly one question. Stay on the given topic. Do not invent employment facts. "
            "Return only the question text.\n"
            f"Topic: {topic}\nLast answer: {last_answer or 'none yet'}\nDraft: {draft_question}"
        )
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.active_model}:generateContent?key={self.api_key}"
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.4, "maxOutputTokens": 180},
        }
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(endpoint, json=payload)
            if res.status_code != 200:
                return None
            parts = res.json().get("candidates", [{}])[0].get("content", {}).get("parts", [])
            text = (parts[0].get("text") if parts else "") or ""
            text = text.strip().strip('"')
            if not text or len(text) > 500:
                return None
            return text
        except Exception:
            return None


gemini_service = GeminiService()
