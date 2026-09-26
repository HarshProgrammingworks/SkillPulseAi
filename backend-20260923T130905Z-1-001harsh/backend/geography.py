"""Single geographic catalogue for SkillPulse AI.

Three states, three districts each. Frontend `src/data/geography.ts` must match.
"""

GEOGRAPHY = {
    "Bihar": ["Muzaffarpur", "Patna", "Gaya"],
    "Uttar Pradesh": ["Lucknow", "Varanasi", "Prayagraj"],
    "Maharashtra": ["Pune", "Nashik", "Nagpur"],
}

STATE_CODES = {"Maharashtra": "MH", "Bihar": "BR", "Uttar Pradesh": "UP"}


def normalize_place(state: str, district: str):
    """Move unsupported locations onto one of the nine supported districts."""
    state = state if state in GEOGRAPHY else "Maharashtra"
    allowed = GEOGRAPHY[state]
    if district in allowed:
        return state, district
    key = sum(ord(ch) for ch in (district or state or "x"))
    return state, allowed[key % len(allowed)]


def districts_for(state: str):
    if not state or state in ("All States", "All", ""):
        return []
    return list(GEOGRAPHY.get(state, []))
