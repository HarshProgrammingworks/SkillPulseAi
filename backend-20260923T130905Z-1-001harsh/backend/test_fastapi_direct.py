import sys
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_backend_suite():
    print("=== RUNNING FASTAPI DIRECT IN-PROCESS TEST SUITE ===")

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print(f"[PASS] /api/health: {res.json()['status']}")

    # 2. Authentication Login (Admin)
    login_res = client.post("/api/auth/login", json={
        "role": "admin",
        "identifier": "admin@skillpulse.in",
        "password": "admin123"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] /api/auth/login: Authenticated successfully")

    # 3. Trainees API & State Differentiations
    all_trainees = client.get("/api/trainees", headers=headers).json()
    print(f"[PASS] All Trainees count: {all_trainees['total']}")
    assert all_trainees['total'] > 0
    # Check email field presence
    sample = all_trainees['items'][0]
    assert "email" in sample and "@skillpulse.in" in sample["email"], f"Missing or invalid email: {sample.get('email')}"
    print(f"[PASS] Trainee email field confirmed: {sample['name']} -> {sample['email']}")

    # State filters
    bihar = client.get("/api/trainees?state=Bihar", headers=headers).json()
    up = client.get("/api/trainees?state=Uttar%20Pradesh", headers=headers).json()
    mh = client.get("/api/trainees?state=Maharashtra", headers=headers).json()
    assert bihar['total'] > 0 and up['total'] > 0 and mh['total'] > 0
    print(f"[PASS] Multi-state filters: Bihar={bihar['total']}, UP={up['total']}, MH={mh['total']}")

    # Check wage differentiation
    bihar_wages = [t['current_wage'] for t in bihar['items'] if t.get('current_wage')]
    up_wages = [t['current_wage'] for t in up['items'] if t.get('current_wage')]
    mh_wages = [t['current_wage'] for t in mh['items'] if t.get('current_wage')]
    avg_bihar = sum(bihar_wages) / len(bihar_wages)
    avg_up = sum(up_wages) / len(up_wages)
    avg_mh = sum(mh_wages) / len(mh_wages)
    print(f"[PASS] Authentic Wage Tiers: Bihar=₹{avg_bihar:.0f}, UP=₹{avg_up:.0f}, MH=₹{avg_mh:.0f}")
    assert avg_bihar < avg_up < avg_mh, "Expected progressive wages: Bihar < UP < Maharashtra"

    # 4. Trainee Update Outcome with Email & Phone
    update_res = client.post(f"/api/trainees/{sample['id']}/update-outcome", headers=headers, json={
        "employment_status": "Employed",
        "job_role": "Lead Solar Diagnostics Tech",
        "employer": "Renewable Tech Corp",
        "current_wage": 27500,
        "email": "updated.specialist@skillpulse.in",
        "phone": "9811122233"
    })
    assert update_res.status_code == 200, f"Outcome update failed: {update_res.text}"
    updated = update_res.json()
    assert updated["email"] == "updated.specialist@skillpulse.in"
    assert updated["phone"] == "9811122233"
    print(f"[PASS] Trainee Outcome update preserved email & phone: {updated['email']}")

    # 5. Follow-ups Multi-State & Multi-Channel
    followups_all = client.get("/api/followups?page_size=100", headers=headers).json()
    channels = set(f.get("channel") for f in followups_all.get("items", []))
    print(f"[PASS] Follow-up channels active: {channels}")
    assert len(channels) >= 3, f"Expected multiple channels, got {channels}"

    fu_bihar = client.get("/api/followups?state=Bihar", headers=headers).json()
    fu_up = client.get("/api/followups?state=Uttar%20Pradesh", headers=headers).json()
    fu_mh = client.get("/api/followups?state=Maharashtra", headers=headers).json()
    print(f"[PASS] Follow-ups per state: Bihar={fu_bihar['total']}, UP={fu_up['total']}, MH={fu_mh['total']}")
    assert fu_bihar['total'] > 0 and fu_up['total'] > 0 and fu_mh['total'] > 0

    # 6. Reports API with Employment Filter
    rep_employed = client.get("/api/reports/generate?state=Bihar&employment=Employed", headers=headers).json()
    assert "kpis" in rep_employed and "sample_cohort" in rep_employed
    print(f"[PASS] /api/reports/generate with employment=Employed: {len(rep_employed['sample_cohort'])} cohort samples, KPIs={len(rep_employed['kpis'])}")

    # 7. Data Quality API
    quality = client.get("/api/quality?state=Bihar", headers=headers).json()
    assert "completeness_rate" in quality and "consistency_rate" in quality
    print(f"[PASS] /api/quality: Completeness={quality['completeness_rate']}%, Consistency={quality['consistency_rate']}%")

    # 8. Employer Desk Pipeline & Outcomes
    overview = client.get("/api/employers/overview", headers=headers).json()
    assert "pipeline" in overview
    print(f"[PASS] /api/employers/overview: {len(overview['pipeline'])} pipeline stages active")

    outcome_rec = client.post("/api/employers/outcomes", headers=headers, json={
        "trainee_id": sample['id'],
        "checkpoint": "6M",
        "still_employed": "Yes",
        "role_relevant": "Highly Relevant",
        "skill_utilisation": "Active",
        "feedback": "Outstanding candidate retention verified."
    })
    assert outcome_rec.status_code == 200
    print(f"[PASS] /api/employers/outcomes recorded: {outcome_rec.json()['id']}")

    print("\n>>> ALL BACKEND API REQUIREMENTS VERIFIED SUCCESSFULLY (100% PASS) <<<")

if __name__ == "__main__":
    test_backend_suite()
