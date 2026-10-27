import {
  AtmosphericReading,
  AnomalySummary,
  SummaryStats,
  ThresholdConfig,
  PaginatedReadingsResponse,
  HealthStatus,
  DatasetStorageInfo,
  EvidenceFileRecord,
  ProcessingRunHistory,
  HashVerificationResult,
  RawPreviewData
} from '../types/atmospheric';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export const api = {
  async getHealth(): Promise<HealthStatus> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed: HTTP ${res.status}`);
    return res.json();
  },

  async getSummary(): Promise<SummaryStats> {
    const res = await fetch(`${API_BASE}/api/summary`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to fetch summary: HTTP ${res.status}`);
    }
    return res.json();
  },

  async getReadings(params: {
    search?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<PaginatedReadingsResponse> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.page) query.append('page', params.page.toString());
    if (params.pageSize) query.append('page_size', params.pageSize.toString());

    const res = await fetch(`${API_BASE}/api/readings?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to fetch readings: HTTP ${res.status}`);
    }
    return res.json();
  },

  async getAllReadingsForCharts(): Promise<AtmosphericReading[]> {
    const res = await fetch(`${API_BASE}/api/readings?page=1&page_size=1000`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to fetch chart readings: HTTP ${res.status}`);
    }
    const data: PaginatedReadingsResponse = await res.json();
    return data.readings;
  },

  async getAnomalies(): Promise<AnomalySummary> {
    const res = await fetch(`${API_BASE}/api/anomalies`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to fetch anomalies: HTTP ${res.status}`);
    }
    return res.json();
  },

  async getConfig(): Promise<ThresholdConfig> {
    const res = await fetch(`${API_BASE}/api/config`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to fetch thresholds: HTTP ${res.status}`);
    }
    return res.json();
  },

  async updateConfig(newConfig: ThresholdConfig): Promise<ThresholdConfig> {
    const res = await fetch(`${API_BASE}/api/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to update thresholds: HTTP ${res.status}`);
    }
    return res.json();
  },

  async uploadCSV(file: File): Promise<{ message: string; filename: string; total_records: number; anomalies_detected: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Upload failed: HTTP ${res.status}`);
    }
    return res.json();
  },

  async resetDataset(): Promise<{ message: string; dataset_name: string; records_count: number }> {
    const res = await fetch(`${API_BASE}/api/reset`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Reset failed: HTTP ${res.status}`);
    }
    return res.json();
  },

  getExportProcessedUrl(): string {
    return `${API_BASE}/api/export`;
  },

  getExportAnomaliesUrl(): string {
    return `${API_BASE}/api/export/anomalies`;
  },

  // =========================================================================
  // DATASET STORAGE & PROJECT EVIDENCE API
  // =========================================================================

  async getDatasetStorageInfo(): Promise<DatasetStorageInfo> {
    const res = await fetch(`${API_BASE}/api/evidence/storage-info`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to fetch storage info: HTTP ${res.status}`);
    }
    return res.json();
  },

  async getEvidenceFiles(): Promise<EvidenceFileRecord[]> {
    const res = await fetch(`${API_BASE}/api/evidence/files`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to fetch registered files: HTTP ${res.status}`);
    }
    return res.json();
  },

  async verifyFileHash(filename: string): Promise<HashVerificationResult> {
    const res = await fetch(`${API_BASE}/api/evidence/verify-hash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to verify hash: HTTP ${res.status}`);
    }
    return res.json();
  },

  async getProcessingHistory(): Promise<ProcessingRunHistory[]> {
    const res = await fetch(`${API_BASE}/api/evidence/history`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to fetch processing history: HTTP ${res.status}`);
    }
    return res.json();
  },

  async getRawPreview(limit: number = 20): Promise<RawPreviewData> {
    const res = await fetch(`${API_BASE}/api/evidence/raw-preview?limit=${limit}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to fetch raw preview: HTTP ${res.status}`);
    }
    return res.json();
  },

  getEvidenceExcelUrl(): string {
    return `${API_BASE}/api/evidence/excel`;
  },

  getRawCsvUrl(): string {
    return `${API_BASE}/api/evidence/raw-csv`;
  },

  getProcessingLogUrl(): string {
    return `${API_BASE}/api/evidence/log`;
  },

  async getExcelWorkbookData(): Promise<import('../types/atmospheric').ExcelWorkbookData> {
    const res = await fetch(`${API_BASE}/api/evidence/excel-data`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to fetch Excel sheet data: HTTP ${res.status}`);
    }
    return res.json();
  },

  async openDesktopExcel(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/api/evidence/open-local-excel`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to launch desktop Excel: HTTP ${res.status}`);
    }
    return res.json();
  }
};

