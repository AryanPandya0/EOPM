from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    uploaded_at = Column(DateTime, nullable=False)
    record_count = Column(Integer, default=0)
    status = Column(String, default="uploaded")


class EnergyRecord(Base):
    __tablename__ = "energy_records"
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    device = Column(String, nullable=False)
    energy_kwh = Column(Float, nullable=False)
    temperature = Column(Float, nullable=True)
    occupancy = Column(Boolean, nullable=True)
    hour = Column(Integer, nullable=True)
    weekday = Column(Integer, nullable=True)
    is_peak = Column(Boolean, nullable=True)
    is_weekend = Column(Boolean, nullable=True)


class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, nullable=False)
    model_name = Column(String, nullable=False)
    target_time = Column(DateTime, nullable=False)
    predicted_kwh = Column(Float, nullable=False)
    actual_kwh = Column(Float, nullable=True)


class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, nullable=False)
    category = Column(String, nullable=False)
    priority = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    potential_savings_kwh = Column(Float, nullable=True)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
