"""
Anomaly detection module — identifies unusual energy consumption patterns.
"""
import pandas as pd
import numpy as np


def detect_anomalies(df: pd.DataFrame, method: str = "iqr") -> list:
    """
    Detect anomalous energy readings.

    Methods:
        - 'iqr': Interquartile Range
        - 'zscore': Z-Score (|z| > 3)
    """
    anomalies = []

    for device in df["device"].unique():
        device_df = df[df["device"] == device].copy()

        if len(device_df) < 10:
            continue

        values = device_df["energy_kwh"]

        if method == "iqr":
            q1 = values.quantile(0.25)
            q3 = values.quantile(0.75)
            iqr = q3 - q1
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
            mask = (values < lower) | (values > upper)
        elif method == "zscore":
            mean = values.mean()
            std = values.std()
            if std == 0:
                continue
            z = np.abs((values - mean) / std)
            mask = z > 3
        else:
            raise ValueError(f"Unknown method: {method}")

        anomalous = device_df[mask]

        for _, row in anomalous.iterrows():
            severity = "high" if row["energy_kwh"] > values.quantile(0.99) else "medium"
            anomalies.append({
                "timestamp": row["timestamp"].strftime("%Y-%m-%d %H:%M:%S") if hasattr(row["timestamp"], "strftime") else str(row["timestamp"]),
                "device": device,
                "energy_kwh": round(float(row["energy_kwh"]), 4),
                "expected_range": f"{round(float(values.quantile(0.25)), 3)} - {round(float(values.quantile(0.75)), 3)} kWh",
                "severity": severity,
                "description": f"Unusual consumption of {row['energy_kwh']:.3f} kWh detected for {device}.",
            })

    # Sort by severity then energy
    priority = {"high": 0, "medium": 1}
    anomalies.sort(key=lambda a: (priority.get(a["severity"], 2), -a["energy_kwh"]))

    return anomalies
