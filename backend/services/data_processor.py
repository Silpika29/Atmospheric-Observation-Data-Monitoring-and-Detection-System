import io
import math
import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Tuple, Dict, Any, Optional

from schemas.models import (
    ThresholdConfig,
    AtmosphericReading,
    AnomalyDetail,
    SummaryStats,
    AnomalySummary,
)

class DataProcessor:
    def __init__(self, config: Optional[ThresholdConfig] = None):
        self.config = config or ThresholdConfig()
        self.raw_df: Optional[pd.DataFrame] = None
        self.processed_readings: List[AtmosphericReading] = []
        self.anomalies: List[AnomalyDetail] = []
        self.dataset_name: str = "sample_atmospheric_data.csv"
        self.last_processed: str = ""

    def set_config(self, config: ThresholdConfig) -> None:
        self.config = config

    def _normalize_column_names(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, str]]:
        """Map flexible CSV column headers to canonical names."""
        clean_cols = {col: str(col).strip().lower().replace(" ", "_") for col in df.columns}
        df = df.rename(columns=clean_cols)
        
        mapping = {}
        # Timestamp
        for candidate in ["timestamp", "time", "datetime", "date_time", "obs_time"]:
            if candidate in df.columns:
                mapping["timestamp"] = candidate
                break
                
        # Temperature
        for candidate in ["temperature_c", "temperature", "temp_c", "temp", "temperature(°c)"]:
            if candidate in df.columns:
                mapping["temperature"] = candidate
                break
                
        # Humidity
        for candidate in ["humidity_percent", "humidity", "rh", "relative_humidity", "humidity(%)"]:
            if candidate in df.columns:
                mapping["humidity"] = candidate
                break
                
        # Wind Speed
        for candidate in ["wind_speed_ms", "wind_speed", "wind", "speed_ms", "wind_speed(m/s)"]:
            if candidate in df.columns:
                mapping["wind_speed"] = candidate
                break
                
        return df, mapping

    def load_and_process_csv(self, file_content_or_path: Any, filename: str = "dataset.csv") -> Dict[str, Any]:
        """
        Loads CSV content or file path, validates schema, checks physical & threshold bounds,
        and constructs processed readings and anomaly records.
        """
        self.dataset_name = filename
        
        # 1. Read CSV
        try:
            if isinstance(file_content_or_path, (bytes, bytearray)):
                df = pd.read_csv(io.BytesIO(file_content_or_path))
            elif isinstance(file_content_or_path, str):
                df = pd.read_csv(file_content_or_path)
            else:
                raise ValueError("Unsupported input format for CSV file")
        except pd.errors.EmptyDataError:
            raise ValueError("The provided CSV file is completely empty.")
        except Exception as e:
            raise ValueError(f"Unable to parse CSV file: {str(e)}")

        if df.empty:
            raise ValueError("The provided CSV file contains no data rows.")

        # 2. Check required columns
        df, mapping = self._normalize_column_names(df)
        missing_canonical = []
        for req in ["timestamp", "temperature", "humidity", "wind_speed"]:
            if req not in mapping:
                missing_canonical.append(req)
                
        if missing_canonical:
            raise ValueError(
                f"Missing required atmospheric column(s): {', '.join(missing_canonical)}. "
                "Expected columns: timestamp, temperature_c, humidity_percent, wind_speed_ms."
            )

        self.raw_df = df
        readings: List[AtmosphericReading] = []
        anomalies: List[AnomalyDetail] = []
        anomaly_counter = 1

        for idx, row in df.iterrows():
            row_id = idx + 1
            reasons = []
            is_valid = True
            is_anomaly = False

            # --- A. Validate Timestamp ---
            raw_ts = row[mapping["timestamp"]]
            formatted_ts = None
            if pd.isna(raw_ts) or str(raw_ts).strip() == "":
                is_valid = False
                reasons.append("Missing timestamp")
                anomalies.append(AnomalyDetail(
                    id=anomaly_counter,
                    row_index=row_id,
                    timestamp=None,
                    variable="Timestamp",
                    observed_value=None,
                    threshold_rule="Valid ISO/datetime string required",
                    reason="Invalid timestamp: Empty or missing value",
                    severity="High",
                    status="Flagged for review"
                ))
                anomaly_counter += 1
            else:
                raw_ts_str = str(raw_ts).strip()
                try:
                    parsed_dt = pd.to_datetime(raw_ts_str)
                    formatted_ts = parsed_dt.strftime("%Y-%m-%d %H:%M")
                except Exception:
                    is_valid = False
                    reasons.append(f"Invalid timestamp format '{raw_ts_str}'")
                    anomalies.append(AnomalyDetail(
                        id=anomaly_counter,
                        row_index=row_id,
                        timestamp=raw_ts_str,
                        variable="Timestamp",
                        observed_value=raw_ts_str,
                        threshold_rule="YYYY-MM-DD HH:MM:SS format",
                        reason=f"Invalid timestamp: Unparseable date '{raw_ts_str}'",
                        severity="High",
                        status="Flagged for review"
                    ))
                    anomaly_counter += 1

            # --- Helper to parse float safely ---
            def parse_metric(raw_val: Any, name: str) -> Tuple[Optional[float], bool, Optional[str]]:
                if pd.isna(raw_val) or str(raw_val).strip() == "" or str(raw_val).strip().lower() in ["nan", "null", "none"]:
                    return None, False, f"Missing or invalid value: {name} is empty"
                try:
                    val = float(raw_val)
                    if math.isnan(val) or math.isinf(val):
                        return None, False, f"Missing or invalid value: {name} is not a finite number"
                    return round(val, 2), True, None
                except (ValueError, TypeError):
                    return None, False, f"Missing or invalid value: {name} contains non-numeric value '{raw_val}'"

            # --- B. Temperature ---
            temp_val, temp_ok, temp_err = parse_metric(row[mapping["temperature"]], "Temperature")
            if not temp_ok:
                is_valid = False
                reasons.append(temp_err)
                anomalies.append(AnomalyDetail(
                    id=anomaly_counter,
                    row_index=row_id,
                    timestamp=formatted_ts or str(raw_ts),
                    variable="Temperature",
                    observed_value=str(row[mapping["temperature"]]),
                    threshold_rule=f"{self.config.temp_min}°C to {self.config.temp_max}°C",
                    reason=temp_err,
                    severity="High",
                    status="Flagged for review"
                ))
                anomaly_counter += 1
            else:
                # Check threshold bounds (>= upper limit or <= lower limit is flagged for review)
                if temp_val < self.config.temp_min or temp_val >= self.config.temp_max:
                    is_anomaly = True
                    reason_msg = f"Outside configured range: Temperature ({temp_val}°C)"
                    if temp_val >= self.config.temp_max:
                        reason_msg += f" reaches/exceeds upper limit ({self.config.temp_max}°C)"
                    else:
                        reason_msg += f" falls below lower limit ({self.config.temp_min}°C)"
                    reasons.append(reason_msg)
                    anomalies.append(AnomalyDetail(
                        id=anomaly_counter,
                        row_index=row_id,
                        timestamp=formatted_ts or str(raw_ts),
                        variable="Temperature",
                        observed_value=f"{temp_val} °C",
                        threshold_rule=f"[{self.config.temp_min}°C, {self.config.temp_max}°C]",
                        reason=reason_msg,
                        severity="Review Required" if abs(temp_val - self.config.temp_max) < 10 else "High",
                        status="Flagged for review"
                    ))
                    anomaly_counter += 1

            # --- C. Humidity ---
            hum_val, hum_ok, hum_err = parse_metric(row[mapping["humidity"]], "Humidity")
            if not hum_ok:
                is_valid = False
                reasons.append(hum_err)
                anomalies.append(AnomalyDetail(
                    id=anomaly_counter,
                    row_index=row_id,
                    timestamp=formatted_ts or str(raw_ts),
                    variable="Humidity",
                    observed_value=str(row[mapping["humidity"]]),
                    threshold_rule=f"{self.config.humidity_min}% to {self.config.humidity_max}%",
                    reason=hum_err,
                    severity="High",
                    status="Flagged for review"
                ))
                anomaly_counter += 1
            else:
                # Physical bounds check first (0% - 100%)
                if hum_val < 0.0 or hum_val > 100.0:
                    is_anomaly = True
                    reason_msg = f"Invalid humidity range: ({hum_val}% is outside physical 0-100% boundary)"
                    reasons.append(reason_msg)
                    anomalies.append(AnomalyDetail(
                        id=anomaly_counter,
                        row_index=row_id,
                        timestamp=formatted_ts or str(raw_ts),
                        variable="Humidity",
                        observed_value=f"{hum_val} %",
                        threshold_rule="Physical range [0%, 100%]",
                        reason=reason_msg,
                        severity="High",
                        status="Flagged for review"
                    ))
                    anomaly_counter += 1
                elif hum_val < self.config.humidity_min or hum_val > self.config.humidity_max:
                    is_anomaly = True
                    reason_msg = f"Outside configured range: Humidity ({hum_val}%)"
                    if hum_val > self.config.humidity_max:
                        reason_msg += f" exceeds configured threshold ({self.config.humidity_max}%)"
                    else:
                        reason_msg += f" below configured threshold ({self.config.humidity_min}%)"
                    reasons.append(reason_msg)
                    anomalies.append(AnomalyDetail(
                        id=anomaly_counter,
                        row_index=row_id,
                        timestamp=formatted_ts or str(raw_ts),
                        variable="Humidity",
                        observed_value=f"{hum_val} %",
                        threshold_rule=f"Configured [{self.config.humidity_min}%, {self.config.humidity_max}%]",
                        reason=reason_msg,
                        severity="Review Required",
                        status="Flagged for review"
                    ))
                    anomaly_counter += 1

            # --- D. Wind Speed ---
            wind_val, wind_ok, wind_err = parse_metric(row[mapping["wind_speed"]], "Wind Speed")
            if not wind_ok:
                is_valid = False
                reasons.append(wind_err)
                anomalies.append(AnomalyDetail(
                    id=anomaly_counter,
                    row_index=row_id,
                    timestamp=formatted_ts or str(raw_ts),
                    variable="Wind Speed",
                    observed_value=str(row[mapping["wind_speed"]]),
                    threshold_rule=f"{self.config.wind_speed_min} to {self.config.wind_speed_max} m/s",
                    reason=wind_err,
                    severity="High",
                    status="Flagged for review"
                ))
                anomaly_counter += 1
            else:
                # Physical negative check
                if wind_val < 0.0:
                    is_anomaly = True
                    reason_msg = f"Negative wind speed: ({wind_val} m/s < 0.0 m/s physical minimum)"
                    reasons.append(reason_msg)
                    anomalies.append(AnomalyDetail(
                        id=anomaly_counter,
                        row_index=row_id,
                        timestamp=formatted_ts or str(raw_ts),
                        variable="Wind Speed",
                        observed_value=f"{wind_val} m/s",
                        threshold_rule="Non-negative (>= 0.0 m/s)",
                        reason=reason_msg,
                        severity="High",
                        status="Flagged for review"
                    ))
                    anomaly_counter += 1
                elif wind_val > self.config.wind_speed_max:
                    is_anomaly = True
                    reason_msg = f"Outside configured range: Wind speed ({wind_val} m/s > {self.config.wind_speed_max} m/s)"
                    reasons.append(reason_msg)
                    anomalies.append(AnomalyDetail(
                        id=anomaly_counter,
                        row_index=row_id,
                        timestamp=formatted_ts or str(raw_ts),
                        variable="Wind Speed",
                        observed_value=f"{wind_val} m/s",
                        threshold_rule=f"Max {self.config.wind_speed_max} m/s",
                        reason=reason_msg,
                        severity="Review Required",
                        status="Flagged for review"
                    ))
                    anomaly_counter += 1

            # Determine row status text and code
            if not is_valid:
                status_text = "Invalid data"
                status_code = "INVALID"
            elif is_anomaly:
                status_text = "Anomaly - review"
                status_code = "ANOMALY"
            else:
                status_text = "Within configured range"
                status_code = "NORMAL"

            readings.append(AtmosphericReading(
                id=row_id,
                timestamp=formatted_ts or (str(raw_ts) if not pd.isna(raw_ts) else None),
                temperature_c=temp_val,
                humidity=hum_val,
                wind_speed=wind_val,
                status=status_text,
                status_code=status_code,
                is_valid=is_valid,
                is_anomaly=is_anomaly,
                reasons=reasons
            ))

        self.processed_readings = readings
        self.anomalies = anomalies
        self.last_processed = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        return {
            "total_records": len(readings),
            "anomalies_count": len(anomalies),
            "dataset_name": self.dataset_name
        }

    def get_summary(self) -> SummaryStats:
        """Returns dynamic summary stats and finds latest valid observation."""
        total = len(self.processed_readings)
        if total == 0:
            return SummaryStats(
                total_records=0,
                valid_records=0,
                invalid_records=0,
                anomaly_records=0,
                latest_valid_timestamp=None,
                latest_temperature=None,
                latest_humidity=None,
                latest_wind_speed=None,
                overall_status="NO DATA",
                dataset_name=self.dataset_name,
                is_sample_mode=True,
                last_processed=self.last_processed
            )

        valid_count = sum(1 for r in self.processed_readings if r.is_valid)
        invalid_count = total - valid_count
        anomaly_count = sum(1 for r in self.processed_readings if r.is_anomaly)

        # Locate latest VALID reading (searching in reverse order)
        latest_valid = None
        for r in reversed(self.processed_readings):
            if r.is_valid and r.temperature_c is not None and r.humidity is not None and r.wind_speed is not None:
                latest_valid = r
                break

        # Overall dataset health status
        if invalid_count > 0:
            overall_status = "INVALID DATA"
        elif anomaly_count > 0:
            overall_status = "ANOMALY"
        else:
            overall_status = "NORMAL"

        return SummaryStats(
            total_records=total,
            valid_records=valid_count,
            invalid_records=invalid_count,
            anomaly_records=anomaly_count,
            latest_valid_timestamp=latest_valid.timestamp if latest_valid else None,
            latest_temperature=latest_valid.temperature_c if latest_valid else None,
            latest_humidity=latest_valid.humidity if latest_valid else None,
            latest_wind_speed=latest_valid.wind_speed if latest_valid else None,
            overall_status=overall_status,
            dataset_name=self.dataset_name,
            is_sample_mode=True,
            last_processed=self.last_processed
        )

    def get_readings(
        self,
        search: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """Filterable, searchable, and paginated readings."""
        filtered = self.processed_readings

        if status and status.upper() != "ALL":
            st = status.upper()
            filtered = [r for r in filtered if r.status_code == st]

        if search:
            query = search.lower().strip()
            filtered = [
                r for r in filtered
                if (r.timestamp and query in r.timestamp.lower()) or
                   (r.status and query in r.status.lower()) or
                   any(query in reason.lower() for reason in r.reasons)
            ]

        total = len(filtered)
        total_pages = max(1, math.ceil(total / page_size)) if page_size > 0 else 1
        page = max(1, min(page, total_pages))
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "readings": filtered[start_idx:end_idx]
        }

    def get_anomaly_summary(self) -> AnomalySummary:
        """Returns anomaly breakdown by variable and reason."""
        by_var: Dict[str, int] = {}
        by_reason: Dict[str, int] = {}

        for a in self.anomalies:
            by_var[a.variable] = by_var.get(a.variable, 0) + 1
            
            # Categorize reason for clear charts/counts
            category = "Other"
            if "Negative wind speed" in a.reason:
                category = "Negative wind speed"
            elif "Invalid humidity range" in a.reason:
                category = "Invalid humidity range"
            elif "Outside configured range" in a.reason:
                category = "Outside configured range"
            elif "Missing" in a.reason:
                category = "Missing value"
            elif "Invalid numeric" in a.reason or "non-numeric" in a.reason:
                category = "Invalid numeric value"
            elif "Invalid timestamp" in a.reason:
                category = "Invalid timestamp"
            else:
                category = a.reason[:35]

            by_reason[category] = by_reason.get(category, 0) + 1

        return AnomalySummary(
            total_anomalies=len(self.anomalies),
            by_variable=by_var,
            by_reason=by_reason,
            anomalies=self.anomalies
        )

    def export_processed_csv(self) -> str:
        """
        Exports processed dataset as CSV matching Figure B.2 format:
        timestamp,temperature_c,humidity,wind_speed,status
        """
        rows = []
        for r in self.processed_readings:
            rows.append({
                "timestamp": r.timestamp if r.timestamp is not None else "",
                "temperature_c": r.temperature_c if r.temperature_c is not None else "",
                "humidity": r.humidity if r.humidity is not None else "",
                "wind_speed": r.wind_speed if r.wind_speed is not None else "",
                "status": r.status
            })
        df_export = pd.DataFrame(rows)
        return df_export.to_csv(index=False)

    def export_anomalies_csv(self) -> str:
        """Exports anomaly records with audit details."""
        rows = []
        for a in self.anomalies:
            rows.append({
                "timestamp": a.timestamp or "N/A",
                "variable": a.variable,
                "observed_value": a.observed_value or "Missing",
                "threshold_rule": a.threshold_rule,
                "reason": a.reason,
                "severity": a.severity,
                "status": a.status
            })
        df_export = pd.DataFrame(rows)
        return df_export.to_csv(index=False)
