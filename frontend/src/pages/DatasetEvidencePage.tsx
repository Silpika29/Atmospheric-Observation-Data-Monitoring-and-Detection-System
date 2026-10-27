import React, { useState, useEffect } from 'react';
import { 
  Database, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ShieldCheck, 
  FileText, 
  Layers, 
  ArrowRight, 
  FileCheck, 
  AlertTriangle, 
  Clock, 
  HardDrive, 
  FolderCheck,
  Search,
  ExternalLink,
  HelpCircle,
  Hash
} from 'lucide-react';
import { 
  DatasetStorageInfo, 
  EvidenceFileRecord, 
  ProcessingRunHistory, 
  HashVerificationResult, 
  RawPreviewData, 
  SummaryStats,
  AtmosphericReading
} from '../types/atmospheric';
import { ExcelSheetViewer } from '../components/ExcelSheetViewer';
import { api } from '../services/api';

interface DatasetEvidencePageProps {
  summary: SummaryStats | null;
  processedReadings: AtmosphericReading[];
  onReload: () => Promise<void>;
}

export const DatasetEvidencePage: React.FC<DatasetEvidencePageProps> = ({
  summary,
  processedReadings,
  onReload
}) => {
  const [storageInfo, setStorageInfo] = useState<DatasetStorageInfo | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFileRecord[]>([]);
  const [history, setHistory] = useState<ProcessingRunHistory[]>([]);
  const [rawPreview, setRawPreview] = useState<RawPreviewData | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [verifyingFile, setVerifyingFile] = useState<string | null>(null);
  const [verifyResults, setVerifyResults] = useState<Record<string, HashVerificationResult>>({});
  const [activePreviewTab, setActivePreviewTab] = useState<'raw' | 'processed'>('raw');
  const [selectedSheetTab, setSelectedSheetTab] = useState<string>('Raw_Data');

  const fetchEvidenceData = async () => {
    try {
      setLoading(true);
      const [storageRes, filesRes, histRes, rawRes] = await Promise.all([
        api.getDatasetStorageInfo(),
        api.getEvidenceFiles(),
        api.getProcessingHistory(),
        api.getRawPreview(20)
      ]);
      setStorageInfo(storageRes);
      setEvidenceFiles(filesRes);
      setHistory(histRes);
      setRawPreview(rawRes);
    } catch (err) {
      console.error('Failed to load evidence data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidenceData();
  }, []);

  const handleVerifyHash = async (filename: string) => {
    try {
      setVerifyingFile(filename);
      const res = await api.verifyFileHash(filename);
      setVerifyResults(prev => ({ ...prev, [filename]: res }));
      // Refresh files list
      const updatedFiles = await api.getEvidenceFiles();
      setEvidenceFiles(updatedFiles);
    } catch (err: any) {
      console.error('Hash verification failed:', err);
      setVerifyResults(prev => ({
        ...prev,
        [filename]: {
          filename,
          status: 'FAIL',
          match: false,
          calculated_hash: '',
          recorded_hash: '',
          checked_at: new Date().toLocaleTimeString(),
          error: err.message || 'Verification call failed'
        }
      }));
    } finally {
      setVerifyingFile(null);
    }
  };

  const handleVerifyAll = async () => {
    for (const file of evidenceFiles) {
      await handleVerifyHash(file.name);
    }
  };

  const sheetsInfo = [
    { id: 'Raw_Data', name: '1. Raw_Data', desc: 'Original, unedited input observations as ingested from CSV.' },
    { id: 'Processed_Data', name: '2. Processed_Data', desc: 'Normalized readings with data-quality validation and status classification tags.' },
    { id: 'Anomalies', name: '3. Anomalies', desc: 'Audit table of all records that violated physical or threshold boundary limits.' },
    { id: 'Data_Summary', name: '4. Data_Summary', desc: 'High-level metrics, counts, health status, and latest valid surface observations.' },
    { id: 'Validation_Rules', name: '5. Validation_Rules', desc: 'Exact active configuration parameters, mathematical thresholds, and rationale.' },
    { id: 'Processing_Log', name: '6. Processing_Log', desc: 'Step-by-step pipeline execution timestamps, row counts, and workflow milestones.' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-slate-800">Dataset Storage & Project Evidence System</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Verifiable proof that atmospheric datasets are stored, parsed, validated, and analyzed with complete cryptographic integrity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchEvidenceData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Evidence</span>
          </button>

          <a
            href={api.getEvidenceExcelUrl()}
            download="atmospheric_monitoring_evidence.xlsx"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Download Evidence Workbook (.xlsx)</span>
          </a>
        </div>
      </div>

      {/* 1. DATASET STORAGE PROOF SECTION */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-sky-600" />
            <h2 className="text-base font-bold text-slate-800">1. Dataset Storage Proof</h2>
            {storageInfo?.exists && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified on Local Disk
              </span>
            )}
          </div>

          <a
            href={api.getRawCsvUrl()}
            download={storageInfo?.filename || 'sample_atmospheric_data.csv'}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Original Dataset ({storageInfo?.file_size_formatted})</span>
          </a>
        </div>

        {/* Storage Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Dataset Filename</span>
            <span className="font-mono font-bold text-slate-800 text-sm block truncate">
              {storageInfo?.filename || 'Loading...'}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Format: {storageInfo?.file_format}</span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Storage Location</span>
            <span className="font-mono font-bold text-sky-800 text-xs block truncate" title={storageInfo?.relative_path}>
              {storageInfo?.relative_path || 'backend/data/'}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Relative to Project Root</span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Dimensions</span>
            <span className="font-mono font-bold text-slate-800 text-sm block">
              {storageInfo?.row_count} rows × {storageInfo?.column_count} columns
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">File Size: {storageInfo?.file_size_formatted} ({storageInfo?.file_size_bytes} bytes)</span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Last Modified</span>
            <span className="font-mono text-slate-800 text-xs block">
              {storageInfo?.last_modified || 'Just now'}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Status: Active & Loaded</span>
          </div>
        </div>

        {/* Column Schema & Hash Badge */}
        <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Verified Column Names:</span>
              <div className="flex flex-wrap gap-1.5">
                {storageInfo?.columns.map(c => (
                  <span key={c} className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-medium text-[11px]">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <span className="text-slate-400 text-[11px]">All required columns present</span>
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-[11px]">
            <span className="text-slate-500 font-sans font-medium">Input Dataset SHA-256 Checksum:</span>
            <span className="text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 select-all truncate max-w-full sm:max-w-lg">
              {storageInfo?.sha256_hash || 'Calculating...'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. EXCEL WORKBOOK GENERATION SECTION */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-800">2. Real Excel Evidence Workbook (`atmospheric_monitoring_evidence.xlsx`)</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Dynamically generated by Python Pandas and OpenPyXL from the live dataset and processing output.
            </p>
          </div>

          <a
            href={api.getEvidenceExcelUrl()}
            download="atmospheric_monitoring_evidence.xlsx"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download atmospheric_monitoring_evidence.xlsx</span>
          </a>
        </div>

        {/* 6 Sheets Structure Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sheetsInfo.map((s, idx) => (
            <div 
              key={s.id} 
              onClick={() => setSelectedSheetTab(s.id)}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                selectedSheetTab === s.id
                  ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/30'
                  : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-800">{s.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600">
                  Sheet #{idx + 1}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Selected Sheet Details Card */}
        <div className="p-3.5 rounded-lg bg-slate-900 text-slate-200 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">Active Sheet Focus:</span>
            <span>{selectedSheetTab}</span>
            <span className="text-slate-400">({sheetsInfo.find(s => s.id === selectedSheetTab)?.desc})</span>
          </div>
          <span className="text-slate-400 text-[11px]">Format: OpenXML .xlsx Workbook</span>
        </div>

        {/* Live Interactive Excel Spreadsheet Component */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Interactive Excel Sheet Viewer (Live In-Browser Spreadsheet)</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Click any cell to inspect • Switch tabs at the bottom to view all 6 sheets
            </span>
          </div>
          <ExcelSheetViewer />
        </div>
      </div>

      {/* 3. DATASET PROCESSING PROOF WORKFLOW */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-600" />
            <h2 className="text-base font-bold text-slate-800">3. Dataset Processing Workflow Proof</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Documented end-to-end scientific pipeline: Input → Validation → Anomaly Detection → Visualization → Export.
          </p>
        </div>

        {/* 5-Stage Visual Workflow Pipeline */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
          <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-center">
            <span className="text-[10px] font-bold text-sky-800 block uppercase tracking-wider mb-1">Stage 1</span>
            <strong className="block text-slate-800 font-semibold mb-1">CSV/Excel Input</strong>
            <span className="text-[11px] text-slate-600 block">{storageInfo?.filename} ({storageInfo?.row_count} rows)</span>
          </div>

          <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-center">
            <span className="text-[10px] font-bold text-sky-800 block uppercase tracking-wider mb-1">Stage 2</span>
            <strong className="block text-slate-800 font-semibold mb-1">Data Validation</strong>
            <span className="text-[11px] text-slate-600 block">{summary?.valid_records} Valid / {summary?.invalid_records} Invalid</span>
          </div>

          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-center">
            <span className="text-[10px] font-bold text-rose-800 block uppercase tracking-wider mb-1">Stage 3</span>
            <strong className="block text-slate-800 font-semibold mb-1">Anomaly Detection</strong>
            <span className="text-[11px] text-rose-700 font-bold block">{summary?.anomaly_records} Records Flagged</span>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-[10px] font-bold text-emerald-800 block uppercase tracking-wider mb-1">Stage 4</span>
            <strong className="block text-slate-800 font-semibold mb-1">Graph Generation</strong>
            <span className="text-[11px] text-slate-600 block">3 Surface Charts Active</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-100 border border-slate-300 text-center">
            <span className="text-[10px] font-bold text-slate-700 block uppercase tracking-wider mb-1">Stage 5</span>
            <strong className="block text-slate-800 font-semibold mb-1">Excel/CSV Export</strong>
            <span className="text-[11px] text-slate-600 block">4 Files Compiled</span>
          </div>
        </div>

        {/* Processing Run History Table */}
        <div className="pt-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Processing Run Execution History</span>
          </h3>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Run</th>
                  <th className="px-4 py-2.5">Execution Time</th>
                  <th className="px-4 py-2.5">Input Dataset</th>
                  <th className="px-4 py-2.5">Records Read</th>
                  <th className="px-4 py-2.5">Invalid/Missing</th>
                  <th className="px-4 py-2.5">Anomalies Detected</th>
                  <th className="px-4 py-2.5">Generated Outputs</th>
                  <th className="px-4 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {history.map((h) => (
                  <tr key={h.run_id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-bold text-slate-800">#{h.run_id}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-slate-600">{h.timestamp}</td>
                    <td className="px-4 py-2 font-semibold text-slate-800">{h.input_filename}</td>
                    <td className="px-4 py-2 text-slate-700">{h.records_read}</td>
                    <td className="px-4 py-2 text-amber-600">{h.invalid_records}</td>
                    <td className="px-4 py-2 text-rose-600 font-bold">{h.anomalies_detected}</td>
                    <td className="px-4 py-2 text-slate-600 font-sans text-xs">
                      {h.output_files.length} artifacts ({h.output_files.slice(0, 2).join(', ')}...)
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. FILE INTEGRITY PROOF (SHA-256 HASHES & PASS/FAIL VERIFICATION) */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-sky-600" />
              <h2 className="text-base font-bold text-slate-800">4. File Integrity Proof (SHA-256 Checksums)</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cryptographic hash verification confirming files on disk match their generated checksums without alteration.
            </p>
          </div>

          <button
            onClick={handleVerifyAll}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verify All File Hashes</span>
          </button>
        </div>

        {/* Integrity Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Artifact Name</th>
                <th className="px-4 py-2.5">Path Relative to Project Root</th>
                <th className="px-4 py-2.5">Size</th>
                <th className="px-4 py-2.5">SHA-256 Hash</th>
                <th className="px-4 py-2.5 text-center">Integrity Status</th>
                <th className="px-4 py-2.5 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {evidenceFiles.map((file) => {
                const isChecking = verifyingFile === file.name;
                const result = verifyResults[file.name];
                const status = result ? result.status : file.status;

                return (
                  <tr key={file.name} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-800 font-mono flex items-center gap-2">
                      <FileCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>{file.name}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{file.relative_path}</td>
                    <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">{file.size_formatted}</td>
                    <td className="px-4 py-3 font-mono text-slate-700 select-all max-w-[220px] truncate" title={file.recorded_sha256}>
                      {file.recorded_sha256}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {status === 'PASS' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          PASS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          FAIL
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleVerifyHash(file.name)}
                        disabled={isChecking}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors inline-flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin text-sky-600' : ''}`} />
                        <span>{isChecking ? 'Checking...' : 'Recalculate Hash'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Scientific Note */}
        <div className="bg-sky-50/70 border border-sky-200 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Cryptographic Verification Note:</strong> The SHA-256 hash algorithm computes a unique 256-bit signature representing the bit-for-bit contents of the file on disk. 
            Recalculating this hash verifies file integrity and guarantees that the dataset has not been modified or corrupted. 
            It confirms verifiable evidence integrity, not the external institutional origin of the data.
          </p>
        </div>
      </div>

      {/* 5. SIDE-BY-SIDE RAW VS PROCESSED DATASET INSPECTION */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FolderCheck className="w-4 h-4 text-sky-600" />
              <h2 className="text-base font-bold text-slate-800">5. Original vs Processed Dataset Inspection</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect how raw observations are parsed, sanitized, and classified with validation flags.
            </p>
          </div>

          {/* Tab buttons */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium text-slate-600">
            <button
              onClick={() => setActivePreviewTab('raw')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activePreviewTab === 'raw'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Raw Input Records ({rawPreview?.total_rows || 0})
            </button>
            <button
              onClick={() => setActivePreviewTab('processed')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activePreviewTab === 'processed'
                  ? 'bg-white text-sky-700 shadow-sm font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Processed Records with Flags ({processedReadings.length})
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-96 overflow-y-auto">
          {activePreviewTab === 'raw' ? (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Row #</th>
                  {rawPreview?.columns.map(col => (
                    <th key={col} className="px-4 py-2.5 font-mono">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {rawPreview?.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-400">#{idx + 1}</td>
                    {rawPreview.columns.map(col => (
                      <td key={col} className="px-4 py-2 text-slate-800">
                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-amber-600 font-sans italic">null/empty</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Row #</th>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">Temperature (°C)</th>
                  <th className="px-4 py-2.5">Humidity (%)</th>
                  <th className="px-4 py-2.5">Wind Speed (m/s)</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Flagged Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {processedReadings.slice(0, 20).map((r) => {
                  const isAnomaly = r.status_code === 'ANOMALY';
                  const isInvalid = r.status_code === 'INVALID';
                  const rowBg = isAnomaly ? 'bg-rose-50/50' : isInvalid ? 'bg-amber-50/50' : '';

                  return (
                    <tr key={r.id} className={`hover:bg-slate-50 ${rowBg}`}>
                      <td className="px-4 py-2 font-mono text-slate-400">#{r.id}</td>
                      <td className="px-4 py-2 font-mono text-slate-900">{r.timestamp || 'Missing'}</td>
                      <td className="px-4 py-2 font-mono">{r.temperature_c ?? '—'}</td>
                      <td className="px-4 py-2 font-mono">{r.humidity ?? '—'}</td>
                      <td className="px-4 py-2 font-mono">{r.wind_speed ?? '—'}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.status_code === 'ANOMALY' 
                            ? 'bg-rose-100 text-rose-800' 
                            : r.status_code === 'INVALID'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-rose-700 font-medium">{r.reasons.join('; ') || 'Valid'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 6. SUPPORTING EVIDENCE DOWNLOAD CENTER */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-sky-600" />
            <h2 className="text-base font-bold text-slate-800">6. Supporting Project Evidence Download Center</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Download all verifiable project evidence files for demonstration, project review, or external evaluation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* 1. Excel Workbook */}
          <a
            href={api.getEvidenceExcelUrl()}
            download="atmospheric_monitoring_evidence.xlsx"
            className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 transition-colors flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Excel Workbook (.xlsx)
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800">
                  All 6 Sheets
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                Complete multi-sheet evidence workbook containing raw data, processed data, anomalies, summary, rules, and logs.
              </p>
            </div>
            <div className="pt-2 border-t border-emerald-200/70 flex items-center justify-between text-emerald-700 font-semibold group-hover:underline">
              <span>Download atmospheric_monitoring_evidence.xlsx</span>
              <Download className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* 2. Raw CSV Input */}
          <a
            href={api.getRawCsvUrl()}
            download={storageInfo?.filename || 'sample_atmospheric_data.csv'}
            className="p-4 rounded-xl border border-sky-200 bg-sky-50/40 hover:bg-sky-50 transition-colors flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sky-900 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-sky-600" />
                  Original Raw Dataset (.csv)
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-200 text-sky-800">
                  {storageInfo?.file_size_formatted}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                The exact unaltered atmospheric observation dataset currently loaded and parsed by the application.
              </p>
            </div>
            <div className="pt-2 border-t border-sky-200/70 flex items-center justify-between text-sky-700 font-semibold group-hover:underline">
              <span>Download {storageInfo?.filename || 'Raw Dataset'}</span>
              <Download className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* 3. Processed Clean CSV */}
          <a
            href={api.getExportProcessedUrl()}
            download="processed_atmospheric_data.csv"
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 transition-colors flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-600" />
                  Processed Dataset (.csv)
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                  Figure B.2 Format
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                Sanitized CSV output containing timestamp, temperature, humidity, wind speed, and status classification tags.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-slate-700 font-semibold group-hover:underline">
              <span>Download processed_atmospheric_data.csv</span>
              <Download className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* 4. Anomaly Audit Report */}
          <a
            href={api.getExportAnomaliesUrl()}
            download="atmospheric_anomalies_report.csv"
            className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50 transition-colors flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Anomaly Audit Report (.csv)
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-200 text-rose-800">
                  {summary?.anomaly_records} Flags
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                Audit trail detailing observed values, threshold rules, violation reasons, and severity classifications.
              </p>
            </div>
            <div className="pt-2 border-t border-rose-200/70 flex items-center justify-between text-rose-700 font-semibold group-hover:underline">
              <span>Download atmospheric_anomalies_report.csv</span>
              <Download className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* 5. Processing Text Audit Log */}
          <a
            href={api.getProcessingLogUrl()}
            download="processing_audit_log.txt"
            className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 hover:bg-purple-50 transition-colors flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-purple-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Processing Audit Log (.txt)
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-200 text-purple-800">
                  Text Log
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                Complete human-readable execution log detailing stages, timestamps, statistics, thresholds, and SHA-256 hashes.
              </p>
            </div>
            <div className="pt-2 border-t border-purple-200/70 flex items-center justify-between text-purple-700 font-semibold group-hover:underline">
              <span>Download processing_audit_log.txt</span>
              <Download className="w-3.5 h-3.5" />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};
