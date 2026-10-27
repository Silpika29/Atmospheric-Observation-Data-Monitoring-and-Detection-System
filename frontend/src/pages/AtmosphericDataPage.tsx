import React from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Search, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { ObservationTable } from '../components/ObservationTable';
import { 
  AtmosphericReading, 
  SummaryStats, 
  ThresholdConfig 
} from '../types/atmospheric';
import { api } from '../services/api';

interface AtmosphericDataPageProps {
  summary: SummaryStats | null;
  readings: AtmosphericReading[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  searchQuery: string;
  selectedStatus: string;
  config: ThresholdConfig;
  loading: boolean;
  onPageChange: (page: number) => void;
  onSearchChange: (q: string) => void;
  onStatusChange: (s: string) => void;
  onOpenThresholds: () => void;
}

export const AtmosphericDataPage: React.FC<AtmosphericDataPageProps> = ({
  summary,
  readings,
  totalCount,
  currentPage,
  totalPages,
  pageSize,
  searchQuery,
  selectedStatus,
  config,
  loading,
  onPageChange,
  onSearchChange,
  onStatusChange,
  onOpenThresholds
}) => {
  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-slate-800">Atmospheric Data Records Explorer</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Browse, search, filter, and inspect processed surface meteorological observations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenThresholds}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Configure Thresholds</span>
          </button>

          <a
            href={api.getExportProcessedUrl()}
            download="processed_atmospheric_data.csv"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Clean CSV</span>
          </a>
        </div>
      </div>

      {/* Dataset Health Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
            {summary?.total_records ?? 0}
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">Total Rows</span>
            <span className="text-xs font-bold text-slate-700">Observations</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">Valid Data</span>
            <span className="text-xs font-bold text-emerald-700">
              {summary?.valid_records ?? 0} ({summary?.total_records ? ((summary.valid_records / summary.total_records) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">Anomalies</span>
            <span className="text-xs font-bold text-rose-700">
              {summary?.anomaly_records ?? 0} Flagged
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">Invalid Rows</span>
            <span className="text-xs font-bold text-amber-700">
              {summary?.invalid_records ?? 0} Missing/Corrupt
            </span>
          </div>
        </div>
      </div>

      {/* Threshold Parameters Banner */}
      <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 text-xs text-sky-900 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-sky-600 shrink-0" />
          <span className="font-semibold">Active Demonstration Rules:</span>
          <span className="font-mono bg-white px-2 py-0.5 rounded border border-sky-200 text-[11px]">
            Temp: [{config.temp_min}°C, {config.temp_max}°C]
          </span>
          <span className="font-mono bg-white px-2 py-0.5 rounded border border-sky-200 text-[11px]">
            Humidity: [{config.humidity_min}%, {config.humidity_max}%]
          </span>
          <span className="font-mono bg-white px-2 py-0.5 rounded border border-sky-200 text-[11px]">
            Wind: [{config.wind_speed_min}, {config.wind_speed_max} m/s]
          </span>
        </div>
        <span className="text-[11px] text-sky-700 italic">
          Software data-quality validation limits (configurable)
        </span>
      </div>

      {/* Full Observation Table */}
      <ObservationTable
        readings={readings}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        searchQuery={searchQuery}
        selectedStatus={selectedStatus}
        loading={loading}
        onPageChange={onPageChange}
        onSearchChange={onSearchChange}
        onStatusChange={onStatusChange}
      />
    </div>
  );
};
