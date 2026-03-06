import pandas as pd
from config import PEAK_HOURS, CARBON_FACTOR_KG_PER_KWH, COST_PER_KWH
from modules.weather_api import fetch_live_weather

def generate_recommendations(df: pd.DataFrame) -> list:
    """Analyze energy data and generate actionable, doable optimization recommendations."""
    recommendations = []
    
    # Get live weather & dynamic peaks
    weather = fetch_live_weather()
    live_peaks = weather["dynamic_peak_hours"] if weather.get("dynamic_peak_hours") else PEAK_HOURS
    
    # Map dataframe peaks to live peaks for recommendations
    df_peaks = df[df["hour"].isin(live_peaks)]

    # --- 1. High AC usage during peak hours ---
    ac_data = df[df["device"].str.lower().str.contains("air conditioner|ac", na=False)]
    if len(ac_data) > 0:
        ac_peak = ac_data[ac_data["hour"].isin(live_peaks)]
        ac_offpeak = ac_data[~ac_data["hour"].isin(live_peaks)]
        if len(ac_peak) > 0 and len(ac_offpeak) > 0:
            peak_avg = ac_peak["energy_kwh"].mean()
            offpeak_avg = ac_offpeak["energy_kwh"].mean()
            if peak_avg > offpeak_avg * 1.3:
                savings = round((peak_avg - offpeak_avg) * len(ac_peak), 2)
                
                # Format peak hours string
                start_h = live_peaks[0]
                end_h = live_peaks[-1]
                time_str = f"{start_h}:00 - {end_h}:00"
                
                recommendations.append({
                    "category": "HVAC",
                    "priority": "high",
                    "title": "Shift AC load outside peak grid hours",
                    "description": f"Do this: Pre-cool your space before {start_h}:00, and raise your thermostat by 2°C between {time_str}. "
                                   f"Your AC usage during these hours is {((peak_avg/offpeak_avg - 1)*100):.0f}% higher than normal. "
                                   f"Live weather shows a high of {weather.get('max_temp_today', 35)}°C today, pushing grid demand up during these hours.",
                    "potential_savings_kwh": savings,
                })

    # --- 2. Lights on during unoccupied periods ---
    lights_data = df[df["device"].str.lower().str.contains("light", na=False)]
    if len(lights_data) > 0 and "occupancy" in df.columns:
        unoccupied_lights = lights_data[(lights_data["occupancy"] == 0) & (lights_data["energy_kwh"] > 0.1)]
        if len(unoccupied_lights) > 5:
            wasted = round(unoccupied_lights["energy_kwh"].sum(), 2)
            recommendations.append({
                "category": "Lighting",
                "priority": "high",
                "title": "Automate lighting schedules",
                "description": f"Do this: Install motion sensors or set smart timers for lights in unoccupied rooms. "
                               f"We detected {len(unoccupied_lights)} instances of lights left on when empty, wasting {wasted} kWh.",
                "potential_savings_kwh": wasted,
            })

    # --- 3. Schedule heavy appliances during off-peak ---
    heavy_appliances = df[df["device"].str.lower().str.contains("wash|dryer|heater|pump", na=False)]
    if len(heavy_appliances) > 0:
        heavy_peak = heavy_appliances[heavy_appliances["hour"].isin(live_peaks)]
        if len(heavy_peak) > len(heavy_appliances) * 0.4:
            savings = round(heavy_peak["energy_kwh"].sum() * 0.15, 2)
            
            # Find a good off-peak window
            off_peaks = [h for h in range(24) if h not in live_peaks]
            best_offpeak = off_peaks[0] if off_peaks else 22
            
            recommendations.append({
                "category": "Load Shifting",
                "priority": "medium",
                "title": "Shift heavy appliance usage to off-peak",
                "description": f"Do this: Postpone running heavy appliances (Washing Machines, Pumps) until {best_offpeak}:00. "
                               f"{len(heavy_peak)} uses occurred during today's dynamic peak grid hours. "
                               f"Shifting this load reduces strain and saves ~₹{round(savings * COST_PER_KWH, 2)}.",
                "potential_savings_kwh": savings,
            })

    # --- 4. High overall consumption devices ---
    device_totals = df.groupby("device")["energy_kwh"].sum().sort_values(ascending=False)
    if len(device_totals) > 1:
        top = device_totals.iloc[0]
        mean_usage = device_totals.mean()
        if top > mean_usage * 2:
            recommendations.append({
                "category": "Appliance",
                "priority": "medium",
                "title": f"Optimize the {device_totals.index[0]}",
                "description": f"Do this: Service or upgrade your {device_totals.index[0]} to an energy-efficient (5-star BEE) model. "
                               f"It consumes {top:.1f} kWh total — {(top / device_totals.sum() * 100):.0f}% of your entire energy footprint.",
                "potential_savings_kwh": round(top * 0.2, 2),
            })

    # --- 5. Weekend vs weekday comparison ---
    if "is_weekend" in df.columns:
        weekday_avg = df[df["is_weekend"] == 0].groupby(df[df["is_weekend"] == 0]["timestamp"].dt.date)["energy_kwh"].sum().mean()
        weekend_avg = df[df["is_weekend"] == 1].groupby(df[df["is_weekend"] == 1]["timestamp"].dt.date)["energy_kwh"].sum().mean()
        if weekend_avg > weekday_avg * 1.2:
            recommendations.append({
                "category": "Behavior",
                "priority": "low",
                "title": "Manage weekend energy spikes",
                "description": f"Do this: Turn off unused entertainment and cooling systems when heading out on weekends. "
                               f"Your weekend usage ({weekend_avg:.1f} kWh/day) is {((weekend_avg/weekday_avg - 1)*100):.0f}% higher than weekdays.",
                "potential_savings_kwh": round((weekend_avg - weekday_avg) * 8, 2),
            })

    # --- 6. Nighttime standby consumption ---
    night = df[(df["hour"] >= 23) | (df["hour"] <= 5)]
    if len(night) > 0:
        night_avg = night["energy_kwh"].mean()
        day_avg = df[(df["hour"] >= 6) & (df["hour"] <= 22)]["energy_kwh"].mean()
        if night_avg > day_avg * 0.4:
            recommendations.append({
                "category": "Standby Power",
                "priority": "low",
                "title": "Cut overnight 'vampire' power",
                "description": f"Do this: Unplug TVs, computers, and microwaves at night, or use a smart power strip to kill standby power. "
                               f"Nighttime idle usage is unusually high ({night_avg:.3f} kWh avg).",
                "potential_savings_kwh": round(night_avg * len(night) * 0.3, 2),
            })

    return recommendations

def compute_sustainability_score(df: pd.DataFrame, recommendations: list) -> dict:
    """Compute a sustainability score (0-100) and carbon footprint specific to India."""
    total_kwh = df["energy_kwh"].sum()
    days = max((df["timestamp"].max() - df["timestamp"].min()).days, 1)

    daily_avg = total_kwh / days
    # Indian context baseline: Average urban household ~ 10-15 kWh/day depending on AC
    baseline_daily = 15.0

    # Score based on how much below/above baseline
    ratio = daily_avg / baseline_daily
    base_score = max(0, min(100, int(100 - (ratio - 0.5) * 80)))

    # Bonus for fewer high-priority issues
    high_issues = sum(1 for r in recommendations if r["priority"] == "high")
    penalty = high_issues * 10
    score = max(0, min(100, base_score - penalty))

    carbon_kg = round(total_kwh * CARBON_FACTOR_KG_PER_KWH, 2)
    estimated_cost = round(total_kwh * COST_PER_KWH, 2)

    potential_savings_kwh = sum(r.get("potential_savings_kwh", 0) for r in recommendations)
    potential_cost_savings = round(potential_savings_kwh * COST_PER_KWH, 2)
    potential_carbon_savings = round(potential_savings_kwh * CARBON_FACTOR_KG_PER_KWH, 2)

    return {
        "score": score,
        "grade": _score_to_grade(score),
        "total_kwh": round(total_kwh, 2),
        "daily_avg_kwh": round(daily_avg, 2),
        "carbon_footprint_kg": carbon_kg,
        "estimated_cost_usd": estimated_cost,  # Kept key name for frontend compatibility, will render as INR in UI
        "potential_savings_kwh": round(potential_savings_kwh, 2),
        "potential_cost_savings_usd": potential_cost_savings, # Same
        "potential_carbon_savings_kg": potential_carbon_savings,
        "days_analyzed": days,
    }

def _score_to_grade(score: int) -> str:
    if score >= 90: return "A+"
    elif score >= 80: return "A"
    elif score >= 70: return "B"
    elif score >= 60: return "C"
    elif score >= 50: return "D"
    else: return "F"
