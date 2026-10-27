import os
from pathlib import Path
from typing import Optional
from datetime import datetime
import pandas as pd

from services.data_processor import DataProcessor
from services.evidence_service import EvidenceService
from schemas.models import ThresholdConfig

class StateManager:
    _instance = None

    def __init__(self):
        self.config = ThresholdConfig()
        self.processor = DataProcessor(self.config)
        self.base_dir = Path(__file__).resolve().parent.parent
        self.data_dir = self.base_dir / "data"
        self.uploads_dir = self.data_dir / "uploads"
        self.uploads_dir.mkdir(parents=True, exist_ok=True)
        self.exports_dir = self.data_dir / "exports"
        self.exports_dir.mkdir(parents=True, exist_ok=True)

        self.sample_csv_path = self.data_dir / "sample_atmospheric_data.csv"
        self.current_input_path = self.sample_csv_path
        self.current_input_filename = "sample_atmospheric_data.csv"

        self.evidence = EvidenceService(self.base_dir)
        self.load_sample_data()

    def compile_evidence(self):
        """Generates all evidence exports, logs, and SHA-256 hashes for the current processed state."""
        if self.processor.raw_df is None or not self.processor.processed_readings:
            return

        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        summary = self.processor.get_summary()

        # 1. Save Processed CSV
        proc_csv_str = self.processor.export_processed_csv()
        proc_csv_path = self.exports_dir / "processed_atmospheric_data.csv"
        with open(proc_csv_path, "w", encoding="utf-8") as f:
            f.write(proc_csv_str)
        
        # Also copy to base_dir for CLI demonstration backward compatibility
        try:
            with open(self.base_dir / "processed_atmospheric_data.csv", "w", encoding="utf-8") as f:
                f.write(proc_csv_str)
        except Exception:
            pass

        # 2. Save Anomalies CSV
        anom_csv_str = self.processor.export_anomalies_csv()
        anom_csv_path = self.exports_dir / "atmospheric_anomalies_report.csv"
        with open(anom_csv_path, "w", encoding="utf-8") as f:
            f.write(anom_csv_str)

        # 3. Generate Excel Workbook
        excel_path = self.evidence.generate_excel_workbook(
            raw_df=self.processor.raw_df,
            processed_readings=self.processor.processed_readings,
            anomalies=self.processor.anomalies,
            summary=summary,
            config=self.config,
            processing_timestamp=now_str,
            input_filename=self.current_input_filename
        )

        # Calculate hashes & metadata for outputs
        def make_meta(path: Path):
            stat = path.stat()
            try:
                rel = str(path.relative_to(self.base_dir.parent)).replace("\\", "/")
            except Exception:
                rel = f"backend/data/exports/{path.name}"
            return {
                "name": path.name,
                "relative_path": rel,
                "absolute_path": str(path),
                "size_bytes": stat.st_size,
                "size_formatted": f"{stat.st_size / 1024:.2f} KB",
                "sha256": EvidenceService.calculate_sha256(path)
            }

        output_files = [
            make_meta(proc_csv_path),
            make_meta(anom_csv_path),
            make_meta(excel_path)
        ]

        # 4. Generate Processing Audit Log (Text)
        input_sha256 = EvidenceService.calculate_sha256(self.current_input_path) if self.current_input_path.exists() else ""
        log_path = self.evidence.generate_processing_log_text(
            input_filename=self.current_input_filename,
            input_sha256=input_sha256,
            summary=summary,
            config=self.config,
            processing_timestamp=now_str,
            generated_files=output_files
        )
        output_files.append(make_meta(log_path))

        # 5. Record Run in Evidence History & File Registry
        self.evidence.record_processing_run(
            input_filename=self.current_input_filename,
            input_file_path=self.current_input_path,
            summary=summary,
            anomalies_count=len(self.processor.anomalies),
            output_files=output_files,
            status="COMPLETED"
        )

    def load_sample_data(self):
        if self.sample_csv_path.exists():
            with open(self.sample_csv_path, "rb") as f:
                content = f.read()
            self.current_input_path = self.sample_csv_path
            self.current_input_filename = "sample_atmospheric_data.csv"
            self.processor.load_and_process_csv(content, filename=self.current_input_filename)
            self.compile_evidence()
        else:
            raise FileNotFoundError(f"Sample data file not found at {self.sample_csv_path}")

    def load_custom_data(self, file_content: bytes, filename: str):
        """Preserves uploaded file in uploads dir, processes it, and generates evidence."""
        safe_filename = filename.replace("..", "").replace("/", "").replace("\\", "")
        dest_path = self.uploads_dir / safe_filename
        with open(dest_path, "wb") as f:
            f.write(file_content)

        self.current_input_path = dest_path
        self.current_input_filename = safe_filename
        res = self.processor.load_and_process_csv(file_content, filename=safe_filename)
        self.compile_evidence()
        return res

    def update_thresholds(self, new_config: ThresholdConfig):
        self.config = new_config
        self.processor.set_config(new_config)
        # Reprocess current raw dataframe if available
        if self.processor.raw_df is not None:
            csv_buf = self.processor.raw_df.to_csv(index=False).encode("utf-8")
            self.processor.load_and_process_csv(csv_buf, filename=self.processor.dataset_name)
            self.compile_evidence()

    def reset_dataset(self):
        self.load_sample_data()

# Global singleton
state = StateManager()
