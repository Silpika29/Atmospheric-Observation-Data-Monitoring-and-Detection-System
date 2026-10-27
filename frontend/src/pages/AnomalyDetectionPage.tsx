import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Download, 
  Filter, 
  Search, 
  CheckCircle2, 
  Sliders, 
  ShieldAlert, 
  Info,
  Thermometer,
  Droplets,
  Wind,
  Clock
} from 'lucide-react';
import { AnomalySummary, ThresholdConfig } from '../types/atmospheric';
import { api } from '../services/api';

interface AnomalyDetectionPageProps {
  anomalySummary: AnomalySummary | null;
  config: ThresholdConfig;
  loading: boolean;
  onUpdateConfig: (newConfig: ThresholdConfig) => Promise<void>;
  onOpenThresholdModal: () => void;
}

export const AnomalyDetectionPage: React.FC<AnomalyDetectionPageProps> = ({
  anomalySummary,
  config,
  loading,
  onUpdateConfig,
  onOpenThresholdModal
}) => {
  const [selectedVariable, setSelectedVariable] = useState<string>('ALL');
  const [selectedReason, setSelectedReason] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const anomalies = anomalySummary?.anomalies || [];
  const byVar = anomalySummary?.by_variable || {};
  const byReason = anomalySummary?.by_reason || {};

  // Filter anomalies list
  const filteredAnomalies = anomalies.filter((a) => {
    if (selectedVariable !== 'ALL' && a.variable !== selectedVariable) return false;
    if (selectedReason !== 'ALL' && !a.reason.toLowerCase().includes(selectedReason.toLowerCase())) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTs = a.timestamp && a.timestamp.toLowerCase().includes(q);
      const matchReason = a.reason && a.reason.toLowerCase().includes(q);
      const matchVal = a.observed_value && a.observed_value.toLowerCase().includes(q);
      if (!matchTs && !matchReason && !matchVal) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-slate-800">Atmospheric Anomaly Detection & Audit</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic rule-based quality assurance identifying outliers, boundary violations, and sensor dropouts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenThresholdModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Adjust Thresholds</span>
          </button>

          <a
            href={api.getExportAnomaliesUrl()}
            download="atmospheric_anomalies_report.csv"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Anomaly Report</span>
          </a>
        </div>
      </div>

      {/* Top Cards: Total Anomalies & Variable Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Anomalies */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Total Anomalies</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-rose-600 mt-1">
            {anomalySummary?.total_anomalies ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Flagged data records in active dataset
          </p>
        </div>

        {/* Temperature Anomalies */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Temperature</span>
            <Thermometer className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-800 mt-1">
            {byVar['Temperature'] ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Limits: [{config.temp_min}°C, {config.temp_max}°C]
          </p>
        </div>

        {/* Humidity Anomalies */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Humidity</span>
            <Droplets className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-800 mt-1">
            {byVar['Humidity'] ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Limits: [{config.humidity_min}%, {config.humidity_max}%]
          </p>
        </div>

        {/* Wind Speed Anomalies */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Wind Speed</span>
            <Wind className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-800 mt-1">
            {byVar['Wind Speed'] ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Limits: [{config.wind_speed_min}, {config.wind_speed_max} m/s]
          </p>
        </div>
      </div>

      {/* Anomaly Breakdown by Reason */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span>Anomaly Breakdown by Rule Violation</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(byReason).map(([reasonName, count]) => (
            <div
              key={reasonName}
              onClick={() => setSelectedReason(selectedReason === reasonName ? 'ALL' : reasonName)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedReason === reasonName
                  ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/30'
                  : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs text-slate-700 truncate pr-2">
                  {reasonName}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-rose-100 text-rose-700">
                  {count}
                </span>
              </div>
            </div>
          ))}
          {Object.keys(byReason).length === 0 && (
            <p className="text-xs text-slate-500 italic">No anomalies detected.</p>
          )}
        </div>
      </div>

      {/* Scientific Methodology Explanation Banner */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-slate-700 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-blue-900">
            About Rule-Based Anomaly Detection (Scientific Note)
          </h4>
          <p className="leading-relaxed text-slate-600">
            This educational prototype employs transparent, deterministic validation algorithms rather than black-box machine learning or deep neural networks. Each observation is checked against physical limits (e.g., non-negative wind speed, 0–100% relative humidity) and configurable threshold ranges. 
            Flagged values represent <strong>data-quality review flags</strong> (sensor anomalies, dropout, or boundary exceptions) and must not be misinterpreted as meteorological storm warnings.
          </p>
        </div>
      </div>

      {/* Detailed Anomalies Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">
              Anomalies Audit Trail
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              ({filteredAnomalies.length} of {anomalies.length} displayed)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anomaly..."
                className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
              />
            </div>

            {/* Variable filter buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
              {['ALL', 'Temperature', 'Humidity', 'Wind Speed', 'Timestamp'].map((v) => (
                <button
                  key={v}
                  onClick={() => setSelectedVariable(v)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                    selectedVariable === v
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {v === 'ALL' ? 'All' : v}
                </button>
              ))}
            </div>

            {selectedReason !== 'ALL' && (
              <button
                onClick={() => setSelectedReason('ALL')}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-medium underline"
              >
                Clear Reason Filter
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th scope="col" className="px-4 py-3">Row</th>
                <th scope="col" className="px-4 py-3">Timestamp</th>
                <th scope="col" className="px-4 py-3">Variable</th>
                <th scope="col" className="px-4 py-3">Observed Value</th>
                <th scope="col" className="px-4 py-3">Rule / Threshold</th>
                <th scope="col" className="px-4 py-3">Reason for Flagging</th>
                <th scope="col" className="px-4 py-3">Severity</th>
                <th scope="col" className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Loading anomaly records...
                  </td>
                </tr>
              ) : filteredAnomalies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No anomalies detected in the current filter selection.</p>
                    <p className="text-xs text-slate-400 mt-1">All atmospheric values comply with configured scientific thresholds.</p>
                  </td>
                </tr>
              ) : (
                filteredAnomalies.map((a) => (
                  <tr key={a.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-slate-500">#{a.row_index}</td>
                    <td className="px-4 py-2.5 font-mono font-medium text-slate-800 whitespace-nowrap">
                      {a.timestamp || <span className="text-amber-600 italic">None</span>}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">{a.variable}</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-rose-700">
                      {a.observed_value || <span className="text-slate-400 italic font-sans font-normal">Missing</span>}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-600 text-[11px]">{a.threshold_rule}</td>
                    <td className="px-4 py-2.5 text-slate-700 font-medium">{a.reason}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        a.severity === 'High'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {a.severity}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        Flagged
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
