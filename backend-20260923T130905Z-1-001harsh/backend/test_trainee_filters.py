import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def get_auth_token():
    login_data = json.dumps({
        "role": "admin",
        "identifier": "admin@skillpulse.in",
        "password": "admin123"
    }).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/auth/login", data=login_data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        body = json.loads(resp.read().decode("utf-8"))
        return body["token"]

def fetch_trainees(token, params=""):
    url = f"{BASE_URL}/api/trainees"
    if params:
        url += f"?{params}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def run_tests():
    print("Testing Trainee Filter APIs...")
    token = get_auth_token()
    print("[PASS] Successfully authenticated as Admin.")

    # 1. Total trainees
    res_all = fetch_trainees(token)
    print(f"[PASS] All Trainees: total = {res_all['total']}")
    assert res_all['total'] in (900, 1800, 3600), f"Expected 900, 1800 or 3600, got {res_all['total']}"

    # 2. State filter: Bihar
    res_bihar = fetch_trainees(token, "state=Bihar")
    print(f"[PASS] State=Bihar: total = {res_bihar['total']}")
    assert res_bihar['total'] in (300, 600, 1200), f"Expected 300, 600 or 1200, got {res_bihar['total']}"
    for t in res_bihar['items']:
        assert t['state'] == "Bihar", f"Candidate state is {t['state']}, expected Bihar"

    # 3. State filter: Uttar Pradesh
    res_up = fetch_trainees(token, "state=Uttar%20Pradesh")
    print(f"[PASS] State=Uttar Pradesh: total = {res_up['total']}")
    assert res_up['total'] in (300, 600, 1200), f"Expected 300, 600 or 1200, got {res_up['total']}"
    for t in res_up['items']:
        assert t['state'] == "Uttar Pradesh", f"Candidate state is {t['state']}, expected Uttar Pradesh"

    # 4. State & District filter: Bihar, Muzaffarpur
    res_muz = fetch_trainees(token, "state=Bihar&district=Muzaffarpur")
    print(f"[PASS] State=Bihar & District=Muzaffarpur: total = {res_muz['total']}")
    assert res_muz['total'] in (100, 200, 400), f"Expected 100, 200 or 400, got {res_muz['total']}"
    for t in res_muz['items']:
        assert t['state'] == "Bihar" and t['district'] == "Muzaffarpur", f"Unexpected state/district: {t['state']}, {t['district']}"

    # 5. State & District filter: Maharashtra, Pune
    res_pune = fetch_trainees(token, "state=Maharashtra&district=Pune")
    print(f"[PASS] State=Maharashtra & District=Pune: total = {res_pune['total']}")
    assert res_pune['total'] in (100, 200, 400), f"Expected 100, 200 or 400, got {res_pune['total']}"
    for t in res_pune['items']:
        assert t['state'] == "Maharashtra" and t['district'] == "Pune"

    # 6. Verification filter: Multi-Verified
    res_mv = fetch_trainees(token, "verification=Multi-Verified")
    print(f"[PASS] Verification=Multi-Verified: total = {res_mv['total']}")
    assert res_mv['total'] > 0
    for t in res_mv['items']:
        assert t['verification_status'] == "Multi-Verified", f"Got status {t['verification_status']}"

    # 7. Verification filter: Employer Verified
    res_ev = fetch_trainees(token, "verification=Employer%20Verified")
    print(f"[PASS] Verification=Employer Verified: total = {res_ev['total']}")
    assert res_ev['total'] > 0
    for t in res_ev['items']:
        assert t['verification_status'] == "Employer Verified", f"Got status {t['verification_status']}"

    # 8. Verification filter: Self Reported
    res_sr = fetch_trainees(token, "verification=Self%20Reported")
    print(f"[PASS] Verification=Self Reported: total = {res_sr['total']}")
    assert res_sr['total'] > 0
    for t in res_sr['items']:
        assert t['verification_status'] == "Self Reported", f"Got status {t['verification_status']}"

    # 9. Verification filter: Pending Verification
    res_pv = fetch_trainees(token, "verification=Pending%20Verification")
    print(f"[PASS] Verification=Pending Verification: total = {res_pv['total']}")
    assert res_pv['total'] > 0
    for t in res_pv['items']:
        assert t['verification_status'] == "Pending Verification", f"Got status {t['verification_status']}"

    # 10. Verification filter: Conflicting Information
    res_ci = fetch_trainees(token, "verification=Conflicting%20Information")
    print(f"[PASS] Verification=Conflicting Information: total = {res_ci['total']}")
    assert res_ci['total'] > 0
    for t in res_ci['items']:
        assert t['verification_status'] == "Conflicting Information", f"Got status {t['verification_status']}"

    # 11. Compound filter: State + District + Verification
    res_compound = fetch_trainees(token, "state=Bihar&district=Muzaffarpur&verification=Multi-Verified")
    print(f"[PASS] Compound State=Bihar, District=Muzaffarpur, Verification=Multi-Verified: total = {res_compound['total']}")
    assert res_compound['total'] > 0
    for t in res_compound['items']:
        assert t['state'] == "Bihar"
        assert t['district'] == "Muzaffarpur"
        assert t['verification_status'] == "Multi-Verified"

    print("\nALL 11 TEST CASES PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
