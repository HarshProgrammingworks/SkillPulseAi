import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from fastapi import Request
from fastapi.responses import JSONResponse
from routers.trainees import router as trainees_router
from routers.analytics import router as analytics_router
from routers.verification import router as verification_router
from routers.followups import router as followups_router
from routers.skillmap import router as skillmap_router
from routers.ai import router as ai_router
from routers.reports import router as reports_router
from routers.auth import router as auth_router
from routers.employers import router as employers_router
from routers.platform import router as platform_router
from auth_service import get_session, is_allowed

app = FastAPI(
    title="SkillPulse AI Backend API",
    description="Employment Outcome, Skill Gap & Workforce Intelligence Platform API (SIH 26135)",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://harshprogrammingworks.github.io",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.github\.io",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    traceback.print_exc()
    from fastapi.responses import JSONResponse
    origin = request.headers.get("origin") or "*"
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

def _cors_headers(request: Request):
    origin = request.headers.get("origin") or "*"
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
    }

@app.middleware("http")
async def enforce_role_access(request: Request, call_next):
    path = request.url.path
    if request.method == "OPTIONS" or path in ("/", "/api/health", "/openapi.json", "/docs", "/redoc") or path.startswith("/docs"):
        return await call_next(request)
    if path in ("/api/auth/login", "/api/auth/otp", "/api/auth/otp/verify", "/api/auth/register", "/api/geography"):
        return await call_next(request)
    header = request.headers.get("authorization") or ""
    token = header[7:].strip() if header.lower().startswith("bearer ") else ""
    session = get_session(token)
    if not session:
        return JSONResponse(status_code=401, content={"detail": "Authentication required."}, headers=_cors_headers(request))
    if not is_allowed(session["role"], request.method, path, session):
        return JSONResponse(status_code=403, content={"detail": "This role cannot access that resource."}, headers=_cors_headers(request))
    request.state.user = session
    return await call_next(request)

# Include Routers
app.include_router(auth_router)
app.include_router(employers_router)
app.include_router(platform_router)
app.include_router(trainees_router)
app.include_router(analytics_router)
app.include_router(verification_router)
app.include_router(followups_router)
app.include_router(skillmap_router)
app.include_router(ai_router)
app.include_router(reports_router)

@app.get("/")
def root():
    return {
        "system": "SkillPulse AI - Workforce Intelligence Engine",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs",
        "jurisdiction": "State Innovation Society / Department of Skills, Employment & Entrepreneurship"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "ai_engine": "Gemini 2.5 Flash / Demo Dual-Mode",
        "database": "In-Memory Longitudinal SQLite / Vector Store",
        "active_records": 260
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
