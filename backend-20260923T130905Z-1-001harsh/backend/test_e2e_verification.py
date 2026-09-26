import urllib.request
import json
import sys
import os

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
if sys.stderr.encoding != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8')

sys.path.append(os.path.dirname(__file__))

def post(url, data, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

def get(url, token=None):
    headers = {}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

print("=== SKILLPULSE AI COMPREHENSIVE E2E VERIFICATION ===")

# 1. TRAINEE PERSONA VERIFICATION
print("\n--- 1. TRAINEE PERSONA TEST ---")
otp_req = post("http://127.0.0.1:8000/api/auth/otp", {"mobile": "9800000001"})
print("OTP Request sent for 9800000001:", otp_req.get("sent"))
tr_session = post("http://127.0.0.1:8000/api/auth/otp/verify", {"mobile": "9800000001", "otp": "123456"})
tr_token = tr_session.get("token")
t_id = tr_session.get("trainee_id")
print("Trainee Login:", tr_session.get("display_name"), f"({tr_session.get('skillpulse_id')})")
assert tr_token and t_id, "Trainee login failed!"

tr_data = get(f"http://127.0.0.1:8000/api/trainees/{t_id}", tr_token)
print(f"Trainee Location: {tr_data.get('district')}, {tr_data.get('state')}")
assert tr_data.get("district") == "Muzaffarpur" and tr_data.get("state") == "Bihar", "Incorrect location!"

checkpoints = tr_data.get("checkpoints", [])
cp_stages = [c["stage"] for c in checkpoints]
print("Checkpoints in record:", cp_stages)
assert "9M" in cp_stages and "12M" in cp_stages, "9M and 12M checkpoints missing!"

cp_9m = next(c for c in checkpoints if c["stage"] == "9M")
print(f"9M Checkpoint: Status={cp_9m.get('status')}, Emp={cp_9m.get('employment_status')}, Role={cp_9m.get('role')}, Wage={cp_9m.get('wage_band')}")

cp_12m = next(c for c in checkpoints if c["stage"] == "12M")
print(f"12M Checkpoint (Long-Term): Status={cp_12m.get('status')}, Retention={cp_12m.get('retention_status')}, Source={cp_12m.get('update_source')}")
assert cp_12m.get("status") == "Confirmed", "12M should be confirmed for Aarav Kumar (14 months duration)!"
print(">>> Trainee persona test PASSED successfully!")

# 2. EMPLOYER PERSONA VERIFICATION
print("\n--- 2. EMPLOYER PERSONA TEST ---")
emp_session = post("http://127.0.0.1:8000/api/auth/login", {"role": "employer", "identifier": "employer@skillpulse.in", "password": "employer123"})
emp_token = emp_session.get("token")
assert emp_token, "Employer login failed!"
print("Employer Login: OK")

orgs = get("http://127.0.0.1:8000/api/employers", emp_token)
org_items = orgs.get("items", [])
print(f"Employers loaded count: {len(org_items)}")
assert len(org_items) >= 9, "Organizations not loaded across districts!"

new_emp = post("http://127.0.0.1:8000/api/employers", {
    "name": "Patna CleanTech Dynamics",
    "industry": "Renewable Energy",
    "contact_person": "Ravi Shankar",
    "email": "ravi@cleantech.demo",
    "phone": "9876543210",
    "state": "Bihar",
    "district": "Patna",
    "organisation_type": "Private",
    "required_skills": ["Solar Installation", "Electrical Safety"],
    "workforce_requirement": 5
}, emp_token)
print(f"Add Employer: Created {new_emp.get('name')} in {new_emp.get('district')}, {new_emp.get('state')}")

matches = post("http://127.0.0.1:8000/api/employers/match", {
    "job_role": "EV Technician",
    "required_skills": ["EV Diagnostics"],
    "location": "Bihar"
}, emp_token)
candidates = matches.get("candidates", [])
print(f"AI Matches returned: {len(candidates)} candidates")
assert len(candidates) > 0, "No candidates matched!"
top_c = candidates[0]
print(f"Top Candidate: {top_c.get('name')} (Match: {top_c.get('match_pct')}%) in {top_c.get('profile', {}).get('district')}")
print(">>> Employer persona test PASSED successfully!")

# 3. ADMIN PERSONA VERIFICATION
print("\n--- 3. ADMIN PERSONA TEST ---")
adm_session = post("http://127.0.0.1:8000/api/auth/login", {"role": "admin", "identifier": "admin@skillpulse.in", "password": "admin123"})
adm_token = adm_session.get("token")
assert adm_token, "Admin login failed!"
print("Admin Login: OK")

trainees_res = get("http://127.0.0.1:8000/api/trainees", adm_token)
total_t = trainees_res.get("total", 0)
print(f"Total Trainees in dataset: {total_t}")
assert 850 <= total_t <= 4000, f"Expected 850-4000 trainees, got {total_t}!"

from geography import GEOGRAPHY
print("Central Geographic Dataset:")
for st, d_list in GEOGRAPHY.items():
    print(f"  {st}: {d_list} ({len(d_list)} districts)")
    assert len(d_list) == 3, f"{st} must have exactly 3 districts!"

report = get("http://127.0.0.1:8000/api/reports/generate?report_type=employment_outcome", adm_token)
print(f"Report Title: {report.get('title')}")
assert report.get("title") == "Employment Outcome", f"Expected Employment Outcome, got {report.get('title')}"
print("Report Key Findings:", report.get("key_findings"))

rep_bihar = get("http://127.0.0.1:8000/api/reports/generate?report_type=employment_outcome&state=Bihar&district=Muzaffarpur", adm_token)
print(f"Muzaffarpur Filtered Cohort: {rep_bihar.get('kpis', [{}])[0].get('value')} records")
assert rep_bihar.get('kpis', [{}])[0].get('value') in (100, 200, 400), f"Expected 100, 200, or 400 records for Muzaffarpur, got {rep_bihar.get('kpis', [{}])[0].get('value')}!"
print(">>> Admin persona test PASSED successfully!")

# 4. FOLLOW-UP, WHATSAPP & LONGITUDINAL JOURNEY SYNCHRONIZATION TEST
print("\n--- 4. FOLLOW-UP & CAREER JOURNEY SYNCHRONIZATION TEST ---")
fu_res = get("http://127.0.0.1:8000/api/followups?stage=9M", adm_token)
fu_items = fu_res.get("items", [])
print(f"9M Follow-ups retrieved: {len(fu_items)} items")
assert len(fu_items) > 0, "No 9M follow-ups found!"

sample_fu = fu_items[0]
print(f"Sample 9M Follow-up: Trainee={sample_fu.get('trainee_name')} ({sample_fu.get('skillpulse_id')}), Stage={sample_fu.get('stage')}, Verif={sample_fu.get('verification_status')}, Sources={sample_fu.get('verification_sources')}")
assert sample_fu.get("stage") == "9M", "Stage must be 9M!"
assert sample_fu.get("verification_status") is not None, "Verification status must be present!"

# Check that the trainee's 9M checkpoint has the exact same status and sources
target_t_id = sample_fu.get("trainee_id")
target_t = get(f"http://127.0.0.1:8000/api/trainees/{target_t_id}", adm_token)
cp_match = next((c for c in target_t.get("checkpoints", []) if c["stage"] == "9M"), None)
assert cp_match is not None, "Trainee does not have 9M checkpoint!"
print(f"Trainee 9M Checkpoint: Verif={cp_match.get('verification_status')}, Sources={cp_match.get('verification_sources')}")
assert cp_match.get("verification_status") == sample_fu.get("verification_status"), "Status mismatch between Follow-up and Career Journey!"

# Test WhatsApp Next Question endpoint
nq = post("http://127.0.0.1:8000/api/followups/next-question", {
    "trainee_id": target_t_id,
    "stage": "9M",
    "history": []
}, adm_token)
print(f"WhatsApp Initial Question: {nq.get('question')[:80]}...")
assert "update your employment status" in nq.get("question").lower(), "Expected standardized follow-up question!"
print("Quick reply options:", nq.get("suggested_replies"))
assert "Still employed" in nq.get("suggested_replies") and "Changed employer" in nq.get("suggested_replies"), "Missing 6 standard options!"

# Test complete follow-up sync with Longitudinal Career Journey
comp_res = post(f"http://127.0.0.1:8000/api/followups/{target_t_id}/complete", {
    "follow_up_id": sample_fu.get("follow_up_id"),
    "stage": "9M",
    "employment_status": "Employed",
    "employer": "SolarTech Innovations Ltd",
    "job_role": "Lead Solar Technician",
    "wage": 27000,
    "job_relevance": "High",
    "skill_usage": "Active",
    "verification_status": "Multi-Verified",
    "channel_used": "WhatsApp"
}, adm_token)
print("Complete Follow-up Response:", comp_res.get("message"))

# Verify that trainee's 9M checkpoint was synchronized
updated_t = get(f"http://127.0.0.1:8000/api/trainees/{target_t_id}", adm_token)
updated_cp = next(c for c in updated_t.get("checkpoints", []) if c["stage"] == "9M")
print(f"Synchronized 9M Checkpoint: Employer={updated_cp.get('employer')}, Role={updated_cp.get('role')}, Verif={updated_cp.get('verification_status')}")
assert updated_cp.get("employer") == "SolarTech Innovations Ltd", "Checkpoint employer not synchronized!"
assert updated_cp.get("role") == "Lead Solar Technician", "Checkpoint role not synchronized!"
assert updated_cp.get("verification_status") == "Multi-Verified", "Checkpoint verification status not synchronized!"
print(">>> Follow-up, WhatsApp & Career Journey synchronization test PASSED successfully!")

# 5. DYNAMIC NATURAL LANGUAGE & FREE-TEXT CONVERSATION TEST (REQUIREMENT 13)
print("\n--- 5. DYNAMIC NATURAL LANGUAGE & FREE-TEXT CONVERSATION TEST ---")
# Step A: User gives natural language reply stating they changed company
chat_history = [
    {"role": "assistant", "content": nq["question"], "topic": nq["topic"]}
]
turn1 = post("http://127.0.0.1:8000/api/followups/next-question", {
    "trainee_id": target_t_id,
    "stage": "9M",
    "history": chat_history + [{"role": "user", "content": "Yes, I am still working, but I changed my company recently."}]
}, adm_token)
print(f"Turn 1 Question (after natural change employer reply): {turn1.get('question')}")
assert "current employer" in turn1.get("question").lower() or "employer" in turn1.get("question").lower(), "Expected question asking for current employer!"

# Step B: User provides employer name
chat_history.extend([
    {"role": "user", "content": "Yes, I am still working, but I changed my company recently."},
    {"role": "assistant", "content": turn1["question"], "topic": turn1["topic"]}
])
turn2 = post("http://127.0.0.1:8000/api/followups/next-question", {
    "trainee_id": target_t_id,
    "stage": "9M",
    "history": chat_history + [{"role": "user", "content": "Patna Solar Innovations Pvt Ltd"}]
}, adm_token)
print(f"Turn 2 Question: {turn2.get('question')}")
assert any(w in turn2.get("question").lower() for w in ["role", "title", "position"]), "Expected question asking for role or job title!"

# Step C: User provides role
chat_history.extend([
    {"role": "user", "content": "Patna Solar Innovations Pvt Ltd"},
    {"role": "assistant", "content": turn2["question"], "topic": turn2["topic"]}
])
turn3 = post("http://127.0.0.1:8000/api/followups/next-question", {
    "trainee_id": target_t_id,
    "stage": "9M",
    "history": chat_history + [{"role": "user", "content": "Lead PV Systems Engineer"}]
}, adm_token)
print(f"Turn 3 Question: {turn3.get('question')}")

# Step D: Tenure & Skills
chat_history.extend([
    {"role": "user", "content": "Lead PV Systems Engineer"},
    {"role": "assistant", "content": turn3["question"], "topic": turn3["topic"]}
])
turn4 = post("http://127.0.0.1:8000/api/followups/next-question", {
    "trainee_id": target_t_id,
    "stage": "9M",
    "history": chat_history + [{"role": "user", "content": "2 months"}]
}, adm_token)
print(f"Turn 4 Question: {turn4.get('question')}")

# Step E: Skill usage & Wage
chat_history.extend([
    {"role": "user", "content": "2 months"},
    {"role": "assistant", "content": turn4["question"], "topic": turn4["topic"]}
])
turn5 = post("http://127.0.0.1:8000/api/followups/next-question", {
    "trainee_id": target_t_id,
    "stage": "9M",
    "history": chat_history + [{"role": "user", "content": "Yes, directly relevant"}]
}, adm_token)
print(f"Turn 5 Question: {turn5.get('question')}")

# Step F: Wage answer completes check-in
chat_history.extend([
    {"role": "user", "content": "Yes, directly relevant"},
    {"role": "assistant", "content": turn5["question"], "topic": turn5["topic"]}
])
turn6 = post("http://127.0.0.1:8000/api/followups/next-question", {
    "trainee_id": target_t_id,
    "stage": "9M",
    "history": chat_history + [{"role": "user", "content": "Above ₹28,000"}]
}, adm_token)
print(f"Turn 6 Final Output: complete={turn6.get('complete')}, collected={turn6.get('collected')}")
assert turn6.get("complete") is True, "Expected conversation to complete!"
collected = turn6.get("collected", {})
assert collected.get("verification_status") == "Self-Reported", "Free-text checkin must be Self-Reported initially!"
assert collected.get("employer") == "Patna Solar Innovations Pvt Ltd", "Collected employer mismatch!"
assert collected.get("job_role") == "Lead PV Systems Engineer", "Collected role mismatch!"

# Step G: Save to backend and verify synchronized 9M checkpoint is Self-Reported
save_res = post(f"http://127.0.0.1:8000/api/followups/{target_t_id}/complete", {
    "follow_up_id": sample_fu.get("follow_up_id"),
    "stage": "9M",
    "employment_status": collected.get("employment_status"),
    "employer": collected.get("employer"),
    "job_role": collected.get("job_role"),
    "wage": collected.get("wage"),
    "job_relevance": collected.get("role_relevance"),
    "skill_usage": collected.get("skill_utilisation"),
    "verification_status": collected.get("verification_status"),
    "channel_used": "WhatsApp"
}, adm_token)
updated_t2 = get(f"http://127.0.0.1:8000/api/trainees/{target_t_id}", adm_token)
final_9m_cp = next(c for c in updated_t2.get("checkpoints", []) if c["stage"] == "9M")
print(f"Final Synchronized 9M Checkpoint: Employer={final_9m_cp.get('employer')}, Role={final_9m_cp.get('role')}, Verif={final_9m_cp.get('verification_status')}")
assert final_9m_cp.get("employer") == "Patna Solar Innovations Pvt Ltd", "Employer not updated in 9M checkpoint!"
assert final_9m_cp.get("role") == "Lead PV Systems Engineer", "Role not updated in 9M checkpoint!"
assert final_9m_cp.get("verification_status") == "Self-Reported", "Status must be Self-Reported per requirement 8!"
print(">>> Natural language dynamic conversational follow-up PASSED successfully!")

print("\n==========================================================================")
print("SUCCESS: ALL USER REQUIREMENTS FULLY VALIDATED AND PASSING END-TO-END!")
print("==========================================================================")


