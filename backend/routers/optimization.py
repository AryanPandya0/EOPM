"""
Optimization router — recommendations, anomalies, sustainability.
"""
from fastapi import APIRouter, HTTPException
from routers.dataset import get_current_df
from modules.optimization import generate_recommendations, compute_sustainability_score
from modules.anomaly import detect_anomalies

router = APIRouter(prefix="/api/optimize", tags=["Optimization"])


@router.get("/recommendations")
async def recommendations():
    """Get optimization recommendations based on current data."""
    df = get_current_df()
    if df is None:
        raise HTTPException(404, "No dataset loaded.")

    recs = generate_recommendations(df)
    return {"recommendations": recs, "count": len(recs)}


@router.get("/anomalies")
async def anomalies():
    """Detect anomalies in energy consumption data."""
    df = get_current_df()
    if df is None:
        raise HTTPException(404, "No dataset loaded.")

    anom = detect_anomalies(df, method="iqr")
    return {"anomalies": anom[:50], "total_count": len(anom)}  # cap at 50


@router.get("/sustainability")
async def sustainability():
    """Get sustainability score and carbon footprint."""
    df = get_current_df()
    if df is None:
        raise HTTPException(404, "No dataset loaded.")

    recs = generate_recommendations(df)
    result = compute_sustainability_score(df, recs)
    return result
