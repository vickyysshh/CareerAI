"""
CareerIQ — Data Pipeline & EDA (run_pipeline.py)

Generates cleaned data, EDA charts, skill extraction evaluation,
market trends, and recommendation evaluation.

Usage: python run_pipeline.py
Output: outputs/charts/ and outputs/evaluation/
"""

import re
import logging
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("careeriq.pipeline")

BASE = Path(__file__).resolve().parent
DATA = BASE / "data"
OUT = BASE / "outputs"
CHARTS = OUT / "charts"
EVAL = OUT / "evaluation"

for d in [CHARTS, EVAL]:
    d.mkdir(parents=True, exist_ok=True)


def header(title):
    print("\n" + "=" * 70 + f"\n{title}\n" + "=" * 70)


# ------------------------------------------------------------------ LOAD + CLEAN
header("1. DATA LOADING AND CLEANING")
df_raw = pd.read_csv(DATA / "jobs_dataset.csv", parse_dates=["date_posted"])
logger.info(f"Raw rows: {len(df_raw)} | Missing salary: {df_raw.salary_min.isna().sum()}")

# Remove duplicates
df = df_raw.drop_duplicates(subset=["title", "company", "location", "description"]).reset_index(drop=True)
logger.info(f"After deduplication: {len(df)} rows ({len(df_raw)-len(df)} removed)")

# Derived columns
df["salary_mid_lpa"] = (df["salary_min"] + df["salary_max"]) / 2 / 1e5
df["exp_mid"] = (df["exp_min"] + df["exp_max"]) / 2
df["quarter"] = df["date_posted"].dt.to_period("Q").astype(str)
df["skill_list"] = df["skills"].fillna("").str.split("|")

# Save cleaned dataset
df.to_csv(DATA / "jobs_clean.csv", index=False)
logger.info(f"Cleaned dataset saved: {DATA/'jobs_clean.csv'}")

# ------------------------------------------------------------------ SKILLS MASTER
sm = pd.read_csv(DATA / "skills_master.csv").fillna("")
skill_names = list(sm["skill"])

# ------------------------------------------------------------------ EDA
header("2. EXPLORATORY DATA ANALYSIS")

all_sk = df["skill_list"].explode()
top15 = (all_sk.value_counts() / len(df) * 100).head(15)
print("Top 15 skills (% of postings):\n", top15.round(1).to_string())

role_counts = df["role"].value_counts()
loc_counts = df["location"].value_counts()
exp_counts = df["experience_level"].value_counts()

print("\nJobs by role:\n", role_counts.to_string())
print("\nJobs by location:\n", loc_counts.to_string())
print("\nExperience level distribution:\n", exp_counts.to_string())
print(f"\nSalary available: {df.salary_mid_lpa.notna().sum()} / {len(df)} rows")
print(f"Salary range: {df.salary_mid_lpa.min():.1f} – {df.salary_mid_lpa.max():.1f} LPA")

# Plot 1: Overview (2x2)
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle("CareerIQ — Market Overview (Synthetic Dataset)", fontsize=14, y=1.01)

top15[::-1].plot.barh(ax=axes[0, 0], color="#9B75FF")
axes[0, 0].set_title("Top 15 Skills (% of postings)")
axes[0, 0].set_xlabel("% of job postings")

role_counts[::-1].plot.barh(ax=axes[0, 1], color="#6E45D8")
axes[0, 1].set_title("Job Postings by Role")
axes[0, 1].set_xlabel("Number of postings")

loc_counts[::-1].plot.barh(ax=axes[1, 0], color="#4FC3F7")
axes[1, 0].set_title("Job Postings by City")
axes[1, 0].set_xlabel("Number of postings")

sal = df["salary_mid_lpa"].dropna()
axes[1, 1].hist(sal, bins=40, color="#9B75FF", edgecolor="white", alpha=0.85)
axes[1, 1].set_title(f"Salary Distribution (n={len(sal)})")
axes[1, 1].set_xlabel("Salary (LPA)")
axes[1, 1].set_ylabel("Count")

plt.tight_layout()
plt.savefig(CHARTS / "01_eda_overview.png", dpi=110, bbox_inches="tight")
plt.close()
logger.info(f"Saved: {CHARTS/'01_eda_overview.png'}")

# Plot 2: Skill demand by role (heatmap-style)
fig, ax = plt.subplots(figsize=(16, 8))
top_skills_for_heatmap = list(top15.index[:12])
role_skill_matrix = pd.DataFrame({
    role: df[df["role"] == role]["skill_list"].explode().value_counts().reindex(top_skills_for_heatmap, fill_value=0) /
           (df["role"] == role).sum() * 100
    for role in role_counts.index[:8]
})
im = ax.imshow(role_skill_matrix.T.values, aspect="auto", cmap="Purples", vmin=0, vmax=100)
plt.colorbar(im, ax=ax, label="% of role's postings")
ax.set_xticks(range(len(top_skills_for_heatmap)))
ax.set_xticklabels(top_skills_for_heatmap, rotation=45, ha="right")
ax.set_yticks(range(len(role_skill_matrix.columns)))
ax.set_yticklabels(list(role_skill_matrix.columns), fontsize=9)
ax.set_title("Skill Demand by Role (% of postings) — Synthetic Dataset", fontsize=13)
plt.tight_layout()
plt.savefig(CHARTS / "02_skill_by_role_heatmap.png", dpi=110, bbox_inches="tight")
plt.close()
logger.info(f"Saved: {CHARTS/'02_skill_by_role_heatmap.png'}")

# ------------------------------------------------------------------ SKILL TRENDS
header("3. MARKET TREND ANALYSIS")
Xs = pd.DataFrame({s: df["skill_list"].apply(lambda l, sk=s: sk in l) for s in skill_names})
Xs["quarter"] = df["quarter"]
trend = Xs.groupby("quarter").mean() * 100

growth = (trend.iloc[-3:].mean() - trend.iloc[:3].mean()).sort_values()
print("Fastest RISING skills (pp change, first 3 vs last 3 quarters):")
print(growth.tail(6).round(1).to_string())
print("\nFastest FALLING skills:")
print(growth.head(4).round(1).to_string())
print("\nNOTE: Trends reflect injected SYNTHETIC growth rates, not real market observations.")

top_rising = list(growth.tail(5).index)
top_falling = list(growth.head(2).index)
plot_skills = top_rising + top_falling

colors_palette = ["#9B75FF", "#6E45D8", "#4FC3F7", "#F48FB1", "#81C784", "#FFD54F", "#FF8A65"]
fig, ax = plt.subplots(figsize=(12, 6))
for i, sk in enumerate(plot_skills):
    if sk in trend.columns:
        ax.plot(trend.index, trend[sk], marker="o", markersize=4,
                label=sk, color=colors_palette[i % len(colors_palette)])

ax.set_title("Skill Demand Over Time — SYNTHETIC growth rates\n(not real market data)", fontsize=12)
ax.set_ylabel("% of postings")
ax.set_xlabel("Quarter")
ax.legend(loc="upper left", fontsize=8)
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig(CHARTS / "03_skill_trends.png", dpi=110, bbox_inches="tight")
plt.close()
logger.info(f"Saved: {CHARTS/'03_skill_trends.png'}")

# ------------------------------------------------------------------ SKILL EXTRACTION
header("4. SKILL EXTRACTION EVALUATION (Keyword Baseline)")

alias2skill = {}
for _, r in sm.iterrows():
    alias2skill[r["skill"].lower()] = r["skill"]
    for a in filter(None, str(r.get("aliases", "") or "").split("|")):
        alias2skill[a.strip().lower()] = r["skill"]

sorted_aliases = sorted(alias2skill.keys(), key=len, reverse=True)
pattern = re.compile(
    r"(?<![A-Za-z0-9+#.])(" + "|".join(re.escape(a) for a in sorted_aliases) + r")(?![A-Za-z0-9+#])",
    re.IGNORECASE
)

def extract_skills(text):
    return sorted({alias2skill[m.group(1).lower()] for m in pattern.finditer(text)})

# Evaluate on sample (against ground-truth skills column)
sample = df.sample(min(3000, len(df)), random_state=1)
tp = fp = fn = 0
for text, truth in zip(sample["description"], sample["skill_list"]):
    pred, truth_set = set(extract_skills(text)), set(truth)
    tp += len(pred & truth_set)
    fp += len(pred - truth_set)
    fn += len(truth_set - pred)

P = tp / (tp + fp) if (tp + fp) > 0 else 0
R = tp / (tp + fn) if (tp + fn) > 0 else 0
F1 = 2 * P * R / (P + R) if (P + R) > 0 else 0

print(f"Keyword baseline — Precision: {P:.3f} | Recall: {R:.3f} | F1: {F1:.3f}")
print("NOTE: These metrics are OPTIMISTIC — ground-truth was generated from the same skill list used for extraction.")
print("  Recall < 1 because some job descriptions use unusual wording (aliases) not in the skills master.")

# Show examples of false negatives (skills the extractor missed)
false_negatives_examples = []
for text, truth in zip(sample["description"].head(200), sample["skill_list"].head(200)):
    pred = set(extract_skills(text))
    truth_set = set(truth)
    fn_skills = truth_set - pred
    if fn_skills:
        false_negatives_examples.append((text[:80], list(fn_skills)))

if false_negatives_examples:
    print("\nExample False Negatives (missed skills):")
    for ex_text, missed in false_negatives_examples[:3]:
        print(f"  Text: '{ex_text}...'")
        print(f"  Missed skills: {missed}")

# Save metrics
eval_results = pd.DataFrame([{
    "method": "Keyword Regex Baseline",
    "precision": round(P, 3),
    "recall": round(R, 3),
    "f1": round(F1, 3),
    "evaluation_note": "CIRCULAR — ground-truth and extraction share the same skill list",
}])
eval_results.to_csv(EVAL / "skill_extraction_results.csv", index=False)
logger.info(f"Saved: {EVAL/'skill_extraction_results.csv'}")

# ------------------------------------------------------------------ RECOMMENDATION EVALUATION
header("5. RECOMMENDATION EVALUATION (Baseline vs Market-Aware)")

res_df = pd.read_csv(DATA / "sample_resumes.csv")

recent_cut = df["date_posted"].max() - pd.Timedelta(days=180)
recent = df[df["date_posted"] > recent_cut]

def demand(frame, role):
    f = frame[frame["role"] == role]
    return pd.Series({s: f["skill_list"].apply(lambda l: s in l).mean() for s in skill_names})

role_dem = {r: demand(recent, r) for r in df["role"].unique()}

# Fit TF-IDF
pool = recent.reset_index(drop=True)
tf = TfidfVectorizer(tokenizer=lambda s: s.split("|"), lowercase=False, token_pattern=None)
J = tf.fit_transform(pool["skills"])

def mkt_score(user_set, row):
    d = role_dem[row.role]
    js = row.skill_list
    w = sum(d.get(s, 0) for s in js)
    return sum(d.get(s, 0) for s in js if s in user_set) / w if w else 0

def recommend(resume, k=5, w_market=0.0):
    us_ = extract_skills(resume.resume_text)
    u = tf.transform(["|".join(us_)])
    sim = cosine_similarity(u, J).ravel()
    exp_fit = np.where(pool.exp_min.values <= resume.years_exp + 1, 1.0, 0.4)
    mk = np.array([mkt_score(set(us_), r) for r in pool.itertuples()])
    score = (1 - w_market) * sim + w_market * (0.6 * mk + 0.4 * exp_fit)
    return pool.assign(score=score).nlargest(k, "score")

def p_at_k(w, k=5):
    return np.mean([
        (recommend(r, k, w)["role_family"] == r.target_family).mean()
        for r in res_df.itertuples()
    ])

print(f"\n{'Model':<38}{'P@5 (role family)'}")
rec_eval_rows = []
for name, w in [("A: Baseline (similarity only)", 0.0), ("B: Market-Aware (w=0.4)", 0.4)]:
    p5 = p_at_k(w)
    print(f"  {name:<36}  {p5:.3f}")
    rec_eval_rows.append({"model": name, "w_market": w, "precision_at_5": round(p5, 3)})

pd.DataFrame(rec_eval_rows).to_csv(EVAL / "recommendation_results.csv", index=False)
logger.info(f"Saved: {EVAL/'recommendation_results.csv'}")
print("\nNOTE: Evaluation uses target_family as relevance label (same synthetic universe as dataset).")

# ------------------------------------------------------------------ SUMMARY
header("PIPELINE COMPLETE")
print(f"Dataset: {len(df)} clean job postings (SYNTHETIC)")
print(f"Skills: {len(sm)} canonical skills")
print(f"Resumes: {len(res_df)} sample resumes")
print(f"Skill extraction F1: {F1:.3f} (optimistic — circular evaluation)")
print(f"Charts saved to: {CHARTS}")
print(f"Evaluation saved to: {EVAL}")
