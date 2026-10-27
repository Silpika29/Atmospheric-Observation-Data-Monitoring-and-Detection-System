import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_api_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["mode"] == "Sample Data Mode"
    assert "NARL" in data["institution"]

def test_api_summary():
    res = client.get("/api/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_records" in data
    assert data["total_records"] > 0
    assert data["latest_temperature"] is not None
    assert data["latest_valid_timestamp"] is not None

def test_api_readings_pagination_and_filter():
    res = client.get("/api/readings?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert data["page"] == 1
    assert data["page_size"] == 10
    assert len(data["readings"]) == 10

    # Filter by ANOMALY
    res_anomaly = client.get("/api/readings?status=ANOMALY")
    assert res_anomaly.status_code == 200
    data_anomaly = res_anomaly.json()
    assert len(data_anomaly["readings"]) > 0
    for r in data_anomaly["readings"]:
        assert r["status_code"] == "ANOMALY"

def test_api_anomalies_breakdown():
    res = client.get("/api/anomalies")
    assert res.status_code == 200
    data = res.json()
    assert "total_anomalies" in data
    assert "by_variable" in data
    assert "by_reason" in data
    assert len(data["anomalies"]) > 0

def test_10_threshold_updates():
    # Fetch current
    res_curr = client.get("/api/config")
    assert res_curr.status_code == 200

    # Update with new values
    new_cfg = {
        "temp_min": -10.0,
        "temp_max": 40.0,
        "humidity_min": 10.0,
        "humidity_max": 85.0,
        "wind_speed_min": 0.0,
        "wind_speed_max": 25.0
    }
    res_put = client.put("/api/config", json=new_cfg)
    assert res_put.status_code == 200
    updated = res_put.json()
    assert updated["temp_max"] == 40.0

    # Invalid threshold: min >= max
    invalid_cfg = {
        "temp_min": 50.0,
        "temp_max": 40.0,
        "humidity_min": 10.0,
        "humidity_max": 85.0,
        "wind_speed_min": 0.0,
        "wind_speed_max": 25.0
    }
    res_invalid = client.put("/api/config", json=invalid_cfg)
    assert res_invalid.status_code == 422 or res_invalid.status_code == 400

    # Reset dataset and default config
    reset_cfg = {
        "temp_min": -20.0,
        "temp_max": 45.0,
        "humidity_min": 0.0,
        "humidity_max": 90.0,
        "wind_speed_min": 0.0,
        "wind_speed_max": 30.0
    }
    client.put("/api/config", json=reset_cfg)

def test_9_csv_upload_wrong_file_format():
    files = {"file": ("test.txt", b"plain text content", "text/plain")}
    res = client.post("/api/upload", files=files)
    assert res.status_code == 400
    assert "Only CSV" in res.json()["detail"]

def test_csv_upload_valid_file():
    csv_content = b"timestamp,temperature_c,humidity_percent,wind_speed_ms\n2025-06-01 12:00,29.5,60.0,7.5\n2025-06-01 12:10,30.0,59.0,8.0"
    files = {"file": ("uploaded_demo.csv", csv_content, "text/csv")}
    res = client.post("/api/upload", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["total_records"] == 2

    # Reset back to original sample dataset
    client.post("/api/reset")

def test_11_export_processed_data():
    res = client.get("/api/export")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "timestamp,temperature_c,humidity,wind_speed,status" in res.text

def test_12_export_anomalies():
    res = client.get("/api/export/anomalies")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "timestamp,variable,observed_value,threshold_rule,reason" in res.text
