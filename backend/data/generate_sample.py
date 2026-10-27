import csv
import math
from datetime import datetime, timedelta

def generate_sample_data(filename="sample_atmospheric_data.csv"):
    start_time = datetime(2025, 6, 1, 0, 0, 0)
    rows = []
    
    # 144 points = 24 hours at 10-minute intervals
    for i in range(144):
        curr_time = start_time + timedelta(minutes=10 * i)
        ts_str = curr_time.strftime("%Y-%m-%d %H:%M")
        
        # Diurnal cycle simulation:
        # Solar peak around 14:00 (i = 84), minimum around 05:00 (i = 30)
        hour_frac = curr_time.hour + curr_time.minute / 60.0
        
        # Base realistic values
        # Temp: peaks at ~34°C around 14:00, drops to ~24°C at 05:00
        temp_cycle = 29.0 + 5.5 * math.sin((hour_frac - 9.0) * math.pi / 12.0)
        # Humidity: inverse of temp, peaks at ~82% at night, drops to ~52% midday
        humidity_cycle = 67.0 - 15.0 * math.sin((hour_frac - 9.0) * math.pi / 12.0)
        # Wind: higher in afternoon ~8-12 m/s, lower at night ~3-6 m/s
        wind_cycle = 6.5 + 3.5 * math.sin((hour_frac - 11.0) * math.pi / 12.0)
        
        temp_val = round(temp_cycle, 1)
        hum_val = round(humidity_cycle, 1)
        wind_val = round(wind_cycle, 1)

        # Match exact values from user reference image at 10:00 to 10:50
        if ts_str == "2025-06-01 10:00":
            temp_val, hum_val, wind_val = 28.0, 65.0, 8.0
        elif ts_str == "2025-06-01 10:10":
            temp_val, hum_val, wind_val = 29.0, 68.0, 10.0
        elif ts_str == "2025-06-01 10:20":
            temp_val, hum_val, wind_val = 31.0, 70.0, 12.0
        elif ts_str == "2025-06-01 10:30":
            # Anomaly from Appendix B: Temp 45.0 flagged for review (exceeds default or custom threshold)
            temp_val, hum_val, wind_val = 45.0, 72.0, 14.0
        elif ts_str == "2025-06-01 10:40":
            # Anomaly from Appendix B: Humidity 96.0 flagged
            temp_val, hum_val, wind_val = 30.0, 96.0, 11.0
        elif ts_str == "2025-06-01 10:50":
            # Anomaly from Appendix B: Wind speed 35.0 flagged
            temp_val, hum_val, wind_val = 32.0, 67.0, 35.0
            
        # Additional intentional synthetic anomaly test cases scattered across 24h:
        elif ts_str == "2025-06-01 03:20":
            # Negative wind speed (physical violation)
            wind_val = -4.5
        elif ts_str == "2025-06-01 07:10":
            # Humidity out of physical bounds (> 100%)
            hum_val = 104.5
        elif ts_str == "2025-06-01 13:40":
            # Severe temperature spike anomaly (> 50°C)
            temp_val = 52.8
        elif ts_str == "2025-06-01 16:30":
            # Missing temperature (simulating sensor dropout)
            temp_val = ""
        elif ts_str == "2025-06-01 19:10":
            # Malformed string data
            hum_val = "ERR_VAL"
        elif ts_str == "2025-06-01 21:50":
            # Extreme sub-zero reading
            temp_val = -24.5

        rows.append({
            "timestamp": ts_str,
            "temperature_c": temp_val,
            "humidity_percent": hum_val,
            "wind_speed_ms": wind_val
        })

    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["timestamp", "temperature_c", "humidity_percent", "wind_speed_ms"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Generated {len(rows)} rows to {filename}")

if __name__ == "__main__":
    generate_sample_data("e:/MY DOC/INTERSHIP PROJECT APP/backend/data/sample_atmospheric_data.csv")
