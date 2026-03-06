"""
Generate a synthetic energy consumption dataset for the EOPM platform.
Run this script directly to regenerate: python generate_sample.py
"""
import csv
import os
import random
from datetime import datetime, timedelta

DEVICES = {
    "Air Conditioner": {"base": 2.5, "temp_factor": 0.08, "peak_mult": 1.4},
    "Refrigerator":    {"base": 0.15, "temp_factor": 0.005, "peak_mult": 1.0},
    "Lighting":        {"base": 0.3, "temp_factor": 0.0, "peak_mult": 1.2},
    "Washing Machine":  {"base": 0.0, "temp_factor": 0.0, "peak_mult": 1.0},
    "Electric Heater":  {"base": 1.8, "temp_factor": -0.06, "peak_mult": 1.3},
    "Computer":         {"base": 0.25, "temp_factor": 0.0, "peak_mult": 1.1},
}

PEAK_HOURS = list(range(9, 12)) + list(range(17, 21))


def generate_dataset(output_path: str, days: int = 30):
    start = datetime(2025, 1, 1, 0, 0, 0)
    rows = []

    for day_offset in range(days):
        dt_day = start + timedelta(days=day_offset)
        weekday = dt_day.weekday()
        is_weekend = weekday >= 5

        # Simulate base temperature pattern per day
        base_temp = random.uniform(18, 38)

        for hour in range(24):
            dt = dt_day.replace(hour=hour)
            # Temperature curve: cooler at night, warmer midday
            temp_offset = -5 + 10 * (1 - abs(hour - 14) / 14)
            temperature = round(base_temp + temp_offset + random.uniform(-2, 2), 1)

            # Occupancy: higher during day for weekdays, more random on weekends
            if is_weekend:
                occupancy = random.random() < 0.7
            else:
                occupancy = random.random() < (0.9 if 7 <= hour <= 22 else 0.2)

            is_peak = hour in PEAK_HOURS

            for device, params in DEVICES.items():
                # Washing machine only runs sometimes
                if device == "Washing Machine":
                    if not (8 <= hour <= 20 and random.random() < 0.08):
                        continue

                base = params["base"]
                energy = base + params["temp_factor"] * temperature
                if is_peak:
                    energy *= params["peak_mult"]
                if not occupancy and device in ("Lighting", "Computer"):
                    # Some wastage: 30% chance lights/computer on when unoccupied
                    if random.random() < 0.3:
                        energy *= 0.5  # partial usage
                    else:
                        energy *= 0.05  # standby
                if device == "Air Conditioner" and temperature < 22:
                    energy *= 0.1  # AC barely runs in cool weather

                # Add noise
                energy *= random.uniform(0.85, 1.15)
                # Occasional spike anomaly (~2% chance)
                if random.random() < 0.02:
                    energy *= random.uniform(2.5, 4.0)

                energy = round(max(energy, 0.01), 4)

                rows.append({
                    "timestamp": dt.strftime("%Y-%m-%d %H:%M:%S"),
                    "device": device,
                    "energy_kwh": energy,
                    "temperature": temperature,
                    "occupancy": int(occupancy),
                })

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["timestamp", "device", "energy_kwh", "temperature", "occupancy"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} records → {output_path}")
    return len(rows)


if __name__ == "__main__":
    generate_dataset(os.path.join(os.path.dirname(__file__), "data", "sample_energy_data.csv"))
