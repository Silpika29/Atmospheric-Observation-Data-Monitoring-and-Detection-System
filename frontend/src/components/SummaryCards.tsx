import React from 'react';
import { Thermometer, Droplets, Wind, AlertTriangle, ShieldCheck } from 'lucide-react';
import { SummaryStats } from '../types/atmospheric';

interface SummaryCardsProps {
  summary: SummaryStats | null;
  loading: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm animate-pulse h-28">
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-slate-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const tempVal = summary?.latest_temperature !== null && summary?.latest_temperature !== undefined 
    ? `${summary.latest_temperature.toFixed(1)} °C` 
    : 'N/A';
  
  const humVal = summary?.latest_humidity !== null && summary?.latest_humidity !== undefined 
    ? `${summary.latest_humidity.toFixed(1)} %` 
    : 'N/A';
  
  const windVal = summary?.latest_wind_speed !== null && summary?.latest_wind_speed !== undefined 
    ? `${summary.latest_wind_speed.toFixed(1)} m/s` 
    : 'N/A';

  const anomalyCount = summary?.anomaly_records ?? 0;
  const totalCount = summary?.total_records ?? 0;
  const anomalyRate = totalCount > 0 ? ((anomalyCount / totalCount) * 100).toFixed(1) : '0.0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Latest Temperature */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Latest Temperature
          </span>
          <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
            <Thermometer className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-800 tracking-tight font-mono">
            {tempVal}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>Observed: {summary?.latest_valid_timestamp || 'No valid record'}</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
            Ambient Air
          </span>
        </div>
      </div>

      {/* 2. Latest Humidity */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Latest Humidity
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Droplets className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-800 tracking-tight font-mono">
            {humVal}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>Relative Humidity</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            0–100% Range
          </span>
        </div>
      </div>

      {/* 3. Latest Wind Speed */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Latest Wind Speed
          </span>
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
            <Wind className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-800 tracking-tight font-mono">
            {windVal}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>Surface Anemometer</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-200">
            m/s
          </span>
        </div>
      </div>

      {/* 4. Anomalies Detected */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Anomalies Detected
          </span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            anomalyCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
          }`}>
            {anomalyCount > 0 ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-2xl font-bold font-mono tracking-tight ${
            anomalyCount > 0 ? 'text-rose-600' : 'text-emerald-600'
          }`}>
            {anomalyCount}
          </span>
          <span className="text-xs text-slate-500">
            of {totalCount} records ({anomalyRate}%)
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>Flagged for review</span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${
            anomalyCount > 0 
              ? 'bg-rose-50 text-rose-700 border-rose-200' 
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {anomalyCount > 0 ? 'Requires Review' : 'All Clear'}
          </span>
        </div>
      </div>
    </div>
  );
};
