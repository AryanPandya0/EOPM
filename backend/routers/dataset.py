"""
Dataset router — upload, manage, and query energy datasets.
"""
import os
import shutil
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException
from config import UPLOAD_DIR, SAMPLE_DATA_PATH
from modules.preprocessing import load_and_validate_csv, preprocess, compute_summary_stats

router = APIRouter(prefix="/api/dataset", tags=["Dataset"])

# In-memory store of processed dataframes (keyed by filename)
_dataframes = {}


def get_current_df():
    """Return the most recently uploaded/loaded dataframe."""
    if not _dataframes:
        return None
    key = list(_dataframes.keys())[-1]
    return _dataframes[key]


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Upload a CSV dataset for analysis."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only CSV files are supported.")

    filepath = os.path.join(UPLOAD_DIR, file.filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        raw = load_and_validate_csv(filepath)
        df = preprocess(raw)
    except ValueError as e:
        os.remove(filepath)
        raise HTTPException(400, str(e))
    except Exception as e:
        os.remove(filepath)
        raise HTTPException(500, f"Processing error: {str(e)}")

    _dataframes[file.filename] = df
    stats = compute_summary_stats(df)

    return {
        "message": f"Uploaded and processed {file.filename}",
        "filename": file.filename,
        "stats": stats,
    }


@router.post("/load-sample")
async def load_sample_dataset():
    """Load the built-in sample dataset."""
    if not os.path.exists(SAMPLE_DATA_PATH):
        raise HTTPException(404, "Sample dataset not found. Run generate_sample.py first.")

    raw = load_and_validate_csv(SAMPLE_DATA_PATH)
    df = preprocess(raw)
    _dataframes["sample_energy_data.csv"] = df
    stats = compute_summary_stats(df)

    return {
        "message": "Loaded sample dataset",
        "filename": "sample_energy_data.csv",
        "stats": stats,
    }


@router.get("/summary")
async def dataset_summary():
    """Get summary statistics of the current dataset."""
    df = get_current_df()
    if df is None:
        raise HTTPException(404, "No dataset loaded. Upload a CSV or load the sample dataset.")
    return compute_summary_stats(df)


@router.get("/records")
async def dataset_records(limit: int = 100, offset: int = 0):
    """Get paginated energy records."""
    df = get_current_df()
    if df is None:
        raise HTTPException(404, "No dataset loaded.")

    total = len(df)
    page = df.iloc[offset: offset + limit].copy()
    page["timestamp"] = page["timestamp"].astype(str)

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "records": page.to_dict(orient="records"),
    }
