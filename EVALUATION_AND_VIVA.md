# CareerIQ: Evaluation, Project Report & Viva Guide

## 1. Project Overview & Abstract

### 1.1 Abstract
Traditional career portals (e.g., LinkedIn, Naukri, Indeed) primarily function as keyword-indexed search engines where candidates query job titles and apply directly. These systems treat job postings as static documents and candidate profiles as static keyword bags, ignoring dynamic macro-economic signals such as which skills are emerging, which are saturating, and how experience level interacts with role difficulty.

**CareerIQ** is a Market-Aware AI Career Intelligence Platform that bridges this gap. The platform continuously digests unstructured job postings, applies Natural Language Processing (NLP) to extract canonical competencies, measures dynamic quarterly skill velocity, models competitive compensation using ensemble regressors, and delivers personalized, explainable job recommendations. By combining text-based cosine similarity with market-weighted skill coverage and experience feasibility, CareerIQ ensures candidates focus their upskilling efforts on high-demand, high-growth technologies.

---

## 2. Research Question & Hypothesis

### Research Question:
> *"Does incorporating real-time job-market demand and skill growth rates into resume-job matching improve personalized career recommendations and skill-gap prioritization compared to pure lexical or semantic similarity?"*

### Experimental Findings:
1. **Prioritization Accuracy**: Pure similarity suggests missing skills based solely on document co-occurrence, often recommending deprecated tools (e.g., recommending *Hadoop* simply because it appears in a legacy posting). Market-aware weighting successfully downweights declining technologies (-0.05/yr) and elevates high-growth competencies (+0.16/yr for LLMs, +0.13/yr for RAG).
2. **Recommendation Relevancy**: Introducing market-weighted coverage ($\text{Precision}@5$) improves recommendation alignment with contemporary industry standards while maintaining high domain coherence ($>88\%$).

---

## 3. Existing System vs. Proposed System

| Dimension | Existing Portals (LinkedIn, Naukri, Monster) | Existing Analytics (Lightcast, Burning Glass) | CareerIQ (Proposed Platform) |
|---|---|---|---|
| **Target User** | Recruiters & Job Seekers (transactional application) | Enterprise HR & Policymakers | Students, Job Seekers, & Early-Career Engineers |
| **Matching Mechanism** | Keyword matching or standard embedding similarity | Aggregated labor statistics only | Hybrid: TF-IDF similarity + Market-weighted skill coverage + Experience feasibility |
| **Skill Gap Insights** | Binary check ("You match 4 of 7 skills") | Macro trend charts (not candidate-specific) | Prioritized, growth-adjusted skill gap with dynamic learning paths |
| **Explainability** | Black-box "Top Match" badge | N/A | Human-readable explanation per recommendation (matched skills, missing skills, market weight) |
| **Cost & Openness** | Commercial proprietary | Expensive corporate subscription | Open-source, transparent, reproducible pipeline |

---

## 4. Experimental Results & Comparative Evaluation

### 4.1 Skill Extraction NLP Comparison (Held-out Test Split: 3,000 Postings)
Evaluated against ground-truth labels across 57 canonical tech skills:

| Extractor Method | Micro-Precision | Micro-Recall | Micro-F1 | Latency / Doc | Memory Footprint |
|---|---|---|---|---|---|
| **Keyword / Regex Baseline** (Lookarounds + Aliases) | **0.984** | 0.941 | 0.962 | **0.12 ms** | **< 1 MB** |
| **spaCy PhraseMatcher** (Token-aware) | 0.978 | 0.938 | 0.957 | 1.85 ms | ~45 MB |
| **Semantic Hybrid** (Sentence-Transformers MiniLM) | 0.965 | **0.976** | **0.970** | 18.40 ms | ~120 MB |

*Analysis*: While the Semantic Transformer achieves highest recall by capturing informal variations (*"sci-kit learn"*, *"foundation models"*), the Regex Baseline delivers exceptional precision and is 150x faster, making it optimal for the production real-time API.

### 4.2 Salary Prediction Regressors (80/20 Train-Test Split)
Target: Annual compensation in LPA (Lakhs Per Annum, INR). Features: Experience, Role One-Hot, Location, Company Type, Work Mode, and 57 Skill Binary Indicators.

| Model | MAE (LPA) | RMSE (LPA) | $R^2$ Score | Notes |
|---|---|---|---|---|
| **Linear Regression** (OLS) | 2.14 | 2.78 | 0.742 | Fast baseline; struggles with non-linear skill interactions |
| **Ridge Regression** ($\alpha=1.0$) | 2.11 | 2.74 | 0.748 | Better stability with correlated skill indicators |
| **Random Forest** (200 trees) | 1.48 | 1.95 | 0.865 | Strong non-linear interactions; high memory usage |
| **HistGradientBoosting** *(Best)* | **1.32** | **1.76** | **0.887** | **Best balance of accuracy, generalization, and speed** |

### 4.3 Recommendation System: Baseline vs. Market-Aware Model
Evaluated on 40 standardized test resumes across diverse technical roles:

| Metric | Model A (Pure TF-IDF Cosine Similarity) | Model B (Market-Aware: $w_{\text{market}}=0.4$) | Relative Gain |
|---|---|---|---|
| **Precision@3** (Same Role Family) | 0.812 | **0.895** | **+10.2%** |
| **Precision@5** (Same Role Family) | 0.768 | **0.852** | **+10.9%** |
| **Strict Precision@5** (Family + Feasible Exp) | 0.645 | **0.793** | **+22.9%** |
| **Growth Skill Alignment** (% of recommended skills with $\Delta > 0$) | 54.3% | **82.7%** | **+52.3%** |

---

## 5. Honest Scientific Limitations (For Viva Defense)

1. **Synthetic Dataset Generation**:
   - The primary dataset consists of 12,000 synthetic job postings calibrated to Indian industry figures (Jan 2024–Oct 2026).
   - *Defense*: Explain that synthetic simulation provided controlled ground truth to objectively evaluate NLP extraction and market algorithms. Emphasize that the codebase contains `convert_real_data.py` to seamlessly ingest real Kaggle / LinkedIn datasets without changing a single line of backend logic.
2. **Circular Evaluation Risk in "Strict Precision"**:
   - The experience-fit penalty is used in both the recommendation ranking formula and the strict evaluation metric.
   - *Defense*: Transparently acknowledge this circularity in the viva. State that for rigorous real-world validation, an external human-annotated test set of 50+ resume-job pairs scored by recruitment specialists is the standard next phase.
3. **Keyword Density Bias in Free-Text Descriptions**:
   - Postings with extensive buzzword lists can artificially achieve high TF-IDF similarity.
   - *Mitigation*: Sublinear term frequency scaling and role-demand normalization were introduced to suppress repetitive keyword spam.

---

## 6. Top 15 Viva Questions & Crisp Answers

#### Q1: What is the core innovation of CareerIQ compared to standard job portals like LinkedIn or Naukri?
> **Answer**: Existing portals are transactional search engines that perform static text matching. CareerIQ extracts macro-market intelligence (demand percentage and quarterly skill velocity) and uses those signals dynamically in recommendation ranking, prioritizing high-growth skills and providing explainable gap insights.

#### Q2: Why did you use TF-IDF + Cosine Similarity instead of large Language Model embeddings (e.g., OpenAI, BERT) for job recommendation?
> **Answer**: TF-IDF provides deterministic, transparent, and computationally lightweight scoring with zero inference cost (<2ms). Crucially, TF-IDF weights can be directly decomposed to explain to the candidate exactly which keywords contributed to the match score, which black-box embeddings cannot provide.

#### Q3: How is the Skill Priority Score calculated?
> **Answer**: Priority balances current demand with forward-looking velocity:
> $$\text{Priority} = \text{Demand} \times \left(1 + \text{clip}(4 \times \text{Growth}, -0.5, 1.5)\right)$$
> If a skill has high demand and positive market momentum (e.g., Docker or LLMs), its priority is boosted. If demand is declining (e.g., Hadoop), its priority is suppressed.

#### Q4: Why is your dataset synthetic? Isn't real data better?
> **Answer**: Real web scrapes lack standardized ground-truth skill annotations, making objective precision/recall evaluation of NLP models impossible without expensive human labeling. Synthetic generation allowed us to calibrate real distributions (city multipliers, experience levels, growth rates) and embed ground-truth labels. Furthermore, our pipeline is data-agnostic—we wrote `convert_real_data.py` to ingest real Kaggle/LinkedIn data with zero architecture changes.

#### Q5: Which Machine Learning model performed best for salary prediction and why?
> **Answer**: `HistGradientBoostingRegressor` performed best ($R^2 = 0.887$, $\text{MAE} = 1.32$ LPA). Tree-based gradient boosting excels at capturing non-linear feature interactions between role seniority, metro city multipliers, and premium skill combinations that linear models fail to capture.

#### Q6: How does CareerIQ handle skills with multiple aliases (e.g., "K8s" vs. "Kubernetes")?
> **Answer**: We built an alias-to-canonical mapping in `skills_master.csv`. Regex patterns use negative lookbehinds and lookaheads, sorted by alias length descending, to avoid partial substring collisions (e.g., matching "C" inside "C++" or "Java" inside "JavaScript").

#### Q7: What is the purpose of the market weight parameter ($w_{\text{market}}$) in recommendation?
> **Answer**: It allows the user to balance personal resume alignment vs. broader market demands. At $w=0$, the system behaves purely like a traditional text search. At $w=0.4$–$0.6$, recommendations reward candidates whose profile aligns with high-demand, high-growth technologies in their target role.

#### Q8: What is "Circular Evaluation" in recommendation systems, and does your project have it?
> **Answer**: Circular evaluation occurs when an engineered heuristic (like our experience-fit penalty) is used both inside the ranking algorithm and as the ground-truth benchmark for success. In our project report, we transparently note this limitation and isolate the unpenalized role-family precision from the strict metric.

#### Q9: What happens if a candidate uploads an unstructured PDF resume?
> **Answer**: The backend uses `pdfplumber` via `POST /resume/upload` to extract clean textual tokens, cleans whitespaces, passes the text through our canonical NLP extractor, and displays both the recognized competencies and remaining gaps in the Next.js UI.

#### Q10: How do you track skill trends over time?
> **Answer**: Postings are bucketed by calendar quarter. For each quarter $Q_t$, the demand share of skill $S_i$ is computed. Trend velocity is calculated as the difference between recent rolling quarters and prior rolling quarters in percentage points.

#### Q11: What software architecture patterns did you implement?
> **Answer**: Clean separation of concerns:
> 1. Decoupled ML Engine (`backend/engine.py`) containing pure vectorized operations.
> 2. Asynchronous REST API (`backend/main.py`) powered by FastAPI and Pydantic validation.
> 3. Responsive, server-rendered frontend (`Next.js 16`) with CSS custom properties, zero heavy external charting dependencies, and sub-second page loads.

#### Q12: Why did you not use a database like MongoDB or PostgreSQL initially?
> **Answer**: For a self-contained demonstration with 12,000 records, in-memory pandas DataFrames and pre-computed NumPy matrices provide sub-millisecond retrieval latency without requiring external database servers or Docker containers. For production scale (millions of postings), PostgreSQL with `pgvector` would be the logical next step.

#### Q13: What is K-Means clustering doing in your pipeline?
> **Answer**: K-Means clusters the high-dimensional binary skill space across all jobs into natural technology archetypes (e.g., MLOps/Cloud cluster, GenAI/NLP cluster, Business Intelligence cluster), evaluated using Silhouette analysis ($k=4 \dots 10$).

#### Q14: Could an LLM (like GPT-4) replace your entire system?
> **Answer**: While an LLM can summarize text, relying entirely on commercial LLM APIs introduces high per-query financial costs, 2–5 second network latency, nondeterministic hallucination risks, and data privacy concerns with student resumes. CareerIQ runs locally in <200ms, is completely explainable, and costs $0 in ongoing API fees.

#### Q15: What is the biggest challenge you faced during development?
> **Answer**: Balancing precision and recall in NLP skill extraction. Short skill abbreviations like "R", "C", or "Go" frequently trigger false positives in English sentences. We solved this with rigorous regular expression lookarounds, token boundaries, and alias precedence rules.
