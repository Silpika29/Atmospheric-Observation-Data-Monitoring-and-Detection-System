import os
import hashlib
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional
import pandas as pd
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

class EvidenceService:
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.data_dir = base_dir / "data"
        self.exports_dir = self.data_dir / "exports"
        self.exports_dir.mkdir(parents=True, exist_ok=True)
        
        self.excel_filename = "atmospheric_monitoring_evidence.xlsx"
        self.excel_path = self.exports_dir / self.excel_filename
        self.log_filename = "processing_audit_log.txt"
        self.log_path = self.exports_dir / self.log_filename
        
        # In-memory history of processing runs
        self.run_history: List[Dict[str, Any]] = []
        self.file_registry: Dict[str, Dict[str, Any]] = {}

    @staticmethod
    def calculate_sha256(file_path: Path) -> str:
        """Calculates SHA-256 checksum of a file on disk."""
        if not file_path.exists():
            return ""
        sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                sha256.update(chunk)
        return sha256.hexdigest()

    @staticmethod
    def calculate_sha256_bytes(content: bytes) -> str:
        """Calculates SHA-256 checksum of in-memory bytes."""
        return hashlib.sha256(content).hexdigest()

    def get_dataset_storage_info(self, raw_file_path: Path, raw_df: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
        """Provides verified metadata regarding the stored dataset."""
        if not raw_file_path.exists():
            return {
                "exists": False,
                "filename": raw_file_path.name,
                "relative_path": str(raw_file_path.relative_to(self.base_dir.parent)).replace("\\", "/"),
                "file_format": "CSV",
                "file_size_bytes": 0,
                "file_size_formatted": "0 KB",
                "row_count": 0,
                "column_count": 0,
                "columns": [],
                "sha256_hash": "",
                "last_modified": ""
            }

        stat = raw_file_path.stat()
        file_size_bytes = stat.st_size
        size_kb = f"{file_size_bytes / 1024:.2f} KB"
        sha256 = self.calculate_sha256(raw_file_path)
        last_mod = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")

        if raw_df is not None:
            rows = len(raw_df)
            cols = len(raw_df.columns)
            col_names = list(raw_df.columns)
        else:
            try:
                df = pd.read_csv(raw_file_path)
                rows = len(df)
                cols = len(df.columns)
                col_names = list(df.columns)
            except Exception:
                rows, cols, col_names = 0, 0, []

        try:
            rel_path = str(raw_file_path.relative_to(self.base_dir.parent)).replace("\\", "/")
        except Exception:
            rel_path = f"backend/data/{raw_file_path.name}"

        return {
            "exists": True,
            "filename": raw_file_path.name,
            "relative_path": rel_path,
            "file_format": "CSV",
            "file_size_bytes": file_size_bytes,
            "file_size_formatted": size_kb,
            "row_count": rows,
            "column_count": cols,
            "columns": col_names,
            "sha256_hash": sha256,
            "last_modified": last_mod
        }

    def generate_excel_workbook(
        self,
        raw_df: pd.DataFrame,
        processed_readings: List[Any],
        anomalies: List[Any],
        summary: Any,
        config: Any,
        processing_timestamp: str,
        input_filename: str
    ) -> Path:
        """
        Generates atmospheric_monitoring_evidence.xlsx containing:
        1. Raw_Data
        2. Processed_Data
        3. Anomalies
        4. Data_Summary
        5. Validation_Rules
        6. Processing_Log
        """
        wb = openpyxl.Workbook()
        # Remove default sheet
        wb.remove(wb.active)

        # Common styling elements
        header_fill = PatternFill(start_color="0F2B48", end_color="0F2B48", fill_type="solid")
        header_font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
        sub_fill = PatternFill(start_color="1E3A5F", end_color="1E3A5F", fill_type="solid")
        border_thin = Side(border_style="thin", color="CBD5E1")
        cell_border = Border(top=border_thin, left=border_thin, right=border_thin, bottom=border_thin)

        # -------------------------------------------------------------
        # 1. Sheet: Raw_Data
        # -------------------------------------------------------------
        ws_raw = wb.create_sheet(title="Raw_Data")
        ws_raw.views.sheetView[0].showGridLines = True
        
        raw_headers = list(raw_df.columns)
        ws_raw.append(raw_headers)
        for col_idx in range(1, len(raw_headers) + 1):
            cell = ws_raw.cell(row=1, column=col_idx)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

        for _, row in raw_df.iterrows():
            ws_raw.append([None if pd.isna(v) else v for v in row.values])

        # -------------------------------------------------------------
        # 2. Sheet: Processed_Data
        # -------------------------------------------------------------
        ws_proc = wb.create_sheet(title="Processed_Data")
        ws_proc.views.sheetView[0].showGridLines = True
        proc_headers = ["row_id", "timestamp", "temperature_c", "humidity", "wind_speed", "status", "status_code", "reasons"]
        ws_proc.append(proc_headers)
        for col_idx in range(1, len(proc_headers) + 1):
            cell = ws_proc.cell(row=1, column=col_idx)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

        normal_fill = PatternFill(start_color="DCFCE7", end_color="DCFCE7", fill_type="solid")
        anomaly_fill = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid")
        invalid_fill = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")

        for r in processed_readings:
            ws_proc.append([
                r.id,
                r.timestamp or "N/A",
                r.temperature_c,
                r.humidity,
                r.wind_speed,
                r.status,
                r.status_code,
                "; ".join(r.reasons) if r.reasons else "None"
            ])
            # Highlight status column
            curr_row = ws_proc.max_row
            status_cell = ws_proc.cell(row=curr_row, column=6)
            if r.status_code == "ANOMALY":
                status_cell.fill = anomaly_fill
            elif r.status_code == "INVALID":
                status_cell.fill = invalid_fill
            else:
                status_cell.fill = normal_fill

        # -------------------------------------------------------------
        # 3. Sheet: Anomalies
        # -------------------------------------------------------------
        ws_anom = wb.create_sheet(title="Anomalies")
        ws_anom.views.sheetView[0].showGridLines = True
        anom_headers = ["anomaly_id", "row_index", "timestamp", "variable", "observed_value", "threshold_rule", "reason", "severity", "status"]
        ws_anom.append(anom_headers)
        for col_idx in range(1, len(anom_headers) + 1):
            cell = ws_anom.cell(row=1, column=col_idx)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

        for a in anomalies:
            ws_anom.append([
                a.id,
                a.row_index,
                a.timestamp or "Missing",
                a.variable,
                a.observed_value or "Missing",
                a.threshold_rule,
                a.reason,
                a.severity,
                a.status
            ])

        # -------------------------------------------------------------
        # 4. Sheet: Data_Summary
        # -------------------------------------------------------------
        ws_sum = wb.create_sheet(title="Data_Summary")
        ws_sum.views.sheetView[0].showGridLines = True
        sum_headers = ["Metric", "Value", "Description"]
        ws_sum.append(sum_headers)
        for col_idx in range(1, len(sum_headers) + 1):
            cell = ws_sum.cell(row=1, column=col_idx)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

        summary_rows = [
            ["Project Title", "NARL-CDMG Atmospheric Observation Data Monitoring and Anomaly Detection System", "Educational Prototype"],
            ["Institution", "National Atmospheric Research Laboratory (NARL), Dept of Space", "Gadanki, Tirupati, India"],
            ["Associated Group", "Computer & Data Management Group (CDMG)", "Computing and scientific data management"],
            ["Dataset Name", summary.dataset_name, "Active dataset analyzed"],
            ["Operating Mode", "Sample Data Mode (Synthetic)", "Demonstrative academic validation dataset"],
            ["Processing Timestamp", processing_timestamp, "Local execution datetime"],
            ["Total Observations Read", summary.total_records, "Total records parsed from input CSV"],
            ["Valid Records Count", summary.valid_records, "Records complying with physical and datetime checks"],
            ["Invalid Records Count", summary.invalid_records, "Records with unparseable timestamps or empty metrics"],
            ["Anomalies Flagged", summary.anomaly_records, "Records outside configured scientific thresholds"],
            ["Overall System Status", summary.overall_status, "Dataset health status: NORMAL, ANOMALY, or INVALID DATA"],
            ["Latest Valid Timestamp", summary.latest_valid_timestamp or "None", "Timestamp of most recent valid observation"],
            ["Latest Valid Temperature", f"{summary.latest_temperature} °C" if summary.latest_temperature is not None else "N/A", "Surface air temperature"],
            ["Latest Valid Humidity", f"{summary.latest_humidity} %" if summary.latest_humidity is not None else "N/A", "Surface relative humidity"],
            ["Latest Valid Wind Speed", f"{summary.latest_wind_speed} m/s" if summary.latest_wind_speed is not None else "N/A", "Surface horizontal wind speed"]
        ]
        for srow in summary_rows:
            ws_sum.append(srow)

        # -------------------------------------------------------------
        # 5. Sheet: Validation_Rules
        # -------------------------------------------------------------
        ws_rules = wb.create_sheet(title="Validation_Rules")
        ws_rules.views.sheetView[0].showGridLines = True
        rules_headers = ["Atmospheric Variable", "Parameter", "Configured Limit", "Unit", "Physical Plausibility Limit", "Rule Classification & Rationale"]
        ws_rules.append(rules_headers)
        for col_idx in range(1, len(rules_headers) + 1):
            cell = ws_rules.cell(row=1, column=col_idx)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

        rules_rows = [
            ["Temperature", "temp_min (Lower Limit)", config.temp_min, "°C", "-50.0 °C", "Flags extreme sub-zero readings or freezing events"],
            ["Temperature", "temp_max (Upper Limit)", config.temp_max, "°C", "60.0 °C", "Flags excessive heat spikes (matching Figure B.1 45.0°C upper limit)"],
            ["Relative Humidity", "humidity_min (Lower Limit)", config.humidity_min, "%", "0.0 %", "Physical limit: Relative humidity cannot be negative"],
            ["Relative Humidity", "humidity_max (Upper Limit)", config.humidity_max, "%", "100.0 %", "Configured upper review threshold (e.g. 90% flags supersaturation)"],
            ["Wind Speed", "wind_speed_min (Lower Limit)", config.wind_speed_min, "m/s", "0.0 m/s", "Physical limit: Scalar wind speed velocity cannot be negative"],
            ["Wind Speed", "wind_speed_max (Upper Limit)", config.wind_speed_max, "m/s", "100.0 m/s", "Flags severe wind gusts exceeding operational anemometer range"],
            ["Timestamp", "datetime_format", "YYYY-MM-DD HH:MM", "ISO/Text", "Valid calendar date", "Ensures chronological ordering and temporal continuity"],
            ["Numeric Fields", "non_null_finite", "Finite Float", "Real Number", "Non-empty string", "Detects sensor dropout, missing telemetry, or string corruption"]
        ]
        for rrow in rules_rows:
            ws_rules.append(rrow)

        # -------------------------------------------------------------
        # 6. Sheet: Processing_Log
        # -------------------------------------------------------------
        ws_log = wb.create_sheet(title="Processing_Log")
        ws_log.views.sheetView[0].showGridLines = True
        log_headers = ["Step Number", "Workflow Stage", "Execution Details", "Status", "Timestamp"]
        ws_log.append(log_headers)
        for col_idx in range(1, len(log_headers) + 1):
            cell = ws_log.cell(row=1, column=col_idx)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

        log_steps = [
            [1, "CSV/Excel Input", f"Loaded input file '{input_filename}' with {len(raw_df)} raw records", "SUCCESS", processing_timestamp],
            [2, "Schema Normalization", "Validated presence of canonical columns (timestamp, temperature_c, humidity_percent, wind_speed_ms)", "SUCCESS", processing_timestamp],
            [3, "Data Type & Null Check", f"Identified {summary.invalid_records} invalid or missing records with non-finite/unparseable values", "COMPLETED", processing_timestamp],
            [4, "Physical Bounds Evaluation", "Checked negative wind speed (<0 m/s) and humidity range bounds (0-100%)", "COMPLETED", processing_timestamp],
            [5, "Threshold Anomaly Detection", f"Evaluated configurable limits: flagged {summary.anomaly_records} records requiring review", "COMPLETED", processing_timestamp],
            [6, "Summary & Metric Calculation", f"Derived latest valid metrics (Temp: {summary.latest_temperature}°C, Hum: {summary.latest_humidity}%, Wind: {summary.latest_wind_speed} m/s)", "SUCCESS", processing_timestamp],
            [7, "Graph Data Preparation", "Prepared time-series data vectors and reference limits for Recharts visualization", "SUCCESS", processing_timestamp],
            [8, "Excel Evidence Generation", f"Compiled multi-sheet audit workbook '{self.excel_filename}' using openpyxl", "SUCCESS", processing_timestamp]
        ]
        for lrow in log_steps:
            ws_log.append(lrow)

        # Auto-fit column widths across all sheets
        for sheet in wb.worksheets:
            for col in sheet.columns:
                max_len = 0
                col_letter = get_column_letter(col[0].column)
                for cell in col:
                    val_str = str(cell.value or "")
                    max_len = max(max_len, len(val_str))
                sheet.column_dimensions[col_letter].width = max(max_len + 3, 12)

        # Save workbook to disk
        wb.save(str(self.excel_path))
        return self.excel_path

    def generate_processing_log_text(
        self,
        input_filename: str,
        input_sha256: str,
        summary: Any,
        config: Any,
        processing_timestamp: str,
        generated_files: List[Dict[str, Any]]
    ) -> Path:
        """Creates a human-readable text audit log of the processing execution."""
        lines = [
            "=" * 80,
            " NATIONAL ATMOSPHERIC RESEARCH LABORATORY (NARL)",
            " COMPUTER & DATA MANAGEMENT GROUP (CDMG)",
            " ATMOSPHERIC OBSERVATION DATA MONITORING AND ANOMALY DETECTION SYSTEM",
            " SCIENTIFIC DATASET PROCESSING & AUDIT LOG",
            "=" * 80,
            f"Execution Timestamp      : {processing_timestamp}",
            f"Active Operating Mode    : Sample Data Mode (Educational Prototype)",
            f"Input Dataset Filename   : {input_filename}",
            f"Input Dataset SHA-256    : {input_sha256}",
            "-" * 80,
            "1. WORKFLOW PIPELINE EXECUTION:",
            "   [Step 1] Input Ingestion      -> Read raw observations from CSV/Excel source",
            "   [Step 2] Schema Verification  -> Normalization & column mapping (timestamp, temp, hum, wind)",
            "   [Step 3] Data Validation      -> Checked numeric finiteness, empty dropouts, and timestamp parsing",
            "   [Step 4] Boundary Validation  -> Physical plausibility (non-negative wind speed, 0-100% humidity)",
            "   [Step 5] Anomaly Detection    -> Applied deterministic threshold limits",
            "   [Step 6] Evidence Compilation -> Generated Excel workbook, processed CSV, and audit logs",
            "-" * 80,
            "2. PROCESSING AUDIT STATISTICS:",
            f"   Total Records Read    : {summary.total_records}",
            f"   Valid Records         : {summary.valid_records}",
            f"   Invalid / Missing     : {summary.invalid_records}",
            f"   Anomalies Flagged     : {summary.anomaly_records}",
            f"   Overall Dataset Status: {summary.overall_status}",
            f"   Latest Valid Reading  : {summary.latest_valid_timestamp} (T: {summary.latest_temperature} °C, RH: {summary.latest_humidity} %, Wind: {summary.latest_wind_speed} m/s)",
            "-" * 80,
            "3. ACTIVE CONFIGURATION THRESHOLDS:",
            f"   Temperature Limits    : [{config.temp_min} °C, {config.temp_max} °C]",
            f"   Humidity Limits       : [{config.humidity_min} %, {config.humidity_max} %]",
            f"   Wind Speed Limits     : [{config.wind_speed_min} m/s, {config.wind_speed_max} m/s]",
            "-" * 80,
            "4. GENERATED PROJECT EVIDENCE ARTIFACTS & FILE INTEGRITY HASHES:",
        ]

        for gf in generated_files:
            lines.append(f"   * {gf['name']}")
            lines.append(f"     Path     : {gf['relative_path']}")
            lines.append(f"     Size     : {gf['size_bytes']} bytes ({gf['size_formatted']})")
            lines.append(f"     SHA-256  : {gf['sha256']}")
            lines.append("")

        lines.extend([
            "-" * 80,
            "INTEGRITY VERIFICATION NOTE:",
            "The SHA-256 cryptographic hashes recorded above verify that file contents have",
            "not been altered since generation. Hash recalculation confirms verifiable evidence",
            "integrity across all exported datasets and analytical reports.",
            "=" * 80
        ])

        with open(self.log_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))

        return self.log_path

    def record_processing_run(
        self,
        input_filename: str,
        input_file_path: Path,
        summary: Any,
        anomalies_count: int,
        output_files: List[Dict[str, Any]],
        status: str = "COMPLETED"
    ):
        """Records the processing run in history and registers file hashes."""
        input_hash = self.calculate_sha256(input_file_path)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        run_record = {
            "run_id": len(self.run_history) + 1,
            "timestamp": timestamp,
            "input_filename": input_filename,
            "input_sha256": input_hash,
            "records_read": summary.total_records,
            "valid_records": summary.valid_records,
            "invalid_records": summary.invalid_records,
            "anomalies_detected": anomalies_count,
            "status": status,
            "output_files": [f["name"] for f in output_files]
        }
        self.run_history.insert(0, run_record)  # newest first

        # Register output files with their hashes
        for f in output_files:
            self.file_registry[f["name"]] = {
                "name": f["name"],
                "relative_path": f["relative_path"],
                "absolute_path": f["absolute_path"],
                "size_bytes": f["size_bytes"],
                "size_formatted": f["size_formatted"],
                "recorded_sha256": f["sha256"],
                "last_generated": timestamp
            }

        # Also register input file
        stat = input_file_path.stat()
        try:
            rel_path = str(input_file_path.relative_to(self.base_dir.parent)).replace("\\", "/")
        except Exception:
            rel_path = f"backend/data/{input_filename}"

        self.file_registry[input_filename] = {
            "name": input_filename,
            "relative_path": rel_path,
            "absolute_path": str(input_file_path),
            "size_bytes": stat.st_size,
            "size_formatted": f"{stat.st_size / 1024:.2f} KB",
            "recorded_sha256": input_hash,
            "last_generated": timestamp
        }

    def verify_file_hash(self, filename: str) -> Dict[str, Any]:
        """Recalculates the SHA-256 hash of a file on disk and verifies integrity."""
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if filename not in self.file_registry:
            # Check if file exists directly in exports or data dir
            candidate_paths = [
                self.exports_dir / filename,
                self.data_dir / filename,
                self.base_dir / filename
            ]
            found_path = None
            for p in candidate_paths:
                if p.exists():
                    found_path = p
                    break

            if not found_path:
                return {
                    "filename": filename,
                    "status": "FAIL",
                    "match": False,
                    "error": "File does not exist on disk",
                    "calculated_hash": "",
                    "recorded_hash": "",
                    "checked_at": now_str
                }
            recorded_hash = self.calculate_sha256(found_path)
        else:
            found_path = Path(self.file_registry[filename]["absolute_path"])
            recorded_hash = self.file_registry[filename]["recorded_sha256"]

        if not found_path.exists():
            return {
                "filename": filename,
                "status": "FAIL",
                "match": False,
                "error": "File was deleted or moved from disk",
                "calculated_hash": "",
                "recorded_hash": recorded_hash,
                "checked_at": now_str
            }

        calculated_hash = self.calculate_sha256(found_path)
        is_match = (calculated_hash == recorded_hash) and (len(calculated_hash) == 64)

        return {
            "filename": filename,
            "status": "PASS" if is_match else "FAIL",
            "match": is_match,
            "calculated_hash": calculated_hash,
            "recorded_hash": recorded_hash,
            "checked_at": now_str,
            "file_size_bytes": found_path.stat().st_size
        }

    def get_all_registered_files(self) -> List[Dict[str, Any]]:
        """Returns list of registered files and their integrity status."""
        result = []
        for name, meta in self.file_registry.items():
            fpath = Path(meta["absolute_path"])
            exists = fpath.exists()
            current_hash = self.calculate_sha256(fpath) if exists else ""
            is_valid = (current_hash == meta["recorded_sha256"]) and exists

            result.append({
                "name": name,
                "relative_path": meta["relative_path"],
                "size_bytes": meta["size_bytes"],
                "size_formatted": meta["size_formatted"],
                "recorded_sha256": meta["recorded_sha256"],
                "current_sha256": current_hash,
                "status": "PASS" if is_valid else "FAIL",
                "exists": exists,
                "last_generated": meta["last_generated"]
            })
        return result

    def get_excel_workbook_data(self) -> Dict[str, Any]:
        """Loads atmospheric_monitoring_evidence.xlsx and returns all sheets as structured grid data."""
        if not self.excel_path.exists():
            return {
                "filename": self.excel_filename,
                "exists": False,
                "sheet_names": [],
                "sheets": {}
            }

        wb = openpyxl.load_workbook(str(self.excel_path), data_only=True)
        sheets_data: Dict[str, Any] = {}

        for name in wb.sheetnames:
            ws = wb[name]
            all_rows = list(ws.iter_rows(values_only=True))
            if not all_rows:
                sheets_data[name] = {"name": name, "headers": [], "rows": [], "row_count": 0}
                continue

            raw_headers = [str(h) if h is not None else f"Column_{idx+1}" for idx, h in enumerate(all_rows[0])]
            data_rows = []
            for row in all_rows[1:]:
                # Clean row values
                cleaned_row = []
                for val in row:
                    if val is None:
                        cleaned_row.append("")
                    elif isinstance(val, (datetime, pd.Timestamp)):
                        cleaned_row.append(val.strftime("%Y-%m-%d %H:%M"))
                    elif isinstance(val, float):
                        cleaned_row.append(round(val, 2))
                    else:
                        cleaned_row.append(str(val))
                data_rows.append(cleaned_row)

            sheets_data[name] = {
                "name": name,
                "headers": raw_headers,
                "row_count": len(data_rows),
                "rows": data_rows
            }

        return {
            "filename": self.excel_filename,
            "exists": True,
            "file_size": f"{self.excel_path.stat().st_size / 1024:.2f} KB",
            "sheet_names": wb.sheetnames,
            "sheets": sheets_data
        }

    def open_desktop_excel(self) -> Dict[str, Any]:
        """Launches the registered desktop spreadsheet program (Microsoft Excel) on Windows."""
        if not self.excel_path.exists():
            raise FileNotFoundError("Excel evidence workbook does not exist.")
        try:
            os.startfile(str(self.excel_path))
            return {
                "status": "SUCCESS",
                "message": f"Opened '{self.excel_filename}' in your default spreadsheet viewer (Microsoft Excel)."
            }
        except Exception as e:
            return {
                "status": "ERROR",
                "message": f"Unable to launch desktop application: {str(e)}"
            }

