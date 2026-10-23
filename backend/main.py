"""
CareerIQ — FastAPI Backend (main.py)

All endpoints load data once at startup via engine.initialize().
No model retraining per request.

Start: uvicorn backend.main:app --reload --port 8000
Docs:  http://localhost:8000/docs
"""

import io
import logging
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend import engine

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("careeriq.api")

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="CareerIQ API",
    description=(
        "Market-Aware AI Career Intelligence Platform. "
        "All data is from a SYNTHETIC dataset — see /health for provenance details."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # restrict to frontend origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Load all data and build artifacts at startup — not per request."""
    try:
        engine.initialize()
        logger.info("CareerIQ engine ready.")
    except FileNotFoundError as e:
        logger.error(f"STARTUP FAILED: {e}")
        # App still starts so /health can explain the error


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------

class ResumeTextRequest(BaseModel):
    text: str = Field(..., min_length=10, description="Resume text content")
    target_role: Optional[str] = Field(None, description="Target job role")
    years_exp: float = Field(0, ge=0, le=40, description="Years of experience")


class SkillGapRequest(BaseModel):
    skills: list[str] = Field(..., description="List of user skills")
    role: str = Field(..., description="Target role name")


class RecommendRequest(BaseModel):
    skills: list[str] = Field(..., description="User skill list")
    target_role: Optional[str] = Field(None)
    years_exp: float = Field(0, ge=0, le=40)
    w_market: float = Field(0.4, ge=0.0, le=1.0, description="Market weight (0=baseline, 0.4=market-aware)")
    k: int = Field(5, ge=1, le=20, description="Number of recommendations")


class SalaryRequest(BaseModel):
    role: str
    location: str
    years_exp: float = Field(0, ge=0, le=40)
    skills: list[str] = Field(default_factory=list)


class WhatIfRequest(BaseModel):
    current_skills: list[str]
    hypothetical_skills: list[str]    # skills to simulate adding
    target_role: str
    years_exp: float = Field(0, ge=0, le=40)


# ---------------------------------------------------------------------------
# Helper: safe engine call
# ---------------------------------------------------------------------------
def _require_engine():
    """Raise 503 if engine is not loaded."""
    if engine._df is None:
        raise HTTPException(
            status_code=503,
            detail="Engine not initialised. Data files may be missing. Check server logs.",
        )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health", tags=["System"])
def health():
    """System health check and data provenance information."""
    engine_ready = engine._df is not None
    return {
        "status": "ok" if engine_ready else "degraded",
        "engine_ready": engine_ready,
        "jobs_loaded": len(engine._df) if engine._df is not None else 0,
        "skills_in_master": len(engine._sm) if engine._sm is not None else 0,
        "data_provenance": "SYNTHETIC dataset (simulated 12k Indian AI/Data job postings, 2024-2026)",
        "version": "1.0.0",
    }


@app.get("/roles", tags=["Market"])
def list_roles():
    """Return all available job roles in the dataset."""
    _require_engine()
    try:
        roles = engine.get_roles()
        return {"roles": roles, "count": len(roles)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/market/overview", tags=["Market"])
def market_overview():
    """
    Return overall market statistics:
    total jobs, top skills, jobs by role and location, salary stats.
    """
    _require_engine()
    try:
        return engine.get_market_overview()
    except Exception as e:
        logger.exception("market_overview failed")
        raise HTTPException(status_code=500, detail="Failed to compute market overview.")


@app.get("/market/trends", tags=["Market"])
def market_trends():
    """
    Return quarterly skill demand trends.
    Note: Reflects SYNTHETIC injected growth rates, not real market observations.
    """
    _require_engine()
    try:
        return engine.get_market_trends()
    except Exception as e:
        logger.exception("market_trends failed")
        raise HTTPException(status_code=500, detail="Failed to compute market trends.")


@app.get("/skills/demand", tags=["Market"])
def skill_demand(
    role: str = Query(..., description="Canonical role name, e.g. 'Machine Learning Engineer'")
):
    """Return skill demand percentages for a specific role."""
    _require_engine()
    try:
        return engine.get_skill_demand(role)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("skill_demand failed")
        raise HTTPException(status_code=500, detail="Failed to compute skill demand.")


@app.post("/resume/analyze", tags=["Resume"])
def analyze_resume_text(req: ResumeTextRequest):
    """
    Analyze resume text:
    - Extract skills using keyword matching.
    - Compute skill gap against target role (if provided).
    - Returns structured analysis.
    """
    _require_engine()
    try:
        result = engine.analyze_resume(
            text=req.text,
            target_role=req.target_role,
            years_exp=req.years_exp,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("analyze_resume failed")
        raise HTTPException(status_code=500, detail="Resume analysis failed.")


@app.post("/resume/upload", tags=["Resume"])
async def upload_resume_pdf(
    file: UploadFile = File(...),
    target_role: Optional[str] = Query(None),
    years_exp: float = Query(0, ge=0, le=40),
):
    """
    Upload a PDF resume file, extract text, then run resume analysis.
    Accepts: multipart/form-data with file field.
    """
    _require_engine()

    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=422, detail="Only PDF files are accepted.")

    try:
        content = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to read uploaded file.")

    # Extract text from PDF
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            pages_text = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages_text.append(text)
            extracted_text = "\n".join(pages_text)
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="PDF processing unavailable. Install pdfplumber: pip install pdfplumber",
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to extract text from PDF: {str(e)}")

    if not extracted_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract text from PDF. Try copying and pasting the resume text instead.",
        )

    try:
        result = engine.analyze_resume(
            text=extracted_text,
            target_role=target_role,
            years_exp=years_exp,
        )
        result["source"] = "pdf_upload"
        result["filename"] = file.filename
        result["pages"] = len(pages_text)
        result["extracted_text_preview"] = extracted_text[:500]
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("upload_resume failed")
        raise HTTPException(status_code=500, detail="Resume PDF analysis failed.")


@app.post("/skill-gap", tags=["Analysis"])
@app.post("/skills/gap", tags=["Analysis"], include_in_schema=False)
def compute_skill_gap(req: SkillGapRequest):
    """
    Compute skill gap between user skills and a target role's market requirements.
    Returns missing skills with priority scores and formula explanation.
    """
    _require_engine()
    if not req.skills:
        raise HTTPException(status_code=422, detail="Skills list cannot be empty.")
    try:
        return engine.compute_skill_gap(req.skills, req.role)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("skill_gap failed")
        raise HTTPException(status_code=500, detail="Skill gap analysis failed.")


@app.post("/recommend", tags=["Recommendation"])
def recommend_jobs(req: RecommendRequest):
    """
    Get job recommendations for a user based on their skills and experience.

    w_market=0.0  -> Model A: Baseline (pure cosine similarity)
    w_market=0.4  -> Model B: Market-Aware (similarity + demand + experience fit)

    Every recommendation includes matched/missing skills and a human-readable explanation.
    """
    _require_engine()
    if not req.skills:
        raise HTTPException(status_code=422, detail="Skills list cannot be empty.")
    try:
        return engine.recommend_jobs(
            user_skills=req.skills,
            target_role=req.target_role,
            years_exp=req.years_exp,
            w_market=req.w_market,
            k=req.k,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("recommend failed")
        raise HTTPException(status_code=500, detail="Recommendation failed.")


@app.post("/salary", tags=["Optional"])
@app.post("/salary/predict", tags=["Optional"], include_in_schema=False)
def salary_estimate(req: SalaryRequest):
    """
    Return a demonstration salary estimate.
    IMPORTANT: Trained on SYNTHETIC data — not a reliable real-world predictor.
    Uses saved model if available, otherwise falls back to dataset median.
    """
    _require_engine()
    try:
        return engine.get_salary_estimate(
            role=req.role,
            location=req.location,
            experience=req.years_exp,
            skills=req.skills,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("salary_estimate failed")
        raise HTTPException(status_code=500, detail="Salary estimation failed.")


@app.post("/what-if", tags=["Optional"])
def what_if_simulation(req: WhatIfRequest):
    """
    Simulate the effect of adding hypothetical skills on recommendation scores.
    Returns comparison: current vs. hypothetical skill set.
    IMPORTANT: This is a simulation — not a guarantee of employment outcomes.
    """
    _require_engine()
    if req.role not in engine.get_roles():
        raise HTTPException(status_code=404, detail=f"Unknown role: '{req.role}'")

    try:
        # Current recommendations
        current = engine.recommend_jobs(
            user_skills=req.current_skills,
            target_role=req.role,
            years_exp=req.years_exp,
            w_market=0.4,
            k=5,
        )

        # Hypothetical recommendations (current + new skills)
        combined_skills = list(set(req.current_skills) | set(req.hypothetical_skills))
        hypothetical = engine.recommend_jobs(
            user_skills=combined_skills,
            target_role=req.role,
            years_exp=req.years_exp,
            w_market=0.4,
            k=5,
        )

        # Score comparison
        current_top_score = (
            current["recommendations"][0]["total_score"]
            if current["recommendations"] else 0
        )
        hypo_top_score = (
            hypothetical["recommendations"][0]["total_score"]
            if hypothetical["recommendations"] else 0
        )
        score_change = round(hypo_top_score - current_top_score, 3)

        return {
            "current_skills": req.current_skills,
            "hypothetical_skills": req.hypothetical_skills,
            "combined_skills": combined_skills,
            "current_results": current,
            "hypothetical_results": hypothetical,
            "top_score_change": score_change,
            "simulation_note": (
                "This is a SIMULATION using the synthetic dataset. "
                "A positive score_change suggests that adding these skills "
                "could improve your match quality — but outcomes cannot be guaranteed."
            ),
        }
    except Exception as e:
        logger.exception("what_if failed")
        raise HTTPException(status_code=500, detail="What-if simulation failed.")
