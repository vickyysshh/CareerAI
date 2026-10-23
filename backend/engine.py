"""
CareerIQ — Core ML/Data Engine (engine.py)

Loads the dataset and skills master once at startup, then exposes
fast in-memory functions for all backend endpoints.

Functions:
    get_market_overview()    -> aggregate statistics
    get_skill_demand(role)   -> skill demand % for a role
    get_market_trends()      -> quarterly skill trends
    extract_skills(text)     -> keyword regex extractor (no external deps)
    analyze_resume(text, role, years_exp) -> full resume analysis
    compute_skill_gap(user_skills, role)  -> gap + priority scores
    recommend_jobs(user_skills, role, years_exp, w_market, k) -> ranked jobs
    get_roles()              -> list of available roles
"""

import re
import json
import logging
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger("careeriq.engine")

# ---------------------------------------------------------------------------
# Path configuration – engine.py lives in careeriq/backend/
# ---------------------------------------------------------------------------
_BASE = Path(__file__).resolve().parent.parent          # careeriq/
_DATA = _BASE / "data"
_MODELS = _BASE / "models"
_OUTPUTS = _BASE / "outputs"

# ---------------------------------------------------------------------------
# Module-level singletons (loaded once at import time)
# ---------------------------------------------------------------------------
_df: pd.DataFrame = None          # cleaned jobs dataframe
_sm: pd.DataFrame = None          # skills master
_res_df: pd.DataFrame = None      # sample resumes (for evaluation)
_alias2skill: dict = {}           # lowercase alias -> canonical skill name
_extract_pattern = None           # compiled regex pattern
_tfidf: TfidfVectorizer = None    # fitted TF-IDF vectorizer
_J = None                         # TF-IDF job matrix
_role_demand_cache: dict = {}     # cached per-role demand Series


def _load_alias_map(skills_df: pd.DataFrame) -> dict:
    """Build alias -> canonical skill lookup from skills_master."""
    mapping = {}
    for _, row in skills_df.iterrows():
        canonical = row["skill"]
        mapping[canonical.lower()] = canonical
        aliases_raw = str(row.get("aliases", "") or "")
        for alias in filter(None, aliases_raw.split("|")):
            mapping[alias.strip().lower()] = canonical
    return mapping


def _build_regex(alias_map: dict):
    """Compile regex pattern; longer aliases processed first to avoid partial matches."""
    sorted_aliases = sorted(alias_map.keys(), key=len, reverse=True)
    escaped = [re.escape(a) for a in sorted_aliases]
    # Use word boundaries that also handle +, #, and dots (for C++, .NET etc.)
    pattern_str = r"(?<![A-Za-z0-9+#.])(" + "|".join(escaped) + r")(?![A-Za-z0-9+#])"
    return re.compile(pattern_str, re.IGNORECASE)


def _compute_salary_mid_lpa(row):
    """Convert salary columns to midpoint in LPA."""
    if pd.isna(row["salary_min"]) or pd.isna(row["salary_max"]):
        return np.nan
    return (row["salary_min"] + row["salary_max"]) / 2 / 1e5


def initialize(data_dir: Path = None):
    """
    Load and prepare all data. Called once at application startup.
    Safe to call multiple times (idempotent).
    """
    global _df, _sm, _res_df, _alias2skill, _extract_pattern
    global _tfidf, _J, _role_demand_cache

    if _df is not None:
        return  # Already initialised

    if data_dir is None:
        data_dir = _DATA

    logger.info("Initialising CareerIQ engine …")

    # ---- Load skills master ----
    sm_path = data_dir / "skills_master.csv"
    if not sm_path.exists():
        raise FileNotFoundError(f"skills_master.csv not found at {sm_path}")
    _sm = pd.read_csv(sm_path).fillna("")
    _alias2skill = _load_alias_map(_sm)
    _extract_pattern = _build_regex(_alias2skill)
    logger.info(f"Skills master loaded: {len(_sm)} skills, {len(_alias2skill)} aliases")

    # ---- Load jobs dataset ----
    jobs_path = data_dir / "jobs_dataset.csv"
    if not jobs_path.exists():
        raise FileNotFoundError(f"jobs_dataset.csv not found at {jobs_path}")

    raw = pd.read_csv(jobs_path, parse_dates=["date_posted"])

    # Clean: remove duplicates
    df = raw.drop_duplicates(
        subset=["title", "company", "location", "description"]
    ).reset_index(drop=True)

    # Derived columns
    df["salary_mid_lpa"] = df.apply(_compute_salary_mid_lpa, axis=1)
    df["exp_mid"] = (df["exp_min"] + df["exp_max"]) / 2
    df["quarter"] = df["date_posted"].dt.to_period("Q").astype(str)
    df["skill_list"] = df["skills"].fillna("").str.split("|")
    df["skill_list"] = df["skill_list"].apply(
        lambda lst: [s.strip() for s in lst if s.strip()]
    )

    _df = df
    logger.info(f"Jobs loaded: {len(df)} clean rows (from {len(raw)} raw)")

    # ---- Load sample resumes ----
    res_path = data_dir / "sample_resumes.csv"
    if res_path.exists():
        _res_df = pd.read_csv(res_path).fillna("")
        logger.info(f"Sample resumes loaded: {len(_res_df)}")

    # ---- Fit TF-IDF on job skills (used for recommendation) ----
    skill_strings = df["skills"].fillna("").tolist()
    _tfidf = TfidfVectorizer(
        tokenizer=lambda s: s.split("|"),
        lowercase=False,
        token_pattern=None,
    )
    _J = _tfidf.fit_transform(skill_strings)
    logger.info("TF-IDF vectorizer fitted on job skill corpus")

    # ---- Pre-cache demand for all roles ----
    recent_cutoff = df["date_posted"].max() - pd.Timedelta(days=180)
    _recent = df[df["date_posted"] > recent_cutoff]
    for role in df["role"].unique():
        _role_demand_cache[role] = _compute_demand(_recent, role)
    logger.info(f"Role demand cached for {len(_role_demand_cache)} roles")


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _compute_demand(frame: pd.DataFrame, role: str) -> pd.Series:
    """
    Compute skill demand for a role as fraction of postings mentioning each skill.
    Returns a Series indexed by canonical skill name.
    """
    role_df = frame[frame["role"] == role]
    if len(role_df) == 0:
        return pd.Series(dtype=float)
    skill_names = list(_sm["skill"])
    demand = {
        s: role_df["skill_list"].apply(lambda lst: s in lst).mean()
        for s in skill_names
    }
    return pd.Series(demand)


def _market_score(user_skill_set: set, job_row) -> float:
    """
    Compute market-aware score for a single job row.
    Score = weighted sum of demanded skills that the user has / total demand weight.
    """
    role = job_row.role
    demand = _role_demand_cache.get(role)
    if demand is None or len(demand) == 0:
        return 0.0
    job_skills = set(job_row.skill_list)
    total_weight = demand[list(job_skills)].sum() if len(job_skills) > 0 else 0.0
    if total_weight == 0:
        return 0.0
    matched_weight = sum(demand.get(s, 0) for s in job_skills if s in user_skill_set)
    return float(matched_weight / total_weight)


# ---------------------------------------------------------------------------
# Public API functions
# ---------------------------------------------------------------------------

def extract_skills(text: str) -> list[str]:
    """
    Extract canonical skill names from free text using regex keyword matching.
    Handles aliases (e.g., 'sklearn' -> 'scikit-learn', 'GitHub' -> 'Git').
    Returns sorted list of unique canonical skill names.
    """
    if not text or not isinstance(text, str):
        return []
    found = {
        _alias2skill[m.group(1).lower()]
        for m in _extract_pattern.finditer(text)
    }
    return sorted(found)


def extract_skills_semantic(text: str) -> list[str]:
    """
    Enhanced semantic extractor matching canonical skills, regex aliases,
    and colloquial / hard aliases (e.g., 'sci-kit learn', 'foundation models').
    """
    base_skills = set(extract_skills(text))
    if not text or not isinstance(text, str):
        return sorted(base_skills)

    text_lower = text.lower()
    hard_synonyms = {
        "sci-kit learn": "scikit-learn",
        "tensor flow": "TensorFlow",
        "py-torch": "PyTorch",
        "foundation model": "LLMs",
        "foundation models": "LLMs",
        "large language model": "LLMs",
        "retrieval-augmented": "RAG",
        "generative pre-trained": "LLMs",
    }
    for phrase, canon in hard_synonyms.items():
        if phrase in text_lower:
            base_skills.add(canon)
    return sorted(base_skills)



def get_roles() -> list[str]:
    """Return list of unique canonical roles in the dataset."""
    if _df is None:
        raise RuntimeError("Engine not initialised. Call initialize() first.")
    return sorted(_df["role"].unique().tolist())


def get_market_overview() -> dict:
    """
    Return aggregate market statistics.
    Note: All statistics are from a SYNTHETIC dataset.
    """
    if _df is None:
        raise RuntimeError("Engine not initialised.")

    df = _df
    total_jobs = len(df)
    date_from = df["date_posted"].min().strftime("%Y-%m-%d")
    date_to = df["date_posted"].max().strftime("%Y-%m-%d")

    # Top 15 skills by % of postings
    all_skills = df["skill_list"].explode()
    skill_pct = (all_skills.value_counts() / total_jobs * 100).round(1)
    top_skills = [
        {"skill": skill, "pct": float(pct)}
        for skill, pct in skill_pct.head(15).items()
    ]

    # Jobs by role
    role_counts = df["role"].value_counts()
    jobs_by_role = [
        {"role": role, "count": int(count)}
        for role, count in role_counts.items()
    ]

    # Jobs by location
    loc_counts = df["location"].value_counts()
    jobs_by_location = [
        {"location": loc, "count": int(count)}
        for loc, count in loc_counts.items()
    ]

    # Salary stats (where available)
    sal = df["salary_mid_lpa"].dropna()
    salary_stats = None
    if len(sal) > 100:
        salary_stats = {
            "median_lpa": round(float(sal.median()), 1),
            "mean_lpa": round(float(sal.mean()), 1),
            "min_lpa": round(float(sal.min()), 1),
            "max_lpa": round(float(sal.max()), 1),
            "count": int(len(sal)),
        }

    return {
        "total_jobs": total_jobs,
        "date_from": date_from,
        "date_to": date_to,
        "data_note": "SYNTHETIC dataset — statistics are simulated, not real labor-market data.",
        "top_skills": top_skills,
        "jobs_by_role": jobs_by_role,
        "jobs_by_location": jobs_by_location,
        "salary_stats": salary_stats,
    }


def get_market_trends() -> dict:
    """
    Return quarterly skill demand trends.
    Note: Trends reflect injected synthetic growth rates, NOT real observations.
    """
    if _df is None:
        raise RuntimeError("Engine not initialised.")

    df = _df
    skill_names = list(_sm["skill"])

    # Build quarterly skill presence matrix
    Xs = pd.DataFrame(
        {s: df["skill_list"].apply(lambda lst, sk=s: sk in lst) for s in skill_names}
    )
    Xs["quarter"] = df["quarter"]
    trend = Xs.groupby("quarter").mean() * 100  # pct of postings

    # Top 7 trending skills (highest growth: last 3 quarters vs first 3)
    if len(trend) >= 6:
        growth = (trend.iloc[-3:].mean() - trend.iloc[:3].mean()).sort_values(ascending=False)
        trending_skills = growth.head(7).index.tolist()
        falling_skills = growth.tail(3).index.tolist()
    else:
        trending_skills = skill_names[:7]
        falling_skills = []

    # Format: {skill: [{quarter, pct}, ...]}
    quarters = trend.index.tolist()
    series = {}
    for sk in trending_skills + falling_skills:
        if sk in trend.columns:
            series[sk] = [
                {"quarter": q, "pct": round(float(trend.loc[q, sk]), 1)}
                for q in quarters
            ]

    return {
        "quarters": quarters,
        "trending_skills": trending_skills,
        "falling_skills": falling_skills,
        "series": series,
        "note": "Trend lines reflect injected synthetic growth rates, not observed real-world market data.",
    }


def get_skill_demand(role: str) -> dict:
    """
    Return skill demand for a specific role (% of postings mentioning each skill).
    """
    if _df is None:
        raise RuntimeError("Engine not initialised.")

    available_roles = get_roles()
    if role not in available_roles:
        raise ValueError(f"Unknown role '{role}'. Available: {available_roles}")

    demand = _role_demand_cache.get(role, pd.Series(dtype=float))
    # Filter to skills with >0 demand and sort descending
    demand_filtered = demand[demand > 0].sort_values(ascending=False)

    # Get skill categories from master
    skill_cat = _sm.set_index("skill")["category"].to_dict()

    skills_data = [
        {
            "skill": skill,
            "demand_pct": round(float(pct) * 100, 1),
            "category": skill_cat.get(skill, "Other"),
        }
        for skill, pct in demand_filtered.items()
    ]

    role_count = int((_df["role"] == role).sum())

    return {
        "role": role,
        "role_job_count": role_count,
        "skills": skills_data,
        "note": "Demand calculated from recent 180-day window of the synthetic dataset.",
    }


def analyze_resume(text: str, target_role: str = None, years_exp: float = 0) -> dict:
    """
    Extract skills from resume text and return a structured analysis.
    Optionally compares against a target role's requirements.
    """
    if _df is None:
        raise RuntimeError("Engine not initialised.")
    if not text or not text.strip():
        raise ValueError("Resume text is empty.")

    # Extract skills from resume
    extracted = extract_skills(text)

    result = {
        "extracted_skills": extracted,
        "skill_count": len(extracted),
        "years_exp": years_exp,
        "target_role": target_role,
    }

    if target_role and target_role in get_roles():
        gap_data = compute_skill_gap(extracted, target_role)
        result["skill_gap"] = gap_data
        result["coverage_pct"] = gap_data["coverage_pct"]
    else:
        result["skill_gap"] = None
        result["coverage_pct"] = None

    return result


def compute_skill_gap(user_skills: list[str], role: str) -> dict:
    """
    Compare user skills against role market demand.
    Returns missing skills with priority scores.

    Priority formula:
        priority = market_demand * (1 + clip(growth * 4, -0.5, 1.5))

    Explained: High-demand skills get higher priority; skills with
    strong growth signals are boosted further. Both components are
    transparent and use only data available in the synthetic dataset.
    """
    if _df is None:
        raise RuntimeError("Engine not initialised.")
    if role not in get_roles():
        raise ValueError(f"Unknown role: '{role}'")

    df = _df
    max_date = df["date_posted"].max()
    recent_cut = max_date - pd.Timedelta(days=180)
    prior_cut = recent_cut - pd.Timedelta(days=180)

    recent = df[df["date_posted"] > recent_cut]
    prior = df[(df["date_posted"] > prior_cut) & (df["date_posted"] <= recent_cut)]

    demand_recent = _compute_demand(recent, role)
    demand_prior = _compute_demand(prior, role)
    growth = demand_recent - demand_prior

    user_set = set(user_skills)

    # Build gap table
    records = []
    for skill in _sm["skill"]:
        d = float(demand_recent.get(skill, 0))
        if d < 0.10:  # skip very rare skills
            continue
        g = float(growth.get(skill, 0))
        priority = round(d * (1 + np.clip(g * 4, -0.5, 1.5)), 4)
        records.append({
            "skill": skill,
            "have": skill in user_set,
            "market_demand_pct": round(d * 100, 1),
            "growth": round(g, 4),
            "priority_score": priority,
            "category": _sm.loc[_sm["skill"] == skill, "category"].values[0]
            if skill in _sm["skill"].values else "Other",
        })

    records.sort(key=lambda x: x["priority_score"], reverse=True)

    have_skills = [r for r in records if r["have"]]
    missing_skills = [r for r in records if not r["have"]]

    total_demand = sum(r["market_demand_pct"] for r in records)
    covered_demand = sum(r["market_demand_pct"] for r in records if r["have"])
    coverage_pct = round(covered_demand / total_demand * 100, 1) if total_demand > 0 else 0.0

    return {
        "role": role,
        "user_skills": sorted(user_set),
        "coverage_pct": coverage_pct,
        "have_skills": have_skills,
        "missing_skills": missing_skills[:15],   # top 15 missing by priority
        "formula_note": (
            "Priority = market_demand × (1 + clip(growth×4, −0.5, 1.5)). "
            "High-demand + growing skills get highest priority."
        ),
    }


def recommend_jobs(
    user_skills: list[str],
    target_role: str = None,
    years_exp: float = 0,
    w_market: float = 0.4,
    k: int = 5,
) -> dict:
    """
    Recommend top-k jobs using two approaches:

    Model A (w_market=0.0): Pure TF-IDF cosine similarity (baseline).
    Model B (w_market=0.4): Combines similarity + market-aware skill coverage
                             + experience compatibility.

    Scoring:
        score = (1 - w_market) * cosine_sim
              + w_market * (0.6 * market_coverage + 0.4 * exp_fit)

    Returns list of dicts with matched/missing skills and explanation.
    """
    if _df is None:
        raise RuntimeError("Engine not initialised.")

    user_set = set(user_skills)
    skill_string = "|".join(sorted(user_set))
    u_vec = _tfidf.transform([skill_string])

    cos_sim = cosine_similarity(u_vec, _J).ravel()

    # Experience fit: 1.0 if exp_min <= user_exp + 1, else 0.4 (relaxed)
    exp_fit = np.where(_df["exp_min"].values <= years_exp + 1, 1.0, 0.4)

    # Market coverage: how well user skills cover what this role demands
    market_cov = np.array([
        _market_score(user_set, row) for row in _df.itertuples()
    ])

    score = (1 - w_market) * cos_sim + w_market * (0.6 * market_cov + 0.4 * exp_fit)

    top_idx = np.argsort(score)[::-1][:k]

    recommendations = []
    for idx in top_idx:
        row = _df.iloc[idx]
        job_skills = set(row["skill_list"])
        matched = sorted(user_set & job_skills)
        missing = sorted(job_skills - user_set)
        sim_score = float(cos_sim[idx])
        mkt_score = float(market_cov[idx])
        exp_score = float(exp_fit[idx])
        total_score = float(score[idx])

        explanation = _build_explanation(
            matched, missing, sim_score, mkt_score, exp_score, w_market
        )

        recommendations.append({
            "job_id": row["job_id"],
            "title": row["title"],
            "role": row["role"],
            "company": row["company"],
            "location": row["location"],
            "work_mode": row["work_mode"],
            "experience_level": row["experience_level"],
            "exp_min": int(row["exp_min"]),
            "exp_max": int(row["exp_max"]),
            "salary_mid_lpa": round(float(row["salary_mid_lpa"]), 1)
            if not pd.isna(row["salary_mid_lpa"]) else None,
            "matched_skills": matched,
            "missing_skills": missing[:8],    # show top 8 missing
            "total_job_skills": len(job_skills),
            "match_count": len(matched),
            "similarity_score": round(sim_score, 3),
            "market_coverage_score": round(mkt_score, 3),
            "experience_fit_score": round(exp_score, 3),
            "total_score": round(total_score, 3),
            "explanation": explanation,
        })

    model_label = (
        "Market-Aware Recommender (Model B)"
        if w_market > 0
        else "Baseline Similarity Recommender (Model A)"
    )

    return {
        "model": model_label,
        "w_market": w_market,
        "user_skills": sorted(user_set),
        "target_role": target_role,
        "years_exp": years_exp,
        "recommendations": recommendations,
        "scoring_note": (
            f"Score = {1-w_market:.1f} × cosine_similarity "
            f"+ {w_market:.1f} × (0.6 × market_coverage + 0.4 × exp_fit)"
        ),
    }


def _build_explanation(matched, missing, sim, mkt, exp, w_market):
    """Generate a human-readable explanation for a recommendation."""
    parts = []
    parts.append(f"Matched {len(matched)} skill(s): {', '.join(matched[:5]) or 'none'}.")
    if missing:
        parts.append(f"Missing: {', '.join(missing[:4])}.")
    sim_label = "High" if sim > 0.5 else ("Moderate" if sim > 0.2 else "Low")
    parts.append(f"Skill similarity: {sim_label} ({sim:.0%}).")
    if w_market > 0:
        mkt_label = "Strong" if mkt > 0.6 else ("Moderate" if mkt > 0.3 else "Low")
        parts.append(f"Market coverage: {mkt_label} ({mkt:.0%}).")
    if exp >= 0.9:
        parts.append("Experience requirement: Well matched.")
    else:
        parts.append("Experience requirement: May be slightly above your current level.")
    return " ".join(parts)


def get_salary_estimate(
    role: str,
    location: str,
    experience: float,
    skills: list[str],
) -> dict:
    """
    Return a demonstration salary estimate based on the trained salary model.
    NOTE: Trained on SYNTHETIC data — not a real-world salary predictor.

    Falls back to median-based estimate if the model artifact is unavailable.
    """
    if _df is None:
        raise RuntimeError("Engine not initialised.")

    manifest_path = _MODELS / "model_manifest.json"
    model_path = _MODELS / "salary_model.joblib"

    # Try to use saved model
    if model_path.exists() and manifest_path.exists():
        try:
            import joblib
            pipeline = joblib.load(model_path)
            # Build feature row
            row = pd.DataFrame([{
                "role": role,
                "location": location,
                "company_type": "Mid-size Tech",   # sensible default
                "work_mode": "Hybrid",
                "exp_mid": experience,
                "n_skills": len(skills),
            }])
            # Add skill columns
            for sk in list(_sm["skill"]):
                row[f"sk_{sk}"] = int(sk in skills)
            pred_lpa = float(pipeline.predict(row)[0])
            return {
                "estimated_salary_lpa": round(pred_lpa, 1),
                "currency": "INR",
                "unit": "LPA (Lakhs Per Annum)",
                "note": "DEMONSTRATION ESTIMATE — model trained on synthetic data.",
                "model": "Gradient Boosting (saved artifact)",
            }
        except Exception as e:
            logger.warning(f"Salary model load/predict failed: {e}. Using fallback.")

    # Fallback: median salary for role+location in dataset
    df = _df
    subset = df[
        (df["role"] == role) & (df["location"] == location) & df["salary_mid_lpa"].notna()
    ]
    if len(subset) < 5:
        subset = df[(df["role"] == role) & df["salary_mid_lpa"].notna()]
    if len(subset) == 0:
        subset = df[df["salary_mid_lpa"].notna()]

    median_lpa = float(subset["salary_mid_lpa"].median())
    return {
        "estimated_salary_lpa": round(median_lpa, 1),
        "currency": "INR",
        "unit": "LPA (Lakhs Per Annum)",
        "note": "DEMONSTRATION ESTIMATE — median from synthetic dataset. Saved model not found.",
        "model": "Median Fallback",
    }
