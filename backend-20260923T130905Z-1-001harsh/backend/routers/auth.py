from fastapi import APIRouter, HTTPException, Request
from models import LoginRequest
from auth_service import get_session, login, logout

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/otp")
def send_otp(payload: dict):
    from auth_service import request_otp
    result = request_otp(payload.get("mobile") or "")
    if not result:
        raise HTTPException(status_code=400, detail="Enter a 10-digit mobile number.")
    return result


@router.post("/otp/verify")
def verify(payload: dict):
    from auth_service import verify_otp
    result = verify_otp(payload.get("mobile") or "", payload.get("otp") or "")
    if not result.get("ok"):
        raise HTTPException(status_code=401, detail="That OTP does not match the simulated code.")
    return result


@router.post("/register")
def register(payload: dict):
    from auth_service import register_trainee_account
    result = register_trainee_account(payload)
    if not result:
        raise HTTPException(status_code=400, detail="This mobile number is already registered.")
    return result


@router.post("/login")
def sign_in(payload: LoginRequest):
    session = login(payload.role, payload.identifier, payload.password)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid role, identifier, or password.")
    return session


@router.get("/me")
def me(request: Request):
    return getattr(request.state, "user", {})


@router.post("/logout")
def sign_out(request: Request):
    auth = request.headers.get("authorization") or ""
    token = auth[7:].strip() if auth.lower().startswith("bearer ") else ""
    logout(token)
    return {"status": "signed_out"}
