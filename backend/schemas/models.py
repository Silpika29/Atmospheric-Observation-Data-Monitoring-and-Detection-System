from typing import List, Optional
from pydantic import BaseModel, Field, model_validator

class ThresholdConfig(BaseModel):
    temp_min: float = Field(default=-20.0, description="Minimum acceptable temperature in °C")
    temp_max: float = Field(default=45.0, description="Maximum acceptable temperature in °C (flagged above)")
    humidity_min: float = Field(default=0.0, description="Minimum relative humidity %")
    humidity_max: float = Field(default=90.0, description="Maximum relative humidity % threshold")
    wind_speed_min: float = Field(default=0.0, description="Minimum wind speed m/s")
    wind_speed_max: float = Field(default=30.0, description="Maximum wind speed m/s threshold")

    @model_validator(mode="after")
    def validate_ranges(self):
        if self.temp_min >= self.temp_max:
            raise ValueError("temp_min must be strictly less than temp_max")
        if self.humidity_min < 0 or self.humidity_max > 100:
            raise ValueError("humidity thresholds must be within 0% and 100%")
        if self.humidity_min >= self.humidity_max:
            raise ValueError("humidity_min must be strictly less than humidity_max")
        if self.wind_speed_min < 0:
            raise ValueError("wind_speed_min cannot be negative")
        if self.wind_speed_min >= self.wind_speed_max:
            raise ValueError("wind_speed_min must be strictly less than wind_speed_max")
        return self

class AtmosphericReading(BaseModel):
    id: int
    timestamp: Optional[str] = None
    temperature_c: Optional[float] = None
    humidity: Optional[float] = None
    wind_speed: Optional[float] = None
    status: str = "Within configured range"
    status_code: str = "NORMAL"  # NORMAL, ANOMALY, INVALID
    is_valid: bool = True
    is_anomaly: bool = False
    reasons: List[str] = []

class AnomalyDetail(BaseModel):
    id: int
    row_index: int
    timestamp: Optional[str] = None
    variable: str
    observed_value: Optional[str] = None
    threshold_rule: str
    reason: str
    severity: str = "Review Required"
    status: str = "Flagged for review"

class SummaryStats(BaseModel):
    total_records: int
    valid_records: int
    invalid_records: int
    anomaly_records: int
    latest_valid_timestamp: Optional[str] = None
    latest_temperature: Optional[float] = None
    latest_humidity: Optional[float] = None
    latest_wind_speed: Optional[float] = None
    overall_status: str = "NORMAL"
    dataset_name: str = "sample_atmospheric_data.csv"
    is_sample_mode: bool = True
    last_processed: str = ""

class PaginatedReadingsResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    readings: List[AtmosphericReading]

class AnomalySummary(BaseModel):
    total_anomalies: int
    by_variable: dict
    by_reason: dict
    anomalies: List[AnomalyDetail]
