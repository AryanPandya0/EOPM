"""
EOPM Backend — FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import dataset, prediction, dashboard, optimization

app = FastAPI(
    title="EOPM — Energy Optimization Prediction Model",
    description="API for energy consumption analysis, ML prediction, and optimization recommendations.",
    version="1.0.0",
)

# CORS — allow all origins (needed for Capacitor mobile app + web dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(dataset.router)
app.include_router(prediction.router)
app.include_router(dashboard.router)
app.include_router(optimization.router)


@app.on_event("startup")
async def startup():
    init_db()


@app.get("/")
async def root():
    return {
        "name": "EOPM API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
