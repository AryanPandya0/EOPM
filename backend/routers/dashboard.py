"""
Dashboard router — aggregated data for the dashboard UI.
"""
from fastapi import APIRouter, HTTPException, Query
from routers.dataset import get_current_df

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/overview")
async def overview():
    """High-level summary stats for dashboard cards."""
    df = get_current_df()
    if df is None:
        raise HTTPException(404, "No dataset loaded.")

    from modules.preprocessing import compute_summary_stats
    from modules.optimization import generate_recommendations, compute_sustainability_score

    stats = compute_summary_stats(df)
    recs = generate_recommendations(df)
    sustainability = compute_sustainability_score(df, recs)

    return {
        **stats,
        "sustainability_score": sustainability["score"],
        "sustainability_grade": sustainability["grade"],
        "carbon_footprint_kg": sustainability["carbon_footprint_kg"],
        "estimated_cost_usd": sustainability["estimated_cost_usd"],
        "num_recommendations": len(recs),
    }


@router.get("/trends")
async def trends(granularity: str = Query(default="hourly", pattern="^(hourly|daily)$")):
    """Energy consumption trends over time."""
    df = get_current_df()
    if df is None:
        raise HTTPException(404, "No dataset loaded.")

    if granularity == "hourly":
        grouped = df.groupby(df["timestamp"].dt.floor("h"))["energy_kwh"].sum()
    else:
        grouped = df.groupby(df["timestamp"].dt.date)["energy_kwh"].sum()

    trend_data = [
        {"timestamp": str(ts), "energy_kwh": round(float(val), 4)}
        for ts, val in grouped.items()
    ]

    return {"granularity": granularity, "data": trend_data}


@router.get("/devices")
async def device_breakdown():
    """Energy consumption breakdown by device."""
    df = get_current_df()
    if df is None:
        raise HTTPException(404, "No dataset loaded.")

    device_totals = df.groupby("device")["energy_kwh"].agg(["sum", "mean", "count"])
    device_totals.columns = ["total_kwh", "avg_kwh", "reading_count"]
    device_totals = device_totals.sort_values("total_kwh", ascending=False)

    result = []
    total = device_totals["total_kwh"].sum()
    for device, row in device_totals.iterrows():
        result.append({
            "device": device,
            "total_kwh": round(float(row["total_kwh"]), 2),
            "avg_kwh": round(float(row["avg_kwh"]), 4),
            "reading_count": int(row["reading_count"]),
            "percentage": round(float(row["total_kwh"] / total * 100), 1),
        })

    return {"devices": result, "total_kwh": round(float(total), 2)}


@router.get("/peak-hours")
async def peak_hours():
    """Hourly consumption analysis to identify peak usage times."""
    df = get_current_df()
    if df is None:
        raise HTTPException(404, "No dataset loaded.")

    hourly = df.groupby("hour")["energy_kwh"].agg(["sum", "mean"]).reset_index()
    hourly.columns = ["hour", "total_kwh", "avg_kwh"]

    peak_hour = int(hourly.loc[hourly["total_kwh"].idxmax(), "hour"])
    min_hour = int(hourly.loc[hourly["total_kwh"].idxmin(), "hour"])

    data = []
    for _, row in hourly.iterrows():
        data.append({
            "hour": int(row["hour"]),
            "label": f"{int(row['hour']):02d}:00",
            "total_kwh": round(float(row["total_kwh"]), 2),
            "avg_kwh": round(float(row["avg_kwh"]), 4),
        })

    return {
        "peak_hour": peak_hour,
        "lowest_hour": min_hour,
        "data": data,
    }
