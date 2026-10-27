import pytest
import io
from services.data_processor import DataProcessor
from schemas.models import ThresholdConfig

def test_1_valid_csv_normal_observations():
    csv_data = """timestamp,temperature_c,humidity_percent,wind_speed_ms
2025-06-01 10:00,28.0,65.0,8.0
2025-06-01 10:10,29.0,68.0,10.0
2025-06-01 10:20,31.0,70.0,12.0
"""
    processor = DataProcessor(ThresholdConfig())
    res = processor.load_and_process_csv(csv_data.encode("utf-8"))
    assert res["total_records"] == 3
    assert res["anomalies_count"] == 0
    summary = processor.get_summary()
    assert summary.valid_records == 3
    assert summary.anomaly_records == 0
    assert summary.overall_status == "NORMAL"

def test_2_temperature_outside_configured_range():
    csv_data = """timestamp,temperature_c,humidity_percent,wind_speed_ms
2025-06-01 10:00,48.5,65.0,8.0
2025-06-01 10:10,-25.0,68.0,10.0
"""
    # default max is 45.0, min is -20.0
    processor = DataProcessor(ThresholdConfig(temp_min=-20.0, temp_max=45.0))
    processor.load_and_process_csv(csv_data.encode("utf-8"))
    readings = processor.processed_readings
    assert readings[0].is_anomaly is True
    assert "exceeds upper limit" in readings[0].reasons[0]
    assert readings[1].is_anomaly is True
    assert "falls below lower limit" in readings[1].reasons[0]

def test_3_humidity_below_zero_or_above_100():
    csv_data = """timestamp,temperature_c,humidity_percent,wind_speed_ms
2025-06-01 10:00,28.0,-5.0,8.0
2025-06-01 10:10,29.0,108.5,10.0
"""
    processor = DataProcessor(ThresholdConfig())
    processor.load_and_process_csv(csv_data.encode("utf-8"))
    readings = processor.processed_readings
    assert readings[0].is_anomaly is True
    assert "Invalid humidity range" in readings[0].reasons[0]
    assert readings[1].is_anomaly is True
    assert "108.5%" in readings[1].reasons[0]

def test_4_negative_wind_speed():
    csv_data = """timestamp,temperature_c,humidity_percent,wind_speed_ms
2025-06-01 10:00,28.0,65.0,-4.2
"""
    processor = DataProcessor(ThresholdConfig())
    processor.load_and_process_csv(csv_data.encode("utf-8"))
    reading = processor.processed_readings[0]
    assert reading.is_anomaly is True
    assert "Negative wind speed" in reading.reasons[0]

def test_5_missing_and_non_numeric_values():
    csv_data = """timestamp,temperature_c,humidity_percent,wind_speed_ms
2025-06-01 10:00,,65.0,8.0
2025-06-01 10:10,30.0,ERR_VALUE,10.0
"""
    processor = DataProcessor(ThresholdConfig())
    processor.load_and_process_csv(csv_data.encode("utf-8"))
    readings = processor.processed_readings
    assert readings[0].is_valid is False
    assert readings[0].status_code == "INVALID"
    assert "is empty" in readings[0].reasons[0]
    assert readings[1].is_valid is False
    assert "non-numeric" in readings[1].reasons[0]

def test_6_invalid_timestamp():
    csv_data = """timestamp,temperature_c,humidity_percent,wind_speed_ms
INVALID_TIME,28.0,65.0,8.0
,29.0,68.0,10.0
"""
    processor = DataProcessor(ThresholdConfig())
    processor.load_and_process_csv(csv_data.encode("utf-8"))
    readings = processor.processed_readings
    assert readings[0].is_valid is False
    assert "Invalid timestamp" in readings[0].reasons[0]
    assert readings[1].is_valid is False
    assert "Missing timestamp" in readings[1].reasons[0]

def test_7_missing_required_csv_column():
    csv_data = """timestamp,temperature_c,wind_speed_ms
2025-06-01 10:00,28.0,8.0
"""
    processor = DataProcessor(ThresholdConfig())
    with pytest.raises(ValueError) as excinfo:
        processor.load_and_process_csv(csv_data.encode("utf-8"))
    assert "Missing required atmospheric column" in str(excinfo.value)
    assert "humidity" in str(excinfo.value)

def test_8_empty_dataset():
    processor = DataProcessor(ThresholdConfig())
    with pytest.raises(ValueError) as excinfo:
        processor.load_and_process_csv(b"")
    assert "empty" in str(excinfo.value).lower()

def test_14_dataset_containing_no_anomalies():
    csv_data = """timestamp,temperature_c,humidity_percent,wind_speed_ms
2025-06-01 10:00,25.0,50.0,5.0
2025-06-01 10:10,26.0,55.0,6.0
"""
    processor = DataProcessor(ThresholdConfig())
    processor.load_and_process_csv(csv_data.encode("utf-8"))
    anomalies = processor.get_anomaly_summary()
    assert anomalies.total_anomalies == 0
    assert len(anomalies.anomalies) == 0
