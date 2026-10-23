"""
CareerIQ — Model Training Script (train_models.py)

Trains the salary prediction model and saves artifacts to models/.
Run this script locally OR upload to Google Colab.

Usage:
    python train_models.py

Output:
    models/salary_model.joblib      (best fitted pipeline)
    models/model_manifest.json      (metadata + actual metrics)
    outputs/evaluation/salary_results.csv
    outputs/charts/salary_predictions.png

NOTE: All models are trained on SYNTHETIC data.
      Label output as "Demonstration Estimate" in the UI.
"""

import json
import logging
from datetime import datetime
from pathlib import Path

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("careeriq.train")

BASE = Path(__file__).resolve().parent
DATA = BASE / "data"
MODELS = BASE / "models"
OUTPUTS = BASE / "outputs"
CHARTS = OUTPUTS / "charts"
EVAL = OUTPUTS / "evaluation"

for d in [MODELS, CHARTS, EVAL]:
    d.mkdir(parents=True, exist_ok=True)


def load_data():
    """Load and clean the jobs dataset."""
    logger.info("Loading dataset …")
    df = pd.read_csv(DATA / "jobs_dataset.csv", parse_dates=["date_posted"])
    df = df.drop_duplicates(subset=["title", "company", "location", "description"])
    df["salary_mid_lpa"] = (df["salary_min"] + df["salary_max"]) / 2 / 1e5
    df["exp_mid"] = (df["exp_min"] + df["exp_max"]) / 2
    df["skill_list"] = df["skills"].fillna("").str.split("|")
    logger.info(f"Loaded: {len(df)} clean rows")
    return df


def load_skills():
    """Load skills master."""
    return pd.read_csv(DATA / "skills_master.csv").fillna("")


def build_features(df: pd.DataFrame, skills_df: pd.DataFrame) -> tuple:
    """
    Build feature matrix for salary prediction.
    Avoids target leakage (salary columns not included in X).
    """
    all_skills = list(skills_df["skill"])

    sal = df.dropna(subset=["salary_mid_lpa"]).copy()
    logger.info(f"Salary-available rows: {len(sal)} ({len(sal)/len(df)*100:.1f}%)")

    # Skill one-hot columns
    skill_cols = {
        f"sk_{s}": sal["skill_list"].apply(lambda lst, sk=s: int(sk in lst))
        for s in all_skills
    }
    Xsk = pd.DataFrame(skill_cols, index=sal.index)
    Xsk["n_skills"] = sal["skill_list"].apply(len)

    # Categorical + numeric features
    cat_cols = ["role", "location", "company_type", "work_mode"]
    Xcat = sal[cat_cols]
    Xnum = sal[["exp_mid"]].copy()

    X = pd.concat([Xnum, Xsk, Xcat], axis=1)
    y = sal["salary_mid_lpa"]

    return X, y, all_skills, cat_cols


def evaluate_model(model, Xte, yte):
    """Return evaluation metrics dict."""
    preds = model.predict(Xte)
    mae = mean_absolute_error(yte, preds)
    rmse = mean_squared_error(yte, preds) ** 0.5
    r2 = r2_score(yte, preds)
    return {"MAE_LPA": round(mae, 3), "RMSE_LPA": round(rmse, 3), "R2": round(r2, 4)}, preds


def train_salary_model():
    """
    Train and compare multiple salary prediction models.
    Saves the best model to models/salary_model.joblib.
    """
    df = load_data()
    skills_df = load_skills()

    X, y, all_skills, cat_cols = build_features(df, skills_df)

    # Train / test split
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.20, random_state=42)
    logger.info(f"Train: {len(Xtr)}, Test: {len(Xte)}")

    # Preprocessing pipeline
    num_features = ["exp_mid"] + [f"sk_{s}" for s in all_skills] + ["n_skills"]
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_cols),
        ],
        remainder="passthrough",   # pass numeric columns through unchanged
    )

    models = {
        "DummyRegressor (mean)": DummyRegressor(strategy="mean"),
        "Linear Regression": LinearRegression(),
        "Random Forest": RandomForestRegressor(
            n_estimators=200, min_samples_leaf=3, n_jobs=-1, random_state=42
        ),
        "Gradient Boosting": HistGradientBoostingRegressor(
            max_iter=300, learning_rate=0.06, random_state=42
        ),
    }

    results = []
    trained_models = {}
    predictions = {}

    for name, model in models.items():
        logger.info(f"Training: {name} …")
        pipe = Pipeline([("prep", preprocessor), ("model", model)])
        pipe.fit(Xtr, ytr)
        metrics, preds = evaluate_model(pipe, Xte, yte)
        results.append({"model": name, **metrics})
        trained_models[name] = pipe
        predictions[name] = preds
        logger.info(f"  {name}: MAE={metrics['MAE_LPA']:.2f} RMSE={metrics['RMSE_LPA']:.2f} R²={metrics['R2']:.3f}")

    # Save results table
    res_df = pd.DataFrame(results)
    res_df.to_csv(EVAL / "salary_model_results.csv", index=False)
    logger.info(f"Results saved to {EVAL/'salary_model_results.csv'}")

    # Select best model (lowest MAE)
    best_name = res_df.sort_values("MAE_LPA").iloc[0]["model"]
    best_model = trained_models[best_name]
    best_metrics = results[list(models.keys()).index(best_name)]
    logger.info(f"Best model: {best_name} (MAE={best_metrics['MAE_LPA']} LPA)")

    # Save best model
    joblib.dump(best_model, MODELS / "salary_model.joblib")
    logger.info(f"Saved: {MODELS/'salary_model.joblib'}")

    # Create comparison chart
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    # Bar chart: MAE comparison
    model_names = [r["model"] for r in results]
    maes = [r["MAE_LPA"] for r in results]
    colors = ["#9B75FF" if m == best_name else "#AAA6B7" for m in model_names]
    axes[0].barh(model_names, maes, color=colors)
    axes[0].set_xlabel("MAE (LPA)")
    axes[0].set_title("Salary Model Comparison — MAE (lower is better)")
    axes[0].axvline(x=min(maes), color="#9B75FF", linestyle="--", alpha=0.5)

    # Actual vs Predicted (best model)
    best_preds = predictions[best_name]
    axes[1].scatter(yte, best_preds, alpha=0.3, s=10, color="#9B75FF")
    mn, mx = min(yte.min(), best_preds.min()), max(yte.max(), best_preds.max())
    axes[1].plot([mn, mx], [mn, mx], "r--", lw=1.5)
    axes[1].set_xlabel("Actual (LPA)")
    axes[1].set_ylabel("Predicted (LPA)")
    axes[1].set_title(f"Actual vs Predicted — {best_name}")

    plt.tight_layout()
    plt.savefig(CHARTS / "salary_model_comparison.png", dpi=110)
    plt.close()
    logger.info(f"Chart saved: {CHARTS/'salary_model_comparison.png'}")

    return best_name, best_metrics, results, X.columns.tolist()


def save_manifest(best_name, best_metrics, all_results, feature_names):
    """Create model_manifest.json with metadata and actual metrics."""
    import sklearn
    manifest = {
        "version": "1.0.0",
        "created_at": datetime.now().isoformat(),
        "dataset_provenance": (
            "SYNTHETIC — 12,000 simulated Indian AI/Data job postings (2024-2026). "
            "Not real labor-market data."
        ),
        "artifacts": {
            "salary_model": {
                "filename": "salary_model.joblib",
                "model_type": best_name,
                "target": "salary_mid_lpa (INR Lakhs Per Annum)",
                "evaluation_metrics": best_metrics,
                "evaluation_note": (
                    "Metrics from held-out 20% test set. "
                    "Model trained on SYNTHETIC salary data — output is a demonstration estimate."
                ),
                "feature_count": len(feature_names),
                "all_model_results": all_results,
            }
        },
        "dependencies": {
            "scikit-learn": sklearn.__version__,
            "joblib": joblib.__version__,
        },
        "known_limitations": [
            "Trained on synthetic data — not a real salary predictor.",
            "Salary formula is deterministic with Gaussian noise — R² may be artificially high.",
            "No cross-company or cross-location real benchmarks.",
            "Model cannot be updated without retraining on new data.",
        ],
    }

    with open(MODELS / "model_manifest.json", "w") as f:
        json.dump(manifest, f, indent=2)
    logger.info(f"Manifest saved: {MODELS/'model_manifest.json'}")


def main():
    logger.info("=" * 60)
    logger.info("CareerIQ Model Training")
    logger.info("=" * 60)

    best_name, best_metrics, all_results, feature_names = train_salary_model()
    save_manifest(best_name, best_metrics, all_results, feature_names)

    logger.info("\n" + "=" * 60)
    logger.info("Training complete!")
    logger.info(f"Best model: {best_name}")
    logger.info(f"MAE: {best_metrics['MAE_LPA']} LPA | RMSE: {best_metrics['RMSE_LPA']} LPA | R²: {best_metrics['R2']}")
    logger.info("Artifacts saved to models/")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
