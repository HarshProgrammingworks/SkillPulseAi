/** Shared state and district names. Keep in step with backend/geography.py. */

export const GEOGRAPHY: Record<string, string[]> = {
  Bihar: ["Muzaffarpur", "Patna", "Gaya"],
  "Uttar Pradesh": ["Lucknow", "Varanasi", "Prayagraj"],
  Maharashtra: ["Pune", "Nashik", "Nagpur"]
};

export const STATES = Object.keys(GEOGRAPHY);
export const ALL_DISTRICTS = Object.values(GEOGRAPHY).flat();

export function stateChosen(state: string) {
  return Boolean(state) && !state.startsWith("All") && state !== "Select state";
}

export function districtsFor(state: string) {
  if (!stateChosen(state)) return [];
  return GEOGRAPHY[state] || [];
}
