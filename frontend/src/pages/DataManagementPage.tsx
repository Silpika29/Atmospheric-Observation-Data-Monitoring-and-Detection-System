import React, { useState } from 'react';
import { 
  Upload, 
  Database, 
  Download, 
  RotateCcw, 
  FileCheck, 
  AlertCircle, 
  CheckCircle2, 
  FileSpreadsheet, 
  HelpCircle,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { SummaryStats } from '../types/atmospheric';
import { api } from '../services/api';

interface DataManagementPageProps {
  summary: SummaryStats | null;
  onDatasetReload: () => Promise<void>;
}

export const DataManagementPage: React.FC<DataManagementPageProps> = ({
  summary,
  onDatasetReload
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setUploadError('Invalid file format. Please choose a file ending in .csv');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      setUploadSuccess(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a CSV file first.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(null);

      const res = await api.uploadCSV(selectedFile);
      setUploadSuccess(`Dataset "${res.filename}" successfully loaded. Found ${res.total_records} observations (${res.anomalies_detected} anomalies detected).`);
      setSelectedFile(null);
      await onDatasetReload();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload and validate CSV file.');
    } finally {
      setUploading(false);
    }
  };

  const handleResetDataset = async () => {
    if (!confirm('Are you sure you want to restore the bundled demonstration dataset? Any custom uploaded observations will be replaced.')) {
      return;
    }

    try {
      setResetting(true);
      setUploadError(null);
      setUploadSuccess(null);
      const res = await api.resetDataset();
      setResetMessage(`Successfully restored "${res.dataset_name}" (${res.records_count} records).`);
      await onDatasetReload();
      setTimeout(() => setResetMessage(null), 6000);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to restore bundled sample dataset.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-slate-800">Atmospheric Data Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload observational CSV records, validate schema integrity, export reports, or restore bundled sample data.
          </p>
        </div>

        <button
          onClick={handleResetDataset}
          disabled={resetting}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
          title="Restore bundled sample atmospheric dataset"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Restoring...' : 'Restore Bundled Sample Data'}</span>
        </button>
      </div>

      {/* Status Messages */}
      {resetMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{resetMessage}</span>
        </div>
      )}

      {uploadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {uploadError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Upload & Validation Error</strong>
            <span>{uploadError}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Upload Area on Left + Active Dataset Statistics on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Upload Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-2">
            <Upload className="w-4 h-4 text-sky-600" />
            <span>Upload Observation CSV File</span>
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Select a formatted atmospheric dataset. The backend validates required columns, checks timestamps, and scans for physical threshold anomalies.
          </p>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-sky-500 transition-colors bg-slate-50/50">
              <input
                type="file"
                id="csvFileInput"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="csvFileInput" className="cursor-pointer block">
                <FileSpreadsheet className="w-10 h-10 text-sky-600 mx-auto mb-2" />
                <span className="text-sm font-semibold text-slate-800 block">
                  {selectedFile ? selectedFile.name : 'Choose a CSV file or click here to browse'}
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  {selectedFile 
                    ? `Size: ${(selectedFile.size / 1024).toFixed(1)} KB` 
                    : 'Maximum upload file size: 10 MB'}
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Format required: UTF-8 plain CSV
              </span>
              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-xs"
              >
                {uploading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing CSV...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Upload & Process Data</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Required CSV Format Box */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Required CSV Column Schema</span>
            </h3>
            <p className="text-[11px] text-slate-500 mb-2.5">
              The uploaded file must contain the following columns (headers are case-insensitive):
            </p>
            <div className="bg-slate-900 text-slate-200 rounded-lg p-3 font-mono text-[11px] overflow-x-auto">
              <code>timestamp,temperature_c,humidity_percent,wind_speed_ms</code>
            </div>

            <div className="mt-3 overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-[11px] text-left text-slate-600">
                <thead className="bg-slate-100 font-semibold text-slate-700">
                  <tr>
                    <th className="px-3 py-1.5">timestamp</th>
                    <th className="px-3 py-1.5">temperature_c</th>
                    <th className="px-3 py-1.5">humidity_percent</th>
                    <th className="px-3 py-1.5">wind_speed_ms</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="px-3 py-1.5">2025-06-01 10:00</td>
                    <td className="px-3 py-1.5">28.0</td>
                    <td className="px-3 py-1.5">65.0</td>
                    <td className="px-3 py-1.5">8.0</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5">2025-06-01 10:10</td>
                    <td className="px-3 py-1.5">29.0</td>
                    <td className="px-3 py-1.5">68.0</td>
                    <td className="px-3 py-1.5">10.0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Dataset Statistics & Exports (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Dataset Stats */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 pb-3 mb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Active Dataset Information</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                {summary?.is_sample_mode ? 'Sample Data' : 'Custom Upload'}
              </span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Dataset File:</span>
                <span className="font-mono font-bold text-slate-800 truncate max-w-[180px]">
                  {summary?.dataset_name || 'sample_atmospheric_data.csv'}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Total Observations:</span>
                <span className="font-mono font-bold text-slate-800">
                  {summary?.total_records ?? 0}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Valid Records:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {summary?.valid_records ?? 0}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Anomalies Detected:</span>
                <span className="font-mono font-bold text-rose-600">
                  {summary?.anomaly_records ?? 0}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Invalid / Missing Records:</span>
                <span className="font-mono font-bold text-amber-600">
                  {summary?.invalid_records ?? 0}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Last Processed:</span>
                <span className="font-mono text-[11px] text-slate-500">
                  {summary?.last_processed || 'Just now'}
                </span>
              </div>
            </div>
          </div>

          {/* Export Downloads Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 pb-3 mb-3 border-b border-slate-100 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-sky-600" />
              <span>Export & Reporting</span>
            </h3>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Export processed observation datasets and anomaly audit trails formatted for scientific analysis in spreadsheets or Python/R.
            </p>

            <div className="space-y-3">
              <a
                href={api.getExportProcessedUrl()}
                download="processed_atmospheric_data.csv"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 transition-colors group text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 block group-hover:text-sky-700">
                    Processed Atmospheric Data (.csv)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Clean tabular readings with validation status tags
                  </span>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
              </a>

              <a
                href={api.getExportAnomaliesUrl()}
                download="atmospheric_anomalies_report.csv"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-rose-500 hover:bg-rose-50/50 transition-colors group text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 block group-hover:text-rose-700">
                    Anomaly Audit Report (.csv)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Detailed record of all flagged threshold violations
                  </span>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
