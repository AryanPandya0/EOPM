"""
Machine Learning engine — training, evaluation, and prediction.
"""
import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

try:
    from xgboost import XGBRegressor
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

from config import ML_CONFIG, MODEL_DIR


class MLEngine:
    """Manages training, evaluation, and prediction across multiple models."""

    MODELS = {}

    def __init__(self):
        self.trained_models = {}
        self.metrics = {}
        self.best_model_name = None
        self.feature_names = []

    def train(self, X: pd.DataFrame, y: pd.Series) -> dict:
        """Train all models and select the best one by RMSE."""
        self.feature_names = list(X.columns)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=ML_CONFIG["test_size"],
            random_state=ML_CONFIG["random_state"],
        )

        candidates = {
            "Linear Regression": LinearRegression(),
            "Random Forest": RandomForestRegressor(
                n_estimators=ML_CONFIG["n_estimators"],
                random_state=ML_CONFIG["random_state"],
                n_jobs=-1,
            ),
        }
        if HAS_XGBOOST:
            candidates["XGBoost"] = XGBRegressor(
                n_estimators=ML_CONFIG["n_estimators"],
                random_state=ML_CONFIG["random_state"],
                verbosity=0,
            )

        best_rmse = float("inf")

        for name, model in candidates.items():
            model.fit(X_train, y_train)
            preds = model.predict(X_test)

            rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
            mae = float(mean_absolute_error(y_test, preds))
            r2 = float(r2_score(y_test, preds))

            self.trained_models[name] = model
            self.metrics[name] = {"rmse": round(rmse, 4), "mae": round(mae, 4), "r2": round(r2, 4)}

            if rmse < best_rmse:
                best_rmse = rmse
                self.best_model_name = name

        # Save all models
        self._save_models()

        return {
            "best_model": self.best_model_name,
            "metrics": self.metrics,
        }

    def predict(self, X: pd.DataFrame, model_name: str = None) -> np.ndarray:
        """Generate predictions using specified or best model."""
        name = model_name or self.best_model_name
        if name not in self.trained_models:
            self._load_models()
        if name not in self.trained_models:
            raise ValueError(f"Model '{name}' not found. Train first.")

        model = self.trained_models[name]
        return model.predict(X)

    def forecast_future(self, df: pd.DataFrame, hours: int = 24) -> list:
        """Forecast energy for the next N hours based on pattern continuation."""
        if not self.best_model_name:
            self._load_models()
        if not self.best_model_name:
            raise ValueError("No trained model available. Train first.")

        last_ts = df["timestamp"].max()
        future_rows = []

        for h in range(1, hours + 1):
            future_ts = last_ts + pd.Timedelta(hours=h)
            row = {
                "hour": future_ts.hour,
                "weekday": future_ts.weekday(),
                "is_peak": int(future_ts.hour in list(range(9, 12)) + list(range(17, 21))),
                "is_weekend": int(future_ts.weekday() >= 5),
                "temperature": float(df["temperature"].mean()),
                "occupancy": 1,
                "day_of_year": future_ts.dayofyear,
                "month": future_ts.month,
            }
            future_rows.append(row)

        future_df = pd.DataFrame(future_rows)
        # Only use features that were used in training
        available = [c for c in self.feature_names if c in future_df.columns]
        preds = self.predict(future_df[available])

        results = []
        for i, row in enumerate(future_rows):
            ts = last_ts + pd.Timedelta(hours=i + 1)
            results.append({
                "timestamp": ts.strftime("%Y-%m-%d %H:%M:%S"),
                "predicted_kwh": round(float(preds[i]), 4),
                "hour": row["hour"],
                "is_peak": bool(row["is_peak"]),
            })

        return results

    def _save_models(self):
        """Persist trained models and metadata to disk."""
        os.makedirs(MODEL_DIR, exist_ok=True)
        for name, model in self.trained_models.items():
            safe_name = name.lower().replace(" ", "_")
            joblib.dump(model, os.path.join(MODEL_DIR, f"{safe_name}.joblib"))

        meta = {
            "best_model": self.best_model_name,
            "metrics": self.metrics,
            "feature_names": self.feature_names,
        }
        with open(os.path.join(MODEL_DIR, "meta.json"), "w") as f:
            json.dump(meta, f, indent=2)

    def _load_models(self):
        """Load models from disk."""
        meta_path = os.path.join(MODEL_DIR, "meta.json")
        if not os.path.exists(meta_path):
            return

        with open(meta_path) as f:
            meta = json.load(f)

        self.best_model_name = meta.get("best_model")
        self.metrics = meta.get("metrics", {})
        self.feature_names = meta.get("feature_names", [])

        for name in meta.get("metrics", {}).keys():
            safe_name = name.lower().replace(" ", "_")
            model_path = os.path.join(MODEL_DIR, f"{safe_name}.joblib")
            if os.path.exists(model_path):
                self.trained_models[name] = joblib.load(model_path)


# Singleton engine instance
ml_engine = MLEngine()
