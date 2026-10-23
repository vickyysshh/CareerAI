"""
CareerIQ - synthetic job-market dataset generator.
Creates realistic Indian AI/Data job postings (2024-01 .. 2026-10) with:
  * time-varying skill demand (Docker/LLMs rising, Hadoop/TensorFlow falling)
  * role-specific skill profiles, salary model, city/company effects
  * messy real-world touches: skill aliases, missing salaries, duplicates
  * ground-truth `skills` labels so you can EVALUATE your NLP extractor

Run:  python generate_dataset.py --n 12000 --seed 42
"""
import argparse, random, numpy as np, pandas as pd
from pathlib import Path

# ---------------- skills: name -> (category, aliases, growth per year) ----------------
SKILLS = {
 "Python": ("Programming", [], 0.02), "SQL": ("Database", [], 0.0),
 "Java": ("Programming", [], -0.01), "C++": ("Programming", [], 0.0),
 "JavaScript": ("Programming", ["JS"], 0.01), "TypeScript": ("Programming", [], 0.03),
 "Excel": ("Analytics", ["MS Excel", "Advanced Excel"], -0.02),
 "Power BI": ("Analytics", ["PowerBI"], 0.02), "Tableau": ("Analytics", [], 0.0),
 "Statistics": ("ML", [], 0.0), "Machine Learning": ("ML", ["ML"], 0.01),
 "Deep Learning": ("ML", ["DL"], 0.02), "NLP": ("ML", ["Natural Language Processing"], 0.03),
 "Computer Vision": ("ML", ["CV"], 0.0), "scikit-learn": ("ML", ["sklearn", "Scikit-learn"], 0.0),
 "Pandas": ("ML", [], 0.0), "NumPy": ("ML", [], 0.0),
 "TensorFlow": ("DL Framework", [], -0.04), "PyTorch": ("DL Framework", [], 0.05),
 "Keras": ("DL Framework", [], -0.03), "XGBoost": ("ML", [], 0.0),
 "Hugging Face": ("GenAI", ["HuggingFace", "Transformers"], 0.07),
 "LLMs": ("GenAI", ["Large Language Models", "LLM"], 0.16),
 "LangChain": ("GenAI", [], 0.13), "RAG": ("GenAI", ["Retrieval Augmented Generation"], 0.13),
 "Prompt Engineering": ("GenAI", [], 0.08), "Generative AI": ("GenAI", ["GenAI"], 0.13),
 "Vector Databases": ("GenAI", ["Vector DB", "Pinecone", "FAISS"], 0.08),
 "OpenCV": ("ML", [], 0.0), "Spark": ("Big Data", ["PySpark", "Apache Spark"], 0.01),
 "Hadoop": ("Big Data", [], -0.05), "Airflow": ("Data Eng", ["Apache Airflow"], 0.03),
 "Kafka": ("Data Eng", ["Apache Kafka"], 0.02), "dbt": ("Data Eng", [], 0.04),
 "Snowflake": ("Data Eng", [], 0.04), "Docker": ("DevOps", [], 0.08),
 "Kubernetes": ("DevOps", ["K8s"], 0.05), "AWS": ("Cloud", ["Amazon Web Services"], 0.04),
 "Azure": ("Cloud", ["Microsoft Azure"], 0.03), "GCP": ("Cloud", ["Google Cloud"], 0.02),
 "MLflow": ("MLOps", [], 0.06), "CI/CD": ("DevOps", ["CICD"], 0.03),
 "Git": ("Tools", ["GitHub"], 0.0), "Terraform": ("DevOps", [], 0.03),
 "FastAPI": ("Backend", [], 0.05), "Flask": ("Backend", [], -0.01),
 "Django": ("Backend", [], 0.0), "REST APIs": ("Backend", ["RESTful APIs", "REST API"], 0.01),
 "PostgreSQL": ("Database", ["Postgres"], 0.02), "MongoDB": ("Database", [], 0.0),
 "Linux": ("Tools", [], 0.0), "Data Visualization": ("Analytics", [], 0.01),
 "A/B Testing": ("Analytics", ["AB Testing"], 0.02), "Feature Engineering": ("ML", [], 0.0),
 "Time Series": ("ML", ["Time Series Forecasting"], 0.01), "React": ("Frontend", ["React.js"], 0.0),
 "Node.js": ("Backend", ["NodeJS"], 0.0),
}
# aliases the baseline extractor will NOT know (lets a transformer beat keyword matching)
HARD_ALIASES = {"scikit-learn": "sci-kit learn", "TensorFlow": "Tensor Flow", "PyTorch": "Py-Torch",
                "Kubernetes": "kube orchestration", "Machine Learning": "statistical learning models",
                "LLMs": "foundation models", "Docker": "containerisation (Docker-like)", "AWS": "EC2/S3 stack"}

# ---------------- roles: base salary (LPA at ~2y exp), skill probabilities ----------------
ROLES = {
 "Machine Learning Engineer": (14, 0.16, {"Python":.97,"Machine Learning":.9,"Deep Learning":.55,"scikit-learn":.55,"PyTorch":.45,"TensorFlow":.4,"Docker":.45,"AWS":.45,"SQL":.55,"Git":.6,"MLflow":.22,"Pandas":.5,"NumPy":.4,"Kubernetes":.2,"FastAPI":.2,"Feature Engineering":.3,"NLP":.2,"Computer Vision":.15,"CI/CD":.2,"Linux":.25}),
 "Data Scientist": (13, 0.17, {"Python":.95,"SQL":.85,"Statistics":.7,"Machine Learning":.85,"Pandas":.65,"NumPy":.5,"scikit-learn":.6,"Data Visualization":.45,"A/B Testing":.3,"Tableau":.2,"Power BI":.15,"Feature Engineering":.35,"XGBoost":.3,"Time Series":.2,"NLP":.15,"AWS":.2,"Git":.4,"Deep Learning":.3,"TensorFlow":.15,"PyTorch":.2}),
 "Data Analyst": (7, 0.14, {"SQL":.95,"Excel":.8,"Python":.55,"Power BI":.5,"Tableau":.4,"Statistics":.4,"Data Visualization":.55,"Pandas":.35,"A/B Testing":.12,"PostgreSQL":.15,"Snowflake":.1,"Git":.1}),
 "AI Engineer": (16, 0.2, {"Python":.95,"LLMs":.45,"Generative AI":.4,"Deep Learning":.55,"PyTorch":.5,"TensorFlow":.3,"Hugging Face":.35,"LangChain":.3,"RAG":.3,"Prompt Engineering":.25,"Vector Databases":.2,"Docker":.4,"AWS":.4,"FastAPI":.3,"NLP":.4,"Machine Learning":.6,"Git":.5,"Azure":.2,"GCP":.15}),
 "MLOps Engineer": (16, 0.15, {"Python":.9,"Docker":.85,"Kubernetes":.65,"MLflow":.6,"AWS":.65,"CI/CD":.7,"Terraform":.35,"Git":.7,"Linux":.55,"Airflow":.3,"Azure":.25,"GCP":.25,"FastAPI":.3,"Machine Learning":.6,"SQL":.3}),
 "NLP Engineer": (15, 0.18, {"Python":.97,"NLP":.95,"Deep Learning":.6,"PyTorch":.55,"Hugging Face":.5,"LLMs":.4,"TensorFlow":.3,"Machine Learning":.6,"scikit-learn":.35,"SQL":.3,"Docker":.3,"RAG":.2,"Git":.4,"FastAPI":.2}),
 "Computer Vision Engineer": (15, 0.17, {"Python":.95,"Computer Vision":.95,"OpenCV":.75,"Deep Learning":.8,"PyTorch":.55,"TensorFlow":.5,"C++":.35,"Docker":.3,"NumPy":.5,"Linux":.35,"Git":.4,"AWS":.2,"Keras":.25}),
 "Data Engineer": (12, 0.16, {"SQL":.95,"Python":.85,"Spark":.6,"Airflow":.5,"Kafka":.3,"AWS":.55,"Snowflake":.3,"dbt":.2,"Hadoop":.2,"Docker":.3,"Azure":.3,"GCP":.25,"PostgreSQL":.3,"Git":.4,"Linux":.35,"Kubernetes":.12,"CI/CD":.2}),
 "Business Analyst": (8, 0.13, {"SQL":.7,"Excel":.85,"Power BI":.5,"Tableau":.35,"Data Visualization":.4,"Statistics":.2,"Python":.25,"A/B Testing":.1}),
 "Python Backend Developer": (10, 0.15, {"Python":.98,"FastAPI":.35,"Django":.4,"Flask":.35,"REST APIs":.8,"PostgreSQL":.55,"SQL":.6,"Docker":.5,"Git":.8,"AWS":.4,"MongoDB":.25,"Linux":.3,"CI/CD":.3,"Kubernetes":.12}),
 "Full Stack Developer": (9, 0.15, {"JavaScript":.8,"React":.65,"Node.js":.55,"TypeScript":.4,"REST APIs":.6,"MongoDB":.35,"SQL":.4,"PostgreSQL":.25,"Git":.7,"Docker":.3,"AWS":.25,"Python":.2,"Java":.15}),
 "Data Science Intern / Fresher": (4.5, 0.05, {"Python":.9,"SQL":.6,"Machine Learning":.7,"Pandas":.6,"Statistics":.5,"NumPy":.5,"scikit-learn":.5,"Data Visualization":.3,"Excel":.3,"Git":.3}),
}
ROLE_W = [14, 14, 14, 10, 6, 6, 5, 11, 8, 6, 4, 4]
TITLE_VARIANTS = {
 "Machine Learning Engineer": ["Machine Learning Engineer", "ML Engineer", "Machine Learning Developer"],
 "Data Scientist": ["Data Scientist", "Data Scientist - Analytics", "Applied Data Scientist"],
 "Data Analyst": ["Data Analyst", "Business Data Analyst", "Analytics Associate"],
 "AI Engineer": ["AI Engineer", "Artificial Intelligence Engineer", "GenAI Engineer"],
 "MLOps Engineer": ["MLOps Engineer", "ML Platform Engineer", "ML Infrastructure Engineer"],
 "NLP Engineer": ["NLP Engineer", "NLP Data Scientist", "Language AI Engineer"],
 "Computer Vision Engineer": ["Computer Vision Engineer", "CV Engineer", "Vision AI Engineer"],
 "Data Engineer": ["Data Engineer", "Big Data Engineer", "ETL Data Engineer"],
 "Business Analyst": ["Business Analyst", "Product Analyst", "Reporting Analyst"],
 "Python Backend Developer": ["Python Backend Developer", "Backend Engineer (Python)", "Python Developer"],
 "Full Stack Developer": ["Full Stack Developer", "Full Stack Engineer", "MERN Stack Developer"],
 "Data Science Intern / Fresher": ["Data Science Intern", "Junior Data Scientist", "Graduate Data Analyst Trainee"],
}
ROLE_FAMILY = {  # used for recommendation evaluation
 "Machine Learning Engineer":"ML/AI","AI Engineer":"ML/AI","NLP Engineer":"ML/AI","Computer Vision Engineer":"ML/AI","MLOps Engineer":"ML/AI",
 "Data Scientist":"Data Science","Data Science Intern / Fresher":"Data Science","Data Analyst":"Analytics","Business Analyst":"Analytics",
 "Data Engineer":"Data Eng","Python Backend Developer":"Software","Full Stack Developer":"Software"}

CITIES = {"Bengaluru":(1.18,26),"Hyderabad":(1.05,16),"Pune":(0.98,12),"Delhi NCR":(1.06,18),"Mumbai":(1.08,9),
          "Chennai":(0.96,7),"Noida":(1.0,5),"Kolkata":(0.86,2),"Ahmedabad":(0.85,2),"Remote":(1.02,3)}
COMP_TYPES = {"Startup":(0.95,30),"Product MNC":(1.25,15),"IT Services":(0.82,25),"Mid-size Tech":(1.0,20),"Unicorn":(1.35,5),"Consulting":(1.05,5)}
COMPANY_NAMES = ["Nexora","Datavista","Brightlogic","Quantiva","Infynex","Cloudmatrix","Zenalytics","Orbitek","Pixelmind","Vectorly",
 "Techmantra","Altura Systems","Bluepeak","Synaptiq","Kiteworks India","Mindforge","Cortexa","Lumina Labs","Ardent AI","Skyline Digital",
 "Neuralis","Finlytics","Healthnova","Retailiq","Logisync","Edunext Tech","Paygrid","Agrosense","Motivex","Trucklytics","Cybernest","Insightly India"]
EDU = [("B.Tech",62),("M.Tech",14),("MCA",8),("B.Sc",7),("M.Sc",6),("MBA",3)]
LEVELS = {"Fresher":(0,1,25),"Junior":(1,3,35),"Mid":(3,6,25),"Senior":(6,10,15)}
SKILL_BONUS = {"LLMs":1.8,"Generative AI":1.2,"Kubernetes":0.9,"MLflow":0.6,"Spark":0.7,"AWS":0.5,"Terraform":0.6,"PyTorch":0.5,"RAG":0.9,"Snowflake":0.5}
START, END = pd.Timestamp("2024-01-01"), pd.Timestamp("2026-10-15")
SPAN_Y = (END - START).days / 365.25

INTROS = ["We are hiring a {t} to join our {team} team.", "{c} is looking for an experienced {t}.",
          "Join {c} as a {t} and work on high-impact products.", "Exciting opportunity for a {t} in our growing {team} group."]
RESP = ["Design, build and deploy data-driven solutions.", "Collaborate with product and engineering teams.",
        "Analyse large datasets to generate actionable insights.", "Own the end-to-end lifecycle of models and pipelines.",
        "Write clean, tested and well-documented code.", "Present findings to business stakeholders."]
SKILL_SENT = ["Required skills: {s}.", "You should have hands-on experience with {s}.", "Must have: {s}.",
              "Our stack includes {s}.", "Strong working knowledge of {s} is expected.", "Technical skills: {s}."]
OUTROS = ["Excellent communication skills.", "Immediate joiners preferred.", "Competitive salary and ESOPs.",
          "Flexible working hours.", "Good problem-solving ability.", "Health insurance and learning budget."]

def wchoice(rng, items):
    names, w = zip(*[(k, v) for k, v in items]); return rng.choices(names, weights=w, k=1)[0]

def skill_prob(skill, base, t_years):
    g = SKILLS[skill][2]
    return float(np.clip(base + g * (t_years - SPAN_Y / 2), 0.01, 0.97))

def render_skill(rng, s):
    r = rng.random()
    if r < 0.05 and s in HARD_ALIASES: return HARD_ALIASES[s]
    if r < 0.40 and SKILLS[s][1]: return rng.choice(SKILLS[s][1])
    return s

def make_job(rng, nrng, i):
    role = rng.choices(list(ROLES), weights=ROLE_W, k=1)[0]
    base_sal, _, prof = ROLES[role]
    level = "Fresher" if role.startswith("Data Science Intern") else wchoice(rng, [(k, v[2]) for k, v in LEVELS.items()])
    lo, hi, _ = LEVELS[level]
    exp_min = lo if level != "Fresher" else 0
    exp_max = hi + rng.choice([0, 1, 2]) if level != "Fresher" else 1
    exp_mid = (exp_min + exp_max) / 2
    date = START + pd.Timedelta(days=int(nrng.uniform(0, (END - START).days)))
    t_years = (date - START).days / 365.25
    skills = [s for s, p in prof.items() if rng.random() < skill_prob(s, p, t_years)]
    for s in rng.sample(list(SKILLS), 2):                          # tiny "nice-to-have" noise
        if rng.random() < 0.25 and s not in skills: skills.append(s)
    if len(skills) < 3: skills = list(set(skills + ["Python", "SQL", "Git"]))
    rng.shuffle(skills)
    city = wchoice(rng, [(k, v[1]) for k, v in CITIES.items()])
    ctype = wchoice(rng, [(k, v[1]) for k, v in COMP_TYPES.items()])
    company = rng.choice(COMPANY_NAMES)
    edu = wchoice(rng, EDU)
    mode = "Remote" if city == "Remote" else rng.choices(["On-site", "Hybrid"], weights=[0.55, 0.45])[0]
    sal = base_sal * (0.72 + 0.12 * exp_mid) * CITIES[city][0] * COMP_TYPES[ctype][0]
    sal += sum(SKILL_BONUS.get(s, 0) for s in skills) * (0.6 + 0.1 * exp_mid)
    sal *= (1 + 0.05 * (t_years - SPAN_Y / 2))                    # mild wage inflation
    sal = max(2.4, sal * float(nrng.normal(1, 0.09)))
    smin, smax = round(sal * 0.88 * 1e5, -4), round(sal * 1.15 * 1e5, -4)
    title = rng.choice(TITLE_VARIANTS[role])
    if level == "Senior": title = rng.choice(["Senior ", "Lead ", "Sr. "]) + title
    if level == "Junior" and rng.random() < .3: title = "Associate " + title
    desc_sk = [render_skill(rng, s) for s in skills]
    k = rng.randint(2, 3); chunks = [desc_sk[j::k] for j in range(k)]
    team = rng.choice(["AI", "Data", "Analytics", "Platform", "Research", "Product"])
    desc = [rng.choice(INTROS).format(t=title, c=company, team=team)]
    desc += rng.sample(RESP, 2)
    desc += [rng.choice(SKILL_SENT).format(s=", ".join(c)) for c in chunks if c]
    desc.append(f"Experience: {exp_min}-{exp_max} years. Education: {edu}")
    desc += rng.sample(OUTROS, 2)
    return dict(job_id=f"J{i:05d}", title=title, role=role, role_family=ROLE_FAMILY[role], company=company,
                company_type=ctype, location=city, work_mode=mode, experience_level=level,
                exp_min=exp_min, exp_max=exp_max, education=edu, salary_min=smin, salary_max=smax,
                date_posted=date.date().isoformat(), description=" ".join(desc), skills="|".join(sorted(skills)))

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--n", type=int, default=12000); ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--out", default="data"); a = ap.parse_args()
    rng, nrng = random.Random(a.seed), np.random.default_rng(a.seed)
    Path(a.out).mkdir(exist_ok=True)
    df = pd.DataFrame([make_job(rng, nrng, i + 1) for i in range(a.n)])
    # ---- realistic mess ----
    miss = nrng.random(len(df)) < 0.10; df.loc[miss, ["salary_min", "salary_max"]] = np.nan
    dup = df.sample(frac=0.01, random_state=a.seed).copy(); dup["job_id"] = [f"J{a.n+i+1:05d}" for i in range(len(dup))]
    df = pd.concat([df, dup]).sort_values("date_posted").reset_index(drop=True)
    df.to_csv(f"{a.out}/jobs_dataset.csv", index=False)
    pd.DataFrame([(k, v[0], "|".join(v[1]), v[2]) for k, v in SKILLS.items()],
                 columns=["skill", "category", "aliases", "yearly_growth"]).to_csv(f"{a.out}/skills_master.csv", index=False)
    # ---- sample resumes with true skills + target role (for gap / recommendation tests) ----
    res = []
    for r in range(40):
        role = rng.choice(list(ROLES)[:10]); prof = ROLES[role][2]
        have = [s for s, p in prof.items() if rng.random() < p * 0.7]
        have += rng.sample([s for s in SKILLS if s not in have], 2)
        yrs = rng.choice([0, 1, 1, 2, 2, 3, 4, 5])
        txt = (f"{rng.choice(['Aspiring','Motivated','Hands-on'])} professional with {yrs} years of experience. "
               f"Projects and skills: {', '.join(render_skill(rng, s) if rng.random() < .3 else s for s in have)}. "
               f"B.Tech in Computer Science. Interested in {role} roles.")
        res.append(dict(resume_id=f"R{r+1:03d}", target_role=role, target_family=ROLE_FAMILY[role],
                        years_exp=yrs, resume_text=txt, true_skills="|".join(sorted(have))))
    pd.DataFrame(res).to_csv(f"{a.out}/sample_resumes.csv", index=False)
    print(f"jobs_dataset.csv: {len(df)} rows | skills_master.csv: {len(SKILLS)} skills | sample_resumes.csv: {len(res)} resumes")

if __name__ == "__main__":
    main()
