# CareerIQ: Master Prompts

How to use: paste **Prompt 0** first (it gives the AI the full context), then paste the part-prompts (1 to 8) one at a time, in order. Each part-prompt is self-contained, so you can also use any one of them alone. Works with Claude, ChatGPT, Cursor, Copilot, etc.

---

## PROMPT 0: Project context (paste this first)

```
You are a senior ML engineer and full-stack developer helping me build a final-year project.

PROJECT: CareerIQ, a Market-Aware AI Career Intelligence Platform.
One-line idea: the system analyses thousands of job postings, learns which skills the market
demands and which are growing, reads a user's resume, finds the user's prioritized skill gaps,
recommends and ranks suitable jobs with explanations, and suggests what to learn next.

PIPELINE:
job postings -> cleaning -> skill extraction (NLP) -> market intelligence (trends, salary model,
job clusters) ; user resume -> skill extraction -> skill gap -> job recommendation + ranking ->
explainable output (matched skills, missing skills, priority).

DATA: synthetic dataset (12k Indian AI/Data job postings, Jan 2024 to Oct 2026) that I generate with a
script, because real data was hard to find. The pipeline must also work with real data that has the
same columns. In reports I will state clearly that the data is synthetic.

TECH STACK: Python 3.10+, pandas, numpy, scikit-learn, matplotlib (ML); FastAPI + uvicorn (backend);
Next.js 14 (App Router, JavaScript) + React 18 (frontend). No database at first (CSV files).
Later/optional: spaCy, sentence-transformers, PostgreSQL + pgvector, Docker, MLflow.

FOLDER STRUCTURE:
careeriq/
  data/ (jobs_dataset.csv, skills_master.csv, sample_resumes.csv)
  generate_dataset.py, convert_real_data.py, run_pipeline.py
  backend/ (__init__.py, engine.py, main.py)
  frontend/ (package.json, app/layout.js, app/page.js, app/globals.css)
  outputs/ (charts, result tables), notebooks/, requirements.txt, README.md

RULES: write clean, commented, runnable code; keep files small and readable; no unnecessary
libraries; explain how to run every part; be honest about limitations (synthetic data,
circular evaluation); reply to me in simple Hinglish when explaining, code/comments in English.
Reply "ready" and wait for the next prompt.
```

---

## PROMPT 1: Synthetic dataset generator

```
Write generate_dataset.py that creates a realistic synthetic job-posting dataset.

CLI: python generate_dataset.py --n 12000 --seed 42 --out data

OUTPUT FILES
1) data/jobs_dataset.csv with columns:
   job_id, title, role, role_family, company, company_type, location, work_mode, experience_level,
   exp_min, exp_max, education, salary_min, salary_max (INR per year), date_posted (YYYY-MM-DD),
   description (free text), skills (ground-truth labels joined by "|")
2) data/skills_master.csv: skill, category, aliases ("|" separated), yearly_growth
3) data/sample_resumes.csv: resume_id, target_role, target_family, years_exp, resume_text, true_skills
   (40 resumes)

DESIGN
- 57 skills (Python, SQL, Docker, Kubernetes, AWS, PyTorch, TensorFlow, LLMs, RAG, LangChain, MLflow,
  Spark, Airflow, Power BI, etc.) with category, aliases (e.g. scikit-learn: sklearn; Kubernetes: K8s;
  LLMs: Large Language Models) and a yearly_growth (Docker +0.08, LLMs +0.16, RAG +0.13,
  TensorFlow -0.04, Hadoop -0.05, ...).
- 12 roles (ML Engineer, Data Scientist, Data Analyst, AI Engineer, MLOps Engineer, NLP Engineer,
  Computer Vision Engineer, Data Engineer, Business Analyst, Python Backend Developer,
  Full Stack Developer, Data Science Intern/Fresher), each with a base salary (LPA), role weight and
  a dict of skill -> base probability. Title variants per role (e.g. "ML Engineer",
  "Machine Learning Developer"); prefix Senior/Lead for senior levels.
- 4 experience levels (Fresher 0-1, Junior 1-3, Mid 3-6, Senior 6-10).
- Time effect: skill probability = base + growth * (t_years - span/2), clipped to [0.01, 0.97],
  so Docker/LLMs rise and TensorFlow/Hadoop fall across 2024 to 2026.
- 10 Indian cities + Remote with salary multipliers and weights (Bengaluru highest).
  6 company types with multipliers. Education distribution.
- Salary (LPA) = base * (0.72 + 0.12*exp_mid) * city_mult * company_mult + skill bonuses
  (LLMs, Kubernetes, Spark, AWS, ...) , mild yearly inflation, gaussian noise (~9%).
  salary_min = 0.88*salary, salary_max = 1.15*salary, converted to INR.
- Description: template sentences (intro, 2 responsibilities, skills sentences, experience/education
  line, 2 outro lines). Skills are written using random aliases (about 35%) and a few "hard aliases"
  (about 5%: "sci-kit learn", "Tensor Flow", "foundation models", ...) that a keyword extractor
  will miss, so a transformer extractor can later beat the baseline.
- Realistic mess: 10% missing salaries, 1% duplicate postings with new ids.
- Resumes: pick a role, keep ~70% of its skill profile + 2 random skills, years_exp, short text.
Include a docstring and print a short summary at the end.
```

---

## PROMPT 2: ML pipeline script (run_pipeline.py)

```
Write run_pipeline.py: a single script (runs in about 1 minute) that reads data/*.csv and prints results
and saves charts into outputs/. It must NOT crash if salary or dates are missing (skip sections).

SECTIONS
1) Cleaning: load jobs, drop duplicates on (title, company, location, description), build
   salary_mid_lpa, exp_mid, quarter; print counts.
2) EDA: top-15 skills (% of postings), postings by role, by city, salary boxplot by role.
   Save outputs/01_eda_overview.png (2x2 subplots).
3) Skill extraction baseline: dictionary + alias regex with lookarounds
   (?<![A-Za-z0-9+#.])(alias)(?![A-Za-z0-9+#]), case-insensitive, longest alias first, map to canonical
   skill. Evaluate on 3000 random jobs against the ground-truth `skills` column: precision, recall, F1.
4) Market trends: % of postings per skill per quarter; print fastest rising/falling skills
   (mean of last 3 quarters minus first 3, in percentage points); save line chart
   outputs/02_skill_trends.png.
5) Salary prediction: features = exp_mid, one-hot(role, location, company_type, work_mode),
   binary skill columns, n_skills. 80/20 split. Compare LinearRegression, RandomForest(200),
   HistGradientBoosting. Report MAE, RMSE, R2; save outputs/salary_model_results.csv.
6) Clustering: binary skill matrix; KMeans for k=4..10, choose best silhouette; print each cluster's
   size, dominant role and top-5 skills.
7) Skill gap + recommendation:
   - demand(frame, role) = share of postings of that role containing each skill.
   - Use last 180 days as "recent" and previous 180 days as "prior"; growth = recent - prior.
   - skill_gap(user_skills, role): keep skills with demand >= 20%;
     priority = demand * (1 + clip(growth*4, -0.5, 1.5)); split into missing / strong.
   - Recommendation over recent jobs: TF-IDF on skill tokens + cosine similarity.
     Model A = similarity only. Model B = 0.6*similarity + 0.4*(0.6*market_weighted_skill_coverage
     + 0.4*experience_fit), where experience_fit = 1 if exp_min <= years_exp+1 else 0.4.
   - Evaluate Precision@5 on the sample resumes (relevant = same role_family), and a stricter version
     (same family AND experience fits). Print an explainable top-3 for one resume:
     matched x/y skills + missing skills.
Print a clear header per section. Note in comments that experience-fit is used in both the score and
the strict metric (circular), so real evaluation needs hand-labelled data.
```

---

## PROMPT 3: Backend (FastAPI)

```
Write the FastAPI backend in two files: backend/engine.py (ML logic) and backend/main.py (API).
Also create an empty backend/__init__.py.

backend/engine.py (loads data ONCE at import, paths relative to ../data):
- df (deduplicated jobs with skill_list, quarter, salary_mid_lpa), sm (skills_master), SKILLS list.
- extract_skills(text): alias regex baseline (same as the pipeline).
- recent (last 180 days) and prior (180 days before that); ROLES; ROLE_DEM and ROLE_DEM_PRIOR dicts
  (per role: skill -> demand share).
- overview(): total_jobs, top_skills [{skill,pct}], roles (counts), cities (counts),
  median_salary_lpa per role.
- trends(skills): quarters + {skill: [pct per quarter]}.
- role_skills(role): top-20 skills with demand_pct and growth_pp.
- skill_gap(user_skills, role): rows with demand_pct, growth_pp, priority (0 to 10 scale),
  returns {missing, strong, coverage_pct}; priority = demand*(1+clip(growth*4,-0.5,1.5)).
- recommend(text, years_exp, k, w_market=0.4): TF-IDF cosine similarity + market coverage +
  experience fit; returns {user_skills, jobs:[{job_id,title,company,location,role,score_pct,
  matched,total_skills,missing}]}.

backend/main.py:
- FastAPI app "CareerIQ API" with CORS for http://localhost:3000.
- Pydantic models: ResumeIn{text}, GapIn{text,role}, RecIn{text,years_exp=1,k=5}.
- Endpoints: GET /health, GET /roles, GET /market/overview,
  GET /market/trends?skills=Docker,LLMs,AWS,PyTorch,TensorFlow, GET /skills/demand?role=,
  POST /resume/analyze, POST /skill-gap, POST /recommend.
- Unknown role -> HTTP 400 listing valid roles.
Run command (from project root): uvicorn backend.main:app --reload ; docs at /docs.
Then explain each endpoint with a curl example.
```

---

## PROMPT 4: Frontend (Next.js)

```
Build a minimal Next.js 14 (App Router, plain JavaScript, no TypeScript, no extra UI libraries)
frontend in frontend/. Files: package.json (next 14.2.15, react/react-dom 18.3.1; scripts dev, build,
start), app/layout.js, app/page.js ("use client"), app/globals.css.

API base: process.env.NEXT_PUBLIC_API || "http://localhost:8000". Helper api(path, body?) using fetch
(POST with JSON when body given, throw on non-OK).

UI: title "CareerIQ" + subtitle; two tabs.
Tab 1 "Market dashboard": on load call /market/overview and /market/trends. Show total jobs card,
 "Top skills (% of jobs)" horizontal bars, "Jobs by role" bars, and "Skill demand change (first to last
 quarter, pp)" with green/red numbers. Draw bars with plain divs (no chart library). If the backend
 is unreachable show: "Backend not reachable. Start it with: uvicorn backend.main:app --reload".
Tab 2 "Resume and recommendations": textarea for resume text (prefilled sample), role <select> loaded
 from /roles (default "Machine Learning Engineer"), years-of-experience input, "Analyse" button
 (disabled + "Analysing..." while loading). On click call POST /skill-gap and POST /recommend.
 Left card: skills the user has (green tags) with coverage %, then missing skills as priority bars
 (/10). Right card: top-5 jobs with score %, company | location, "Matched x/y skills", missing skills
 as red tags. Show errors in red.
Styling in globals.css: CSS variables for light + dark mode (prefers-color-scheme), cards with
rounded borders, 2-column grid collapsing to 1 column under 700px, tags, tabs.
Give run steps: cd frontend && npm install && npm run dev (open http://localhost:3000).
```

---

## PROMPT 5: Real-data converter

```
Write convert_real_data.py to convert a real Kaggle job dataset into the CareerIQ schema so that
run_pipeline.py works unchanged.

CLI: python convert_real_data.py --source {asaniczka|arshkon|naukri} --input FILE
     [--out data/jobs_dataset.csv] [--usd_inr 85] [--keep_other] [--max_rows N]

Sources and expected columns:
- asaniczka (LinkedIn data-science/analyst/software postings 2024): job_title, company, job_location,
  first_seen, job_level, job_type, job_summary, job_skills (comma separated).
- arshkon (LinkedIn 2023-2024, postings.csv): title, company_name, location, description, min_salary,
  max_salary, med_salary, pay_period, original_listed_time (epoch ms), formatted_experience_level,
  remote_allowed, skills_desc. Convert salary to yearly (HOURLY x2080, MONTHLY x12, ...) and to INR.
- naukri (12,000 data-science jobs India): job_role, company, location, job_experience ("5-10 yrs"),
  skills/description. No salary/date: use a fixed scrape date.
Steps: map level -> (Fresher/Junior/Mid/Senior, exp_min, exp_max); normalise cities (Bangalore ->
Bengaluru, Gurgaon -> Delhi NCR, ...); map title -> one of the 12 roles with ordered regex rules
(else "Other", dropped unless --keep_other); extract canonical skills from skills text + description
using data/skills_master.csv aliases; drop rows with no known skills, rows without date and
duplicates; back up nothing, only write the output CSV with exactly the CareerIQ columns
(company_type and education = "Unknown"). Print row count, role counts, salary availability
and date range.
```

---

## PROMPT 6: Upgrade the skill extractor (NLP experiment)

```
Add an experiment comparing three skill extractors on my dataset (ground truth = `skills` column):
(1) keyword/alias regex baseline, (2) spaCy EntityRuler/PhraseMatcher + NER pipeline,
(3) Sentence-Transformers (all-MiniLM-L6-v2): embed every known skill name + aliases, split each
description into short phrases/n-grams, embed them, and accept a skill when cosine similarity > a
threshold tuned on a validation split.
Evaluate on a held-out test split with micro precision, recall and F1, and show examples where the
baseline fails (the "hard aliases" such as "sci-kit learn", "foundation models").
Output a markdown comparison table and a short conclusion. Put the code in notebooks/02_extraction.ipynb
and a reusable function in backend/engine.py (extract_skills_semantic).
```

---

## PROMPT 7: Extra features (add one at a time)

```
Extend CareerIQ with the feature below. Add the engine function, the FastAPI endpoint, and the
Next.js UI. Keep the style of the existing code.

A) PDF resume upload: POST /resume/upload (multipart PDF) -> text via pdfplumber -> skills.
   Frontend: file input that fills the textarea.
B) What-if simulator: POST /what-if {text, role, learn:[skills]} -> match score before/after adding
   those skills (using the same scoring as /recommend) and the improvement per skill.
C) Learning path: ordered list of missing skills by priority with a short reason each
   (demand %, growth pp, importance for the role).
D) Salary predictor: train the best regressor from run_pipeline.py at startup; POST /salary
   {role, experience, location, skills, company_type} -> expected range in LPA.
E) Career transition: for current role -> target role, list common vs missing skills and a
   difficulty label (Easy/Medium/Hard) based on overlap.
F) Job clusters page: show the K-Means clusters with dominant role and top skills.
```

---

## PROMPT 8: Evaluation, report and viva

```
Help me write the evaluation + report for CareerIQ.
1) Experiments to run and tabulate: skill extraction (keyword vs spaCy vs transformer: P/R/F1),
   salary models (Linear vs Random Forest vs Gradient Boosting: MAE/RMSE/R2),
   recommendation (Model A similarity only vs Model B market-aware: Precision@5, NDCG@5).
2) Research question: "Does incorporating job-market demand into resume-job matching improve
   personalised career recommendations and skill-gap identification?"
3) Honest limitations: synthetic data, circular experience-fit metric (needs 30-50 hand-labelled
   resume-job pairs), keyword extractor on synthetic text is easier than on real postings.
4) Write: abstract, problem statement, existing system vs proposed system (LinkedIn/Naukri job
   search, Lightcast labour-market analytics vs CareerIQ's student-focused explainable skill-gap
   + market-aware ranking), architecture description, results section templates, conclusion and
   future work.
5) Prepare 15 viva questions with short answers (why transformers, why cosine similarity, why not
   just ChatGPT, how are scores validated, biggest challenge, what is unique).
Unique-point answer: "Existing portals mostly search and apply. CareerIQ first learns what the market
demands and what is growing, compares it with a resume, gives a prioritized explainable skill gap,
and uses those market signals to rank jobs; we also measure whether market signals improve quality."
```

---

## Quick reference

| Item | Command |
|---|---|
| Create dataset | `python generate_dataset.py --n 12000 --seed 42` |
| Run ML pipeline | `python run_pipeline.py` |
| Start backend | `uvicorn backend.main:app --reload` then open `http://localhost:8000/docs` |
| Start frontend | `cd frontend && npm install && npm run dev` then open `http://localhost:3000` |
| Use real data | `python convert_real_data.py --source asaniczka --input raw/FILE.csv` |
