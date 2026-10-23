"""
convert_real_data.py — Real-Data Converter for CareerIQ

Converts real-world Kaggle / LinkedIn / Naukri job datasets into the standard
CareerIQ schema (17 columns) so that run_pipeline.py and the FastAPI backend
can process real data without modification.

Supported Sources:
  - asaniczka: LinkedIn data-science/analyst/software postings (2024)
  - arshkon: LinkedIn postings (2023-2024, postings.csv)
  - naukri: Indian data-science job postings (Naukri scrape)

Usage:
  python convert_real_data.py --source asaniczka --input raw/linkedin_jobs.csv --out data/jobs_dataset.csv
  python convert_real_data.py --source arshkon --input raw/postings.csv --usd_inr 85
  python convert_real_data.py --source naukri --input raw/naukri_jobs.csv
"""

import argparse
import logging
import os
import re
import sys
from datetime import datetime
import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("convert_real_data")

# 12 Standard CareerIQ Roles
VALID_ROLES = [
    "Machine Learning Engineer",
    "Data Scientist",
    "Data Analyst",
    "AI Engineer",
    "MLOps Engineer",
    "NLP Engineer",
    "Computer Vision Engineer",
    "Data Engineer",
    "Business Analyst",
    "Python Backend Developer",
    "Full Stack Developer",
    "Data Science Intern/Fresher",
]

ROLE_FAMILY_MAP = {
    "Machine Learning Engineer": "AI/ML Engineering",
    "AI Engineer": "AI/ML Engineering",
    "MLOps Engineer": "AI/ML Engineering",
    "NLP Engineer": "AI/ML Engineering",
    "Computer Vision Engineer": "AI/ML Engineering",
    "Data Scientist": "Data Science & Research",
    "Data Analyst": "Analytics & BI",
    "Business Analyst": "Analytics & BI",
    "Data Engineer": "Data Engineering",
    "Python Backend Developer": "Software Engineering",
    "Full Stack Developer": "Software Engineering",
    "Data Science Intern/Fresher": "Entry Level / Intern",
}

# Regex rules for role classification (ordered from specific to general)
ROLE_RULES = [
    (r"intern|trainee|apprentice|fresher|graduate engineer", "Data Science Intern/Fresher"),
    (r"mlops|machine learning operations", "MLOps Engineer"),
    (r"computer vision|cv engineer|image processing", "Computer Vision Engineer"),
    (r"nlp|natural language|llm engineer|generative ai", "NLP Engineer"),
    (r"ai engineer|artificial intelligence", "AI Engineer"),
    (r"machine learning|ml engineer|ml developer", "Machine Learning Engineer"),
    (r"data scientist|scientist - data|applied scientist", "Data Scientist"),
    (r"data engineer|etl|big data|pipeline engineer", "Data Engineer"),
    (r"business analyst|bi analyst|product analyst", "Business Analyst"),
    (r"data analyst|analytics|reporting analyst|insights", "Data Analyst"),
    (r"full stack|fullstack|mern|mean stack", "Full Stack Developer"),
    (r"backend|python developer|django|fastapi|flask", "Python Backend Developer"),
]

# Indian City Normalization Map
CITY_MAP = {
    "bangalore": "Bengaluru",
    "bengaluru": "Bengaluru",
    "hyderabad": "Hyderabad",
    "secunderabad": "Hyderabad",
    "pune": "Pune",
    "mumbai": "Mumbai",
    "navi mumbai": "Mumbai",
    "delhi": "Delhi NCR",
    "new delhi": "Delhi NCR",
    "noida": "Delhi NCR",
    "gurgaon": "Delhi NCR",
    "gurugram": "Delhi NCR",
    "chennai": "Chennai",
    "kolkata": "Kolkata",
    "ahmedabad": "Ahmedabad",
    "kochi": "Kochi",
    "cochin": "Kochi",
    "trivandrum": "Kochi",
    "thiruvananthapuram": "Kochi",
    "chandigarh": "Chandigarh",
    "mohali": "Chandigarh",
    "remote": "Remote",
    "work from home": "Remote",
}

def normalize_city(loc_str: str) -> str:
    if not isinstance(loc_str, str) or not loc_str.strip():
        return "Remote"
    loc_lower = loc_str.lower()
    for key, val in CITY_MAP.items():
        if key in loc_lower:
            return val
    return "Bengaluru"  # Default primary tech hub

def map_experience_level(exp_str: str, default_min: float = 2.0, default_max: float = 5.0):
    """Parse text/code into (level, exp_min, exp_max)."""
    if not isinstance(exp_str, str):
        return "Mid", default_min, default_max
    
    s = exp_str.lower()
    # Check numbers like "3-5 yrs" or "5 to 8 years"
    match = re.search(r"(\d+)\s*(?:-|to)\s*(\d+)", s)
    if match:
        emin, emax = float(match.group(1)), float(match.group(2))
        if emax <= 1:
            return "Fresher", emin, emax
        elif emax <= 3:
            return "Junior", emin, emax
        elif emax <= 6:
            return "Mid", emin, emax
        else:
            return "Senior", emin, emax
            
    if any(k in s for k in ["intern", "entry", "fresher", "graduate"]):
        return "Fresher", 0.0, 1.0
    if any(k in s for k in ["associate", "junior", "1-3"]):
        return "Junior", 1.0, 3.0
    if any(k in s for k in ["mid", "intermediate", "3-5", "3-6"]):
        return "Mid", 3.0, 6.0
    if any(k in s for k in ["senior", "lead", "principal", "manager", "director", "architect"]):
        return "Senior", 6.0, 12.0
        
    return "Mid", default_min, default_max

def classify_role(title: str, default: str = "Data Scientist") -> str:
    if not isinstance(title, str):
        return default
    t_lower = title.lower()
    for pattern, role in ROLE_RULES:
        if re.search(pattern, t_lower):
            return role
    return "Other"

def load_skills_extractor(skills_master_path: str):
    """Compile regex lookup from skills_master.csv."""
    if not os.path.exists(skills_master_path):
        logger.warning(f"Skills master not found at {skills_master_path}")
        return None
        
    df_sm = pd.read_csv(skills_master_path)
    alias_to_canonical = {}
    for _, row in df_sm.iterrows():
        canon = row["skill"]
        alias_to_canonical[canon.lower()] = canon
        aliases = str(row.get("aliases", ""))
        if aliases and aliases != "nan":
            for a in aliases.split("|"):
                a = a.strip()
                if a:
                    alias_to_canonical[a.lower()] = canon
                    
    # Sort aliases by length descending
    sorted_aliases = sorted(alias_to_canonical.keys(), key=len, reverse=True)
    regexes = []
    for a in sorted_aliases:
        escaped = re.escape(a)
        # Lookarounds to prevent substring false-positives
        pattern = re.compile(rf"(?<![A-Za-z0-9+#.]){escaped}(?![A-Za-z0-9+#])", re.IGNORECASE)
        regexes.append((pattern, alias_to_canonical[a]))
        
    def extract(text: str) -> str:
        if not isinstance(text, str) or not text.strip():
            return ""
        found = set()
        for pat, canon in regexes:
            if pat.search(text):
                found.add(canon)
        return "|".join(sorted(found))
        
    return extract

def convert_asaniczka(df: pd.DataFrame, extractor, usd_inr: float = 85.0) -> pd.DataFrame:
    """Convert Asaniczka LinkedIn Job Postings Dataset."""
    records = []
    for idx, row in df.iterrows():
        title = str(row.get("job_title", ""))
        role = classify_role(title)
        
        loc = normalize_city(str(row.get("job_location", "")))
        level_str = str(row.get("job_level", "Mid"))
        level, emin, emax = map_experience_level(level_str)
        
        # Combine skills column + summary
        raw_skills = str(row.get("job_skills", ""))
        summary = str(row.get("job_summary", ""))
        full_text = f"{title} {raw_skills} {summary}"
        extracted = extractor(full_text) if extractor else raw_skills.replace(",", "|")
        
        # Date
        date_str = str(row.get("first_seen", "2024-06-01"))[:10]
        try:
            datetime.strptime(date_str, "%Y-%m-%d")
        except Exception:
            date_str = "2024-06-01"
            
        records.append({
            "job_id": f"real_asan_{idx+1:06d}",
            "title": title,
            "role": role,
            "role_family": ROLE_FAMILY_MAP.get(role, "Other"),
            "company": str(row.get("company", "Tech Company")),
            "company_type": "Unknown",
            "location": loc,
            "work_mode": "Hybrid" if loc != "Remote" else "Remote",
            "experience_level": level,
            "exp_min": emin,
            "exp_max": emax,
            "education": "Unknown",
            "salary_min": np.nan,
            "salary_max": np.nan,
            "date_posted": date_str,
            "description": summary or f"Exciting job role for {title} with skills {extracted}.",
            "skills": extracted,
        })
    return pd.DataFrame(records)

def convert_arshkon(df: pd.DataFrame, extractor, usd_inr: float = 85.0) -> pd.DataFrame:
    """Convert Arshkon LinkedIn Postings Dataset."""
    records = []
    for idx, row in df.iterrows():
        title = str(row.get("title", ""))
        role = classify_role(title)
        
        loc = normalize_city(str(row.get("location", "")))
        level_str = str(row.get("formatted_experience_level", "Mid"))
        level, emin, emax = map_experience_level(level_str)
        
        # Salary conversion
        period = str(row.get("pay_period", "")).upper()
        min_sal = row.get("min_salary")
        max_sal = row.get("max_salary")
        
        if pd.notna(min_sal) and min_sal > 0:
            if period == "HOURLY":
                min_sal = min_sal * 2080 * usd_inr
                max_sal = (max_sal * 2080 * usd_inr) if pd.notna(max_sal) else min_sal * 1.2
            elif period == "MONTHLY":
                min_sal = min_sal * 12 * usd_inr
                max_sal = (max_sal * 12 * usd_inr) if pd.notna(max_sal) else min_sal * 1.2
            else: # YEARLY
                min_sal = min_sal * usd_inr
                max_sal = (max_sal * usd_inr) if pd.notna(max_sal) else min_sal * 1.2
        else:
            min_sal, max_sal = np.nan, np.nan
            
        desc = str(row.get("description", ""))
        skills_desc = str(row.get("skills_desc", ""))
        extracted = extractor(f"{title} {desc} {skills_desc}") if extractor else ""
        
        # Timestamp to YYYY-MM-DD
        ts = row.get("original_listed_time")
        if pd.notna(ts):
            try:
                date_str = datetime.fromtimestamp(float(ts) / 1000.0).strftime("%Y-%m-%d")
            except Exception:
                date_str = "2024-05-15"
        else:
            date_str = "2024-05-15"
            
        remote = row.get("remote_allowed", 0)
        work_mode = "Remote" if (remote == 1 or loc == "Remote") else "Onsite"
        
        records.append({
            "job_id": f"real_arsh_{idx+1:06d}",
            "title": title,
            "role": role,
            "role_family": ROLE_FAMILY_MAP.get(role, "Other"),
            "company": str(row.get("company_name", "Technology Solutions")),
            "company_type": "Unknown",
            "location": loc,
            "work_mode": work_mode,
            "experience_level": level,
            "exp_min": emin,
            "exp_max": emax,
            "education": "Unknown",
            "salary_min": min_sal,
            "salary_max": max_sal,
            "date_posted": date_str,
            "description": desc[:1500] if desc else f"Job opportunity for {title}",
            "skills": extracted,
        })
    return pd.DataFrame(records)

def convert_naukri(df: pd.DataFrame, extractor) -> pd.DataFrame:
    """Convert Naukri Indian Job Scrape Dataset."""
    records = []
    for idx, row in df.iterrows():
        title = str(row.get("job_role", row.get("title", "")))
        role = classify_role(title)
        
        loc = normalize_city(str(row.get("location", "")))
        exp_str = str(row.get("job_experience", row.get("experience", "")))
        level, emin, emax = map_experience_level(exp_str)
        
        skills_text = str(row.get("skills", ""))
        desc = str(row.get("description", ""))
        extracted = extractor(f"{title} {skills_text} {desc}") if extractor else skills_text.replace(",", "|")
        
        date_str = "2024-09-01"  # Fixed reference scrape date
        
        records.append({
            "job_id": f"real_nauk_{idx+1:06d}",
            "title": title,
            "role": role,
            "role_family": ROLE_FAMILY_MAP.get(role, "Other"),
            "company": str(row.get("company", "Hiring Firm")),
            "company_type": "Unknown",
            "location": loc,
            "work_mode": "Hybrid" if loc != "Remote" else "Remote",
            "experience_level": level,
            "exp_min": emin,
            "exp_max": emax,
            "education": "Unknown",
            "salary_min": np.nan,
            "salary_max": np.nan,
            "date_posted": date_str,
            "description": desc or f"Role for {title} requiring {extracted}",
            "skills": extracted,
        })
    return pd.DataFrame(records)

def main():
    parser = argparse.ArgumentParser(description="Convert real-world job datasets to CareerIQ schema.")
    parser.add_argument("--source", choices=["asaniczka", "arshkon", "naukri"], required=True,
                        help="Data source parser format")
    parser.add_argument("--input", required=True, help="Input CSV file path")
    parser.add_argument("--out", default="data/jobs_dataset.csv", help="Output CSV path")
    parser.add_argument("--skills_master", default="data/skills_master.csv", help="Skills master file for extraction")
    parser.add_argument("--usd_inr", type=float, default=85.0, help="USD to INR exchange rate")
    parser.add_argument("--keep_other", action="store_true", help="Keep unmapped roles as 'Other'")
    parser.add_argument("--max_rows", type=int, default=None, help="Max rows to process")
    args = parser.parse_args()

    if not os.path.exists(args.input):
        logger.error(f"Input file not found: {args.input}")
        sys.exit(1)

    logger.info(f"Loading input: {args.input} (source: {args.source})")
    raw_df = pd.read_csv(args.input, nrows=args.max_rows)
    logger.info(f"Loaded {len(raw_df)} raw records.")

    extractor = load_skills_extractor(args.skills_master)

    if args.source == "asaniczka":
        converted = convert_asaniczka(raw_df, extractor, args.usd_inr)
    elif args.source == "arshkon":
        converted = convert_arshkon(raw_df, extractor, args.usd_inr)
    elif args.source == "naukri":
        converted = convert_naukri(raw_df, extractor)
    else:
        logger.error("Unknown source format.")
        sys.exit(1)

    # Filter invalid/unmapped
    if not args.keep_other:
        converted = converted[converted["role"] != "Other"].copy()

    # Drop rows without known skills
    converted = converted[converted["skills"].str.len() > 0].copy()

    # Drop duplicates
    converted = converted.drop_duplicates(subset=["title", "company", "location", "description"])

    logger.info("=" * 60)
    logger.info("CONVERSION SUMMARY")
    logger.info("=" * 60)
    logger.info(f"Final valid jobs: {len(converted)}")
    logger.info(f"Date range: {converted['date_posted'].min()} to {converted['date_posted'].max()}")
    salary_count = converted["salary_min"].notna().sum()
    logger.info(f"Salary availability: {salary_count}/{len(converted)} ({salary_count/len(converted)*100:.1f}%)")
    logger.info("\nRole Breakdown:")
    for role, count in converted["role"].value_counts().items():
        logger.info(f"  {role:30s}: {count:5d} ({count/len(converted)*100:4.1f}%)")

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    converted.to_csv(args.out, index=False)
    logger.info(f"\nSaved successfully to {args.out}")

if __name__ == "__main__":
    main()
