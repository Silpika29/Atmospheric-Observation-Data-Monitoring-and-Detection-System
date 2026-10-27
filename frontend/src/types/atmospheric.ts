export interface AtmosphericReading {
  id: number;
  timestamp: string | null;
  temperature_c: number | null;
  humidity: number | null;
  wind_speed: number | null;
  status: string;
  status_code: 'NORMAL' | 'ANOMALY' | 'INVALID';
  is_valid: boolean;
  is_anomaly: boolean;
  reasons: string[];
}

export interface AnomalyDetail {
  id: number;
  row_index: number;
  timestamp: string | null;
  variable: string;
  observed_value: string | null;
  threshold_rule: string;
  reason: string;
  severity: string;
  status: string;
}

export interface SummaryStats {
  total_records: number;
  valid_records: number;
  invalid_records: number;
  anomaly_records: number;
  latest_valid_timestamp: string | null;
  latest_temperature: number | null;
  latest_humidity: number | null;
  latest_wind_speed: number | null;
  overall_status: string;
  dataset_name: string;
  is_sample_mode: boolean;
  last_processed: string;
}

export interface ThresholdConfig {
  temp_min: number;
  temp_max: number;
  humidity_min: number;
  humidity_max: number;
  wind_speed_min: number;
  wind_speed_max: number;
}

export interface PaginatedReadingsResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  readings: AtmosphericReading[];
}

export interface AnomalySummary {
  total_anomalies: number;
  by_variable: Record<string, number>;
  by_reason: Record<string, number>;
  anomalies: AnomalyDetail[];
}

export interface HealthStatus {
  status: string;
  service: string;
  mode: string;
  description: string;
  institution: string;
  group: string;
}

// =========================================================================
// DATASET STORAGE & EVIDENCE TYPES
// =========================================================================

export interface DatasetStorageInfo {
  exists: boolean;
  filename: string;
  relative_path: string;
  file_format: string;
  file_size_bytes: number;
  file_size_formatted: string;
  row_count: number;
  column_count: number;
  columns: string[];
  sha256_hash: string;
  last_modified: string;
}

export interface EvidenceFileRecord {
  name: string;
  relative_path: string;
  size_bytes: number;
  size_formatted: string;
  recorded_sha256: string;
  current_sha256: string;
  status: 'PASS' | 'FAIL';
  exists: boolean;
  last_generated: string;
}

export interface ProcessingRunHistory {
  run_id: number;
  timestamp: string;
  input_filename: string;
  input_sha256: string;
  records_read: number;
  valid_records: number;
  invalid_records: number;
  anomalies_detected: number;
  status: string;
  output_files: string[];
}

export interface HashVerificationResult {
  filename: string;
  status: 'PASS' | 'FAIL';
  match: boolean;
  calculated_hash: string;
  recorded_hash: string;
  checked_at: string;
  file_size_bytes?: number;
  error?: string;
}

export interface RawPreviewData {
  columns: string[];
  total_rows: number;
  preview_count: number;
  rows: Record<string, any>[];
}

export interface ExcelSheetContent {
  name: string;
  headers: string[];
  row_count: number;
  rows: (string | number)[][];
}

export interface ExcelWorkbookData {
  filename: string;
  exists: boolean;
  file_size: string;
  sheet_names: string[];
  sheets: Record<string, ExcelSheetContent>;
}

