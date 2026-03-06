import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
UPLOAD_DIR = os.path.join(DATA_DIR, "uploads")
MODEL_DIR = os.path.join(BASE_DIR, "models", "saved")
DB_PATH = os.path.join(BASE_DIR, "eopm.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

SAMPLE_DATA_PATH = os.path.join(DATA_DIR, "sample_energy_data.csv")

# Ensure directories exist
for d in [UPLOAD_DIR, MODEL_DIR]:
    os.makedirs(d, exist_ok=True)

# ML Config
ML_CONFIG = {
    "test_size": 0.2,
    "random_state": 42,
    "n_estimators": 100,
}

# Carbon footprint factor (kg CO2 per kWh — India average)
CARBON_FACTOR_KG_PER_KWH = 0.71

# Peak hours definition (Dynamic override possible via weather API)
PEAK_HOURS = list(range(9, 12)) + list(range(17, 21))  # Default 9-12, 17-21

# Cost per kWh (INR)
COST_PER_KWH = 8.00
