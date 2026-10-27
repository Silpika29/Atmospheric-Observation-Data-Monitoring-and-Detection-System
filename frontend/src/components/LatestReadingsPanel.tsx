import React from 'react';
import { Clock, ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';
import { SummaryStats } from '../types/atmospheric';

interface LatestReadingsPanelProps {
  summary: SummaryStats | null;
  loading: boolean;
}

export const LatestReadingsPanel: React.FC<LatestReadingsPanelProps> = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm animate-pulse h-64">
        <div className="h-5 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  const tempVal = summary?.latest_temperature !== null && summary?.latest_temperature !== undefined 
    ? `${summary.latest_temperature.toFixed(1)} °C` 
    : 'N/A';
  
  const humVal = summary?.latest_humidity !== null && summary?.latest_humidity !== undefined 
    ? `${summary.latest_humidity.toFixed(0)} %` 
    : 'N/A';
  
  const windVal = summary?.latest_wind_speed !== null && summary?.latest_wind_speed !== undefined 
    ? `${summary.latest_wind_speed.toFixed(1)} m/s` 
    : 'N/A';

  const status = summary?.overall_status || 'NORMAL';

  const getStatusBadge = () => {
    switch (status) {
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white tracking-wider shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            NORMAL
          </span>
        );
      case 'ANOMALY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white tracking-wider shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5" />
            ANOMALY
          </span>
        );
      case 'INVALID DATA':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-600 text-white tracking-wider shadow-sm">
            <AlertCircle className="w-3.5 h-3.5" />
            INVALID DATA
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 tracking-wide">
          Latest Readings
        </h3>
        {summary?.latest_valid_timestamp && (
          <span className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
            <Clock className="w-3 h-3 text-slate-400" />
            {summary.latest_valid_timestamp}
          </span>
        )}
      </div>

      <div className="space-y-3.5 text-sm">
        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-slate-600 font-medium">Temperature</span>
          <span className="font-bold text-slate-900 font-mono text-base">{tempVal}</span>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-slate-600 font-medium">Humidity</span>
          <span className="font-bold text-slate-900 font-mono text-base">{humVal}</span>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-slate-600 font-medium">Wind Speed</span>
          <span className="font-bold text-slate-900 font-mono text-base">{windVal}</span>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-slate-600 font-medium">Status</span>
          <div>{getStatusBadge()}</div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
        Extracted from latest valid observation in dataset
      </div>
    </div>
  );
};
