import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  ShieldCheck, 
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { AtmosphericReading } from '../types/atmospheric';
import { api } from '../services/api';

interface ObservationTableProps {
  readings: AtmosphericReading[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  searchQuery: string;
  selectedStatus: string;
  loading: boolean;
  onPageChange: (newPage: number) => void;
  onSearchChange: (query: string) => void;
  onStatusChange: (status: string) => void;
}

export const ObservationTable: React.FC<ObservationTableProps> = ({
  readings,
  totalCount,
  currentPage,
  totalPages,
  pageSize,
  searchQuery,
  selectedStatus,
  loading,
  onPageChange,
  onSearchChange,
  onStatusChange,
}) => {
  const [selectedRow, setSelectedRow] = useState<AtmosphericReading | null>(null);

  const renderStatusBadge = (reading: AtmosphericReading) => {
    switch (reading.status_code) {
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Normal
          </span>
        );
      case 'ANOMALY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Anomaly
          </span>
        );
      case 'INVALID':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Invalid
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Atmospheric Observations Table</span>
            <span className="text-xs font-normal text-slate-500">
              ({totalCount} records loaded)
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Surface measurements with automated data validation and quality classification
          </p>
        </div>

        {/* Search, Filter, Export Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search time or issue..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-slate-50/50"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            {['ALL', 'NORMAL', 'ANOMALY', 'INVALID'].map((st) => (
              <button
                key={st}
                onClick={() => onStatusChange(st)}
                className={`px-2.5 py-1 rounded-md font-medium capitalize transition-all ${
                  selectedStatus === st
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All' : st.toLowerCase()}
              </button>
            ))}
          </div>

          {/* CSV Export Button */}
          <a
            href={api.getExportProcessedUrl()}
            download="processed_atmospheric_data.csv"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-medium transition-colors shadow-xs"
            title="Download processed dataset as CSV matching Figure B.2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th scope="col" className="px-5 py-3.5">Time</th>
              <th scope="col" className="px-5 py-3.5">Temperature (°C)</th>
              <th scope="col" className="px-5 py-3.5">Humidity (%)</th>
              <th scope="col" className="px-5 py-3.5">Wind Speed (m/s)</th>
              <th scope="col" className="px-5 py-3.5">Status</th>
              <th scope="col" className="px-5 py-3.5 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                  <div className="inline-block animate-spin w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full mb-2"></div>
                  <p>Loading observation records...</p>
                </td>
              </tr>
            ) : readings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                  No records match the active search or filter criteria.
                </td>
              </tr>
            ) : (
              readings.map((reading) => {
                const isAnomaly = reading.status_code === 'ANOMALY';
                const isInvalid = reading.status_code === 'INVALID';
                
                // Highlight anomalous or invalid rows with subtle background tint
                const rowBg = isAnomaly 
                  ? 'bg-rose-50/40 hover:bg-rose-50/70' 
                  : isInvalid 
                  ? 'bg-amber-50/40 hover:bg-amber-50/70' 
                  : 'hover:bg-slate-50/70';

                return (
                  <tr 
                    key={reading.id} 
                    className={`transition-colors ${rowBg}`}
                    onClick={() => setSelectedRow(selectedRow?.id === reading.id ? null : reading)}
                  >
                    {/* Timestamp */}
                    <td className="px-5 py-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {reading.timestamp || <span className="text-amber-600 italic">Missing Time</span>}
                    </td>

                    {/* Temperature */}
                    <td className="px-5 py-3 font-mono">
                      {reading.temperature_c !== null ? (
                        <span className={reading.temperature_c >= 45 ? 'text-rose-600 font-bold' : ''}>
                          {reading.temperature_c.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-amber-600 italic font-sans font-medium">— (Missing)</span>
                      )}
                    </td>

                    {/* Humidity */}
                    <td className="px-5 py-3 font-mono">
                      {reading.humidity !== null ? (
                        <span className={reading.humidity > 90 || reading.humidity < 0 ? 'text-rose-600 font-bold' : ''}>
                          {reading.humidity.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-amber-600 italic font-sans font-medium">— (Missing)</span>
                      )}
                    </td>

                    {/* Wind Speed */}
                    <td className="px-5 py-3 font-mono">
                      {reading.wind_speed !== null ? (
                        <span className={reading.wind_speed < 0 || reading.wind_speed > 30 ? 'text-rose-600 font-bold' : ''}>
                          {reading.wind_speed.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-amber-600 italic font-sans font-medium">— (Missing)</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      {renderStatusBadge(reading)}
                    </td>

                    {/* Issue Description / Reason preview */}
                    <td className="px-5 py-3 text-right">
                      {reading.reasons && reading.reasons.length > 0 ? (
                        <span 
                          className="inline-block max-w-[200px] truncate text-[11px] text-rose-600 font-medium"
                          title={reading.reasons.join('; ')}
                        >
                          {reading.reasons[0]}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Valid</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Row detail drawer / modal if clicked */}
      {selectedRow && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-800">
              Record #{selectedRow.id} Inspection ({selectedRow.timestamp || 'No Timestamp'})
            </span>
            <button 
              onClick={() => setSelectedRow(null)}
              className="text-slate-400 hover:text-slate-700 text-xs font-semibold"
            >
              Close ✕
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono bg-white p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 font-sans block text-[11px]">Temperature:</span>
              <span className="text-slate-900 font-bold">{selectedRow.temperature_c ?? 'Missing'} °C</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans block text-[11px]">Humidity:</span>
              <span className="text-slate-900 font-bold">{selectedRow.humidity ?? 'Missing'} %</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans block text-[11px]">Wind Speed:</span>
              <span className="text-slate-900 font-bold">{selectedRow.wind_speed ?? 'Missing'} m/s</span>
            </div>
          </div>
          {selectedRow.reasons && selectedRow.reasons.length > 0 && (
            <div className="mt-2 text-rose-700 font-sans bg-rose-50 p-2.5 rounded border border-rose-200">
              <span className="font-bold block">Flagged Reasons:</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {selectedRow.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Table Footer with Pagination */}
      <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Showing page <span className="font-semibold text-slate-800">{currentPage}</span> of{' '}
          <span className="font-semibold text-slate-800">{totalPages}</span> ({totalCount} total observations)
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
