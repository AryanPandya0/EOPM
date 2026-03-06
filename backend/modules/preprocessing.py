import pd
from config import PEAK_HOURS

def _fuzzy_match_column(columns, target_keywords):
    """Find a column that matches any of the target keywords."""
    for col in columns:
        for keyword in target_keywords:
            if keyword in col:
                return col
    return None

def load_and_validate_csv(filepath: str) -> pd.DataFrame:
    """Load an arbitrary CSV and forcefully map it to expected schema via fuzzy matching."""
    df = pd.read_csv(filepath)

    # Normalize column names
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    # Map Timestamp
    ts_col = _fuzzy_match_column(df.columns, ["time", "date"])
    if ts_col and "timestamp" not in df.columns:
        df["timestamp"] = df[ts_col]
    elif "timestamp" not in df.columns:
        # Generate dummy sequential timestamps if completely missing (1 hour intervals)
        from datetime import datetime, timedelta
        start = datetime.now() - timedelta(hours=len(df))
        df["timestamp"] = [start + timedelta(hours=i) for i in range(len(df))]

    # Map Energy Usage
    power_col = _fuzzy_match_column(df.columns, ["energy", "power", "kwh", "usage", "consumption"])
    if power_col and "energy_kwh" not in df.columns:
         df["energy_kwh"] = pd.to_numeric(df[power_col], errors='coerce').fillna(0)
    elif "energy_kwh" not in df.columns:
        raise ValueError("Could not find any column relating to energy usage (e.g., 'energy_kwh', 'usage', 'power').")

    # Map Device (Fallback to 'Whole Facility')
    device_col = _fuzzy_match_column(df.columns, ["device", "appliance", "name", "category"])
    if device_col and "device" not in df.columns:
        df["device"] = df[device_col].fillna("Unknown Device")
    elif "device" not in df.columns:
        df["device"] = "Facility Load"

    # Map Temperature (Fallback to 30C)
    temp_col = _fuzzy_match_column(df.columns, ["temp", "weather"])
    if temp_col and "temperature" not in df.columns:
        df["temperature"] = pd.to_numeric(df[temp_col], errors='coerce').fillna(30.0)
    elif "temperature" not in df.columns:
        df["temperature"] = 30.0

    # Map Occupancy (Fallback to 1)
    occ_col = _fuzzy_match_column(df.columns, ["occupancy", "presence", "people"])
    if occ_col and "occupancy" not in df.columns:
         df["occupancy"] = pd.to_numeric(df[occ_col], errors='coerce').fillna(1)
    elif "occupancy" not in df.columns:
        df["occupancy"] = 1

    return df


def preprocess(df: pd.DataFrame) -> pd.DataFrame:
    """Full preprocessing pipeline mapping to dynamic features."""
    df = df.copy()

    # --- Parse timestamp ---
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df.dropna(subset=["timestamp"], inplace=True)

    df["energy_kwh"] = pd.to_numeric(df["energy_kwh"], errors="coerce").fillna(0).clip(lower=0)

    # Fetch live weather to determine true peak
    from modules.weather_api import fetch_live_weather
    live_weather = fetch_live_weather()
    live_peaks = live_weather["dynamic_peak_hours"] if live_weather.get("dynamic_peak_hours") else PEAK_HOURS

    # --- Feature engineering ---
    df["hour"] = df["timestamp"].dt.hour
    df["weekday"] = df["timestamp"].dt.weekday
    df["is_peak"] = df["hour"].isin(live_peaks).astype(int)
    df["is_weekend"] = (df["weekday"] >= 5).astype(int)
    df["day_of_year"] = df["timestamp"].dt.dayofyear
    df["month"] = df["timestamp"].dt.month

    # --- Sort ---
    df.sort_values("timestamp", inplace=True)
    df.reset_index(drop=True, inplace=True)

    return df


def get_feature_matrix(df: pd.DataFrame):
    """Extract features and target for ML."""
    feature_cols = ["hour", "weekday", "is_peak", "is_weekend", "temperature", "occupancy", "day_of_year", "month"]
    available = [c for c in feature_cols if c in df.columns]

    X = df[available].copy()
    y = df["energy_kwh"].copy()

    return X, y, available


def compute_summary_stats(df: pd.DataFrame) -> dict:
    """Compute summary statistics from preprocessed data."""
    total_kwh = float(df["energy_kwh"].sum())
    avg_daily = float(df.groupby(df["timestamp"].dt.date)["energy_kwh"].sum().mean())
    peak_hour = int(df.groupby("hour")["energy_kwh"].sum().idxmax())
    num_devices = int(df["device"].nunique())
    date_range_days = (df["timestamp"].max() - df["timestamp"].min()).days + 1

    device_totals = df.groupby("device")["energy_kwh"].sum().sort_values(ascending=False)
    top_device = device_totals.index[0] if len(device_totals) > 0 else "N/A"

    return {
        "total_kwh": round(total_kwh, 2),
        "avg_daily_kwh": round(avg_daily, 2),
        "peak_hour": peak_hour,
        "num_devices": num_devices,
        "date_range_days": date_range_days,
        "top_device": top_device,
        "record_count": len(df),
    }
