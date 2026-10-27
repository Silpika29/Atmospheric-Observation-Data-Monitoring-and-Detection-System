import React from 'react';
import { ShieldCheck, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import { AnomalyDetail } from '../types/atmospheric';

interface AnomaliesPanelProps {
  anomalies: AnomalyDetail[];
  totalAnomalies: number;
  loading: boolean;
  onViewAll: () => void;
}

export const AnomaliesPanel: React.FC<AnomaliesPanelProps> = ({
  anomalies,
  totalAnomalies,
  loading,
  onViewAll
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm animate-pulse h-60">
        <div className="h-5 bg-slate-200 rounded w-1/2 mb-4"></div>
        <div className="h-24 bg-slate-100 rounded"></div>
      </div>
    );
  }

  // Display only first 3 in dashboard side panel
  const displayAnomalies = anomalies.slice(0, 3);

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-800 tracking-wide">
            Detected Anomalies
          </h3>
          {totalAnomalies > 0 && (
            <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-rose-100 text-rose-700">
              {totalAnomalies}
            </span>
          )}
        </div>
        {totalAnomalies > 0 && (
          <button
            onClick={onViewAll}
            className="text-xs font-medium text-sky-600 hover:text-sky-800 flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {totalAnomalies === 0 ? (
        /* Reference 2 style empty state with "None" pill */
        <div className="bg-sky-50/70 border border-sky-100 rounded-lg p-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-white border border-sky-200 text-sm font-semibold text-sky-800 shadow-xs mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>None</span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            No anomalies detected in the current dataset. All observations are within configured physical limits.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayAnomalies.map((a) => (
            <div
              key={a.id}
              className="p-2.5 rounded-lg border border-rose-100 bg-rose-50/40 hover:bg-rose-50/70 transition-colors text-xs"
            >
              <div className="flex items-center justify-between font-semibold mb-1">
                <span className="text-rose-900 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  {a.variable}: {a.observed_value || 'Missing'}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {a.timestamp ? a.timestamp.slice(-5) : 'Row ' + a.row_index}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {a.reason}
              </p>
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                <span className="font-mono">Rule: {a.threshold_rule}</span>
                <span className="font-medium text-rose-600">Flagged for review</span>
              </div>
            </div>
          ))}

          {totalAnomalies > 3 && (
            <button
              onClick={onViewAll}
              className="w-full text-center py-2 text-xs font-medium text-slate-600 hover:text-sky-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/80 transition-colors flex items-center justify-center gap-1"
            >
              <span>+ {totalAnomalies - 3} more anomalies in report</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      <p className="mt-3 text-[10px] text-slate-400 italic text-center">
        Rule-based data-quality flags requiring scientific review
      </p>
    </div>
  );
};
