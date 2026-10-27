from fastapi import APIRouter, UploadFile, File, Query, HTTPException, status, Body
from fastapi.responses import Response, FileResponse
from typing import Optional, Dict, Any
from pathlib import Path
import pandas as pd

from services.state_manager import state
from schemas.models import (
    ThresholdConfig,
    SummaryStats,
    PaginatedReadingsResponse,
    AnomalySummary,
)

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "NARL-CDMG Atmospheric Observation Data Monitoring System",
        "mode": "Sample Data Mode",
        "description": "Educational prototype for scientific data validation and anomaly detection",
        "institution": "National Atmospheric Research Laboratory (NARL)",
        "group": "Computer & Data Management Group (CDMG)"
    }

@router.get("/api/summary", response_model=SummaryStats)
def get_summary():
    return state.processor.get_summary()

@router.get("/api/readings", response_model=PaginatedReadingsResponse)
def get_readings(
    search: Optional[str] = Query(None, description="Search term for timestamp, status, or reason"),
    status: Optional[str] = Query("ALL", description="Filter by status code: ALL, NORMAL, ANOMALY, INVALID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=1000, description="Readings per page")
):
    result = state.processor.get_readings(search=search, status=status, page=page, page_size=page_size)
    return PaginatedReadingsResponse(**result)

@router.get("/api/anomalies", response_model=AnomalySummary)
def get_anomalies():
    return state.processor.get_anomaly_summary()

@router.get("/api/config", response_model=ThresholdConfig)
def get_config():
    return state.config

@router.put("/api/config", response_model=ThresholdConfig)
def update_config(new_config: ThresholdConfig):
    try:
        state.update_thresholds(new_config)
        return state.config
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/api/upload")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only CSV (.csv) files are supported."
        )

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty. Please provide a valid atmospheric CSV file."
            )
        
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds the 10MB limit."
            )

        result = state.load_custom_data(content, filename=file.filename)
        return {
            "message": "File successfully uploaded, stored, and processed.",
            "filename": file.filename,
            "total_records": result["total_records"],
            "anomalies_detected": result["anomalies_count"]
        }
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Processing failed: {str(e)}")

@router.post("/api/reset")
def reset_to_sample_data():
    try:
        state.reset_dataset()
        return {
            "message": "Dataset successfully reset to bundled sample demonstration data.",
            "dataset_name": state.processor.dataset_name,
            "records_count": len(state.processor.processed_readings)
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/api/export")
def export_processed_csv():
    try:
        csv_data = state.processor.export_processed_csv()
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="processed_atmospheric_data.csv"'}
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/api/export/anomalies")
def export_anomalies_csv():
    try:
        csv_data = state.processor.export_anomalies_csv()
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="atmospheric_anomalies_report.csv"'}
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# =========================================================================
# DATASET STORAGE & PROJECT EVIDENCE API ENDPOINTS
# =========================================================================

@router.get("/api/evidence/storage-info")
def get_dataset_storage_info():
    """Returns verifiable storage details of the active input dataset."""
    return state.evidence.get_dataset_storage_info(
        raw_file_path=state.current_input_path,
        raw_df=state.processor.raw_df
    )

@router.get("/api/evidence/files")
def get_registered_files():
    """Returns list of registered project files with size, path, and SHA-256 integrity status."""
    return state.evidence.get_all_registered_files()

@router.post("/api/evidence/verify-hash")
def verify_file_hash(payload: Dict[str, str] = Body(...)):
    """Recalculates SHA-256 of file on disk and verifies against recorded checksum."""
    filename = payload.get("filename")
    if not filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing 'filename' parameter in request body.")
    return state.evidence.verify_file_hash(filename)

@router.get("/api/evidence/history")
def get_processing_history():
    """Returns history log of dataset processing runs."""
    return state.evidence.run_history

@router.get("/api/evidence/raw-preview")
def get_raw_dataset_preview(limit: int = 20):
    """Returns the first N rows of the raw input dataset for side-by-side inspection."""
    if state.processor.raw_df is None:
        return {"columns": [], "rows": []}
    preview_df = state.processor.raw_df.head(limit)
    records = []
    for _, row in preview_df.iterrows():
        records.append({col: None if (pd.isna(val) if 'pd' in locals() else str(val).lower() == 'nan') else val for col, val in row.items()})
    return {
        "columns": list(state.processor.raw_df.columns),
        "total_rows": len(state.processor.raw_df),
        "preview_count": len(records),
        "rows": records
    }

@router.get("/api/evidence/excel")
def download_evidence_excel():
    """Downloads atmospheric_monitoring_evidence.xlsx containing all 6 audit sheets."""
    excel_path = state.evidence.excel_path
    if not excel_path.exists():
        state.compile_evidence()
    if not excel_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidence workbook could not be located.")

    return FileResponse(
        path=str(excel_path),
        filename="atmospheric_monitoring_evidence.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@router.get("/api/evidence/raw-csv")
def download_raw_dataset_csv():
    """Downloads the original raw input CSV dataset."""
    if not state.current_input_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Raw input dataset not found.")
    return FileResponse(
        path=str(state.current_input_path),
        filename=state.current_input_filename,
        media_type="text/csv"
    )

@router.get("/api/evidence/log")
def download_processing_log():
    """Downloads the processing audit log text file."""
    log_path = state.evidence.log_path
    if not log_path.exists():
        state.compile_evidence()
    if not log_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Processing audit log not found.")
    return FileResponse(
        path=str(log_path),
        filename="processing_audit_log.txt",
        media_type="text/plain"
    )

@router.get("/api/evidence/excel-data")
def get_excel_sheet_data():
    """Returns parsed data for all 6 sheets from atmospheric_monitoring_evidence.xlsx."""
    excel_path = state.evidence.excel_path
    if not excel_path.exists():
        state.compile_evidence()
    return state.evidence.get_excel_workbook_data()

@router.post("/api/evidence/open-local-excel")
def open_desktop_excel_application():
    """Launches Microsoft Excel with atmospheric_monitoring_evidence.xlsx on Windows."""
    try:
        return state.evidence.open_desktop_excel()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

