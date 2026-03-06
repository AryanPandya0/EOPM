"""
Prediction router — ML model training and forecasting.
"""
from fastapi import APIRouter, HTTPException, Query
from modules.ml_engine import ml_engine
from modules.preprocessing import get_feature_matrix
from routers.dataset import get_current_df

router = APIRouter(prefix="/api/predict", tags=["Prediction"])


@router.post("/train")
async def train_model():
    """Train ML models on the current dataset."""
    df = get_current_df()
    if df is None:
        raise HTTPException(404, "No dataset loaded. Upload data first.")

    X, y, features = get_feature_matrix(df)
    if len(X) < 20:
        raise HTTPException(400, "Dataset too small for training (need at least 20 records).")

    result = ml_engine.train(X, y)
    return {
        "message": "Models trained successfully",
        "best_model": result["best_model"],
        "metrics": result["metrics"],
    }


@router.get("/forecast")
async def forecast(hours: int = Query(default=24, ge=1, le=168)):
    """Forecast energy consumption for the next N hours."""
    df = get_current_df()
    if df is None:
        raise HTTPException(404, "No dataset loaded.")

    try:
        predictions = ml_engine.forecast_future(df, hours=hours)
    except ValueError as e:
        raise HTTPException(400, str(e))

    # Aggregate daily totals
    daily = {}
    for p in predictions:
        day = p["timestamp"][:10]
        daily[day] = daily.get(day, 0) + p["predicted_kwh"]

    daily_forecast = [{"date": d, "predicted_kwh": round(v, 2)} for d, v in daily.items()]

    return {
        "hourly": predictions,
        "daily": daily_forecast,
        "total_predicted_kwh": round(sum(p["predicted_kwh"] for p in predictions), 2),
    }


@router.get("/metrics")
async def model_metrics():
    """Get performance metrics for all trained models."""
    if not ml_engine.metrics:
        raise HTTPException(404, "No models trained yet.")

    return {
        "best_model": ml_engine.best_model_name,
        "models": ml_engine.metrics,
    }
