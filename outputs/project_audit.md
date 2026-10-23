# CareerIQ — Project Audit Report
Generated: 2026-10-20 | Phase: 0 — Workspace Inspection

## 1. Existing Project Structure (Before Reorganisation)

```
JOB skill/
├── jobs_dataset.csv            (7.0 MB - main dataset)
├── skills_master.csv           (1.6 KB - skill taxonomy)
├── sample_resumes.csv          (12 KB - 40 synthetic resumes)
├── generate_dataset.py         (synthetic data generator)
├── run_pipeline.py             (end-to-end ML pipeline)
├── requirements.txt            (minimal)
├── README.md
├── landingpage.html            (Tailwind CSS landing page)
├── CareerIQ_Master_Prompts.md
├── 01_eda_overview.png
├── 02_skill_trends.png
├── outputs/                    (empty)
└── step wise/
    └── CareerIQ_Part1_Data.ipynb
```

Reorganised to: careeriq/ with data/, notebooks/, models/, outputs/, backend/, frontend/

## 2. Dataset: jobs_dataset.csv

Shape: 12,120 rows x 17 columns | File: ~7.0 MB

| Column | Type | Notes |
|---|---|---|
| job_id | str | Unique ID (J00001 format) |
| title | str | Job title variants |
| role | str | 12 unique canonical roles |
| role_family | str | ML/AI, Data Science, Analytics, Data Eng, Software |
| company | str | 32 fictional company names |
| company_type | str | Startup, Product MNC, IT Services, Mid-size Tech, Unicorn, Consulting |
| location | str | 10 cities + Remote |
| work_mode | str | On-site, Hybrid |
| experience_level | str | Fresher, Junior, Mid, Senior |
| exp_min | int | Min years required |
| exp_max | int | Max years required |
| education | str | B.Tech, M.Tech, MCA, B.Sc, M.Sc, MBA |
| salary_min | float | INR/year (~9.83% missing) |
| salary_max | float | INR/year (~9.83% missing) |
| date_posted | datetime | 2024-01-01 to 2026-10-14 |
| description | str | Free-text (~80-120 words, template-generated) |
| skills | str | Ground-truth skills, pipe-separated |

### Missing Values
- salary_min: 1,191 missing (9.83%)
- salary_max: 1,191 missing (9.83%)
- All other columns: 0 missing

### Duplicates: 120 rows (title+company+location+description match)
Deduplication rule: Drop duplicates on (title, company, location, description), keep first.

### Unique Roles (12)
Data Scientist: 1724 | Machine Learning Engineer: 1681 | Data Analyst: 1622 |
Data Engineer: 1250 | AI Engineer: 1226 | Business Analyst: 936 |
NLP Engineer: 719 | Python Backend Developer: 687 | MLOps Engineer: 683 |
Computer Vision Engineer: 604 | Full Stack Developer: 505 | Data Science Intern: 483

### Unique Locations (10)
Bengaluru, Hyderabad, Pune, Delhi NCR, Mumbai, Chennai, Noida, Kolkata, Ahmedabad, Remote

### Date Coverage: 2024-01-01 to 2026-10-14 (~33 months)
### Salary: INR/year | Range: ~2.1 LPA to ~49.1 LPA | 90.1% available

## 3. Dataset: skills_master.csv
Shape: 57 skills x 4 columns (skill, category, aliases, yearly_growth)
Categories: Programming, Database, Analytics, ML, DL Framework, GenAI, Big Data, Data Eng, DevOps, Cloud, MLOps, Tools, Backend, Frontend
Aliases: 16 skills have aliases (JS, sklearn, GitHub, Amazon Web Services, etc.)
Growth: yearly_growth range -0.05 to +0.16 (SYNTHETIC rates)

## 4. Dataset: sample_resumes.csv
Shape: 40 resumes x 6 columns (resume_id, target_role, target_family, years_exp, resume_text, true_skills)
Target roles: 10 unique roles | years_exp: 0-5

## 5. DATA PROVENANCE: 100% SYNTHETIC

Evidence:
1. generate_dataset.py creates all data via random.Random(42) and np.random.default_rng(42)
2. README explicitly states dataset is SYNTHETIC
3. Company names are fictional (Nexora, Datavista, Brightlogic, etc.)
4. Job descriptions are template-generated sentences
5. Skills follow hardcoded probability tables in ROLES dict
6. Salary = formula with Gaussian noise
7. Date range 2024-2026 extends into the future
8. Skills column = ground-truth labels, NOT extracted from text

Implications:
- Skill extraction F1 is circular (labels came from same list as extraction)
- Trend analysis reflects injected growth rates, not real market observations
- Salary model trains on synthetic formulas
- All statistics must be labeled as simulated, not real labor-market data

## 6. Existing Reusable Code

run_pipeline.py: extract_skills(), demand(), skill_gap(), recommend(), p_at_k()
generate_dataset.py: SKILLS dict, ROLES dict, HARD_ALIASES, alias definitions
CareerIQ_Part1_Data.ipynb: Colab-ready notebook for data generation + EDA

## 7. Missing Components

| Component | Status |
|---|---|
| backend/main.py (FastAPI) | MISSING - To create |
| backend/engine.py | MISSING - To create |
| frontend/ (Next.js) | MISSING - To create |
| notebooks/02_nlp_extraction.ipynb | MISSING - To create |
| notebooks/03_train_evaluate.ipynb | MISSING - To create |
| models/model_manifest.json | MISSING - To create |
| train_models.py | MISSING - To create |
| requirements.txt (complete) | MINIMAL - To update |

## 8. Salary Prediction Decision: INCLUDED
Justification: 10,929 rows have salary (90.1%), consistent INR units, features available.
Caveat: Label output as Demonstration Estimate (trained on synthetic data).

## 9. Known Limitations
1. Synthetic data - cannot claim to reflect real job-market trends
2. Skill extraction circularity - F1 is optimistically high
3. Trend analysis shows injected growth rates, not real trends
4. No real salary benchmark
5. No source URLs or real company identifiers
6. Resume evaluation uses same synthetic universe

## 10. Recommended Implementation Order
Phase 0: Audit (done)
Phase 1: Data pipeline, engine.py, train_models.py
Phase 2: FastAPI backend (main.py)
Phase 3: Next.js frontend
Phase 4: Colab notebooks (Part 2 NLP, Part 3 Models)
Phase 5: Integration + tests + README
