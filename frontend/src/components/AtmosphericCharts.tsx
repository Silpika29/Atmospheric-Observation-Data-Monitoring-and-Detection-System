import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { Layers, Maximize2, Thermometer, Droplets, Wind } from 'lucide-react';
import { AtmosphericReading, ThresholdConfig } from '../types/atmospheric';

interface AtmosphericChartsProps {
  readings: AtmosphericReading[];
  config: ThresholdConfig;
  loading: boolean;
}

// Custom dot renderer for highlighting anomalies with an "X" or red marker like Figure B.1
const AnomalyDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload || !payload.is_anomaly) {
    return <circle cx={cx} cy={cy} r={3} fill="#0284c7" stroke="#ffffff" strokeWidth={1} />;
  }

  // Draw red X marker for flagged readings
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="#fee2e2" stroke="#ef4444" strokeWidth={2} />
      <path
        d={`M ${cx - 3.5} ${cy - 3.5} L ${cx + 3.5} ${cy + 3.5} M ${cx + 3.5} ${cy - 3.5} L ${cx - 3.5} ${cy + 3.5}`}
        stroke="#dc2626"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </g>
  );
};

export const AtmosphericCharts: React.FC<AtmosphericChartsProps> = ({ readings, config, loading }) => {
  const [activeTab, setActiveTab] = useState<'all_stacked' | 'temperature' | 'humidity' | 'wind'>('all_stacked');

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm animate-pulse h-96 flex flex-col justify-center items-center">
        <div className="w-12 h-12 rounded-full border-4 border-sky-200 border-t-sky-600 animate-spin mb-4"></div>
        <p className="text-sm font-medium text-slate-500">Loading atmospheric time-series records...</p>
      </div>
    );
  }

  if (!readings || readings.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-slate-200/90 shadow-sm text-center">
        <p className="text-slate-500 font-medium">No atmospheric readings available to graph.</p>
        <p className="text-xs text-slate-400 mt-1">Upload a CSV dataset or reset to bundled sample data.</p>
      </div>
    );
  }

  // Filter or clean data for charts (sort by timestamp if present)
  const chartData = readings.map((r) => ({
    ...r,
    displayTime: r.timestamp ? r.timestamp.slice(-5) : `#${r.id}`, // e.g. "10:00"
    fullTime: r.timestamp || `Record #${r.id}`,
  }));

  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs backdrop-blur-sm z-50 min-w-[210px]">
          <div className="font-semibold text-sky-300 pb-1.5 mb-1.5 border-b border-slate-700/80 flex items-center justify-between">
            <span>{data.fullTime}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
              data.status_code === 'ANOMALY' 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                : data.status_code === 'INVALID'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              {data.status_code}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0284c7]"></span>
                Temperature:
              </span>
              <span className="font-mono font-medium text-white">
                {data.temperature_c !== null ? `${data.temperature_c} °C` : 'N/A'}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16a34a]"></span>
                Humidity:
              </span>
              <span className="font-mono font-medium text-white">
                {data.humidity !== null ? `${data.humidity} %` : 'N/A'}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ea580c]"></span>
                Wind Speed:
              </span>
              <span className="font-mono font-medium text-white">
                {data.wind_speed !== null ? `${data.wind_speed} m/s` : 'N/A'}
              </span>
            </div>
          </div>

          {data.reasons && data.reasons.length > 0 && (
            <div className="mt-2 pt-1.5 border-t border-slate-700/80 text-[11px] text-rose-300">
              <span className="font-medium text-rose-400">Flagged Issue:</span>
              <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                {data.reasons.map((r: string, idx: number) => (
                  <li key={idx} className="truncate">{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm mb-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Atmospheric Data Monitoring</span>
            <span className="text-xs font-normal text-slate-500">(Sample Data)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Continuous surface meteorological observations with threshold bounds
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('all_stacked')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'all_stacked'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Stacked (All)</span>
          </button>
          <button
            onClick={() => setActiveTab('temperature')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'temperature'
                ? 'bg-white text-sky-700 shadow-sm font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5 text-sky-600" />
            <span>Temperature</span>
          </button>
          <button
            onClick={() => setActiveTab('humidity')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'humidity'
                ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-emerald-600" />
            <span>Humidity</span>
          </button>
          <button
            onClick={() => setActiveTab('wind')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'wind'
                ? 'bg-white text-orange-700 shadow-sm font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            <Wind className="w-3.5 h-3.5 text-orange-600" />
            <span>Wind Speed</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      {activeTab === 'all_stacked' ? (
        /* Stacked Layout matching Reference Dashboard Image */
        <div className="space-y-6">
          {/* Temperature Section */}
          <div>
            <div className="flex items-center justify-between mb-1 text-xs">
              <span className="font-semibold text-sky-800 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-sky-600" />
                Temperature (°C)
              </span>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-rose-500"></span> Upper: {config.temp_max}°C
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-emerald-500"></span> Lower: {config.temp_min}°C
                </span>
              </div>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="displayTime" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[-10, 55]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                  <Tooltip content={renderCustomTooltip} />
                  <ReferenceLine y={config.temp_max} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `Upper (${config.temp_max}°C)`, position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }} />
                  <ReferenceLine y={0} stroke="#10b981" strokeDasharray="4 4" label={{ value: `0°C Limit`, position: 'insideBottomRight', fill: '#10b981', fontSize: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="temperature_c"
                    stroke="#0284c7"
                    strokeWidth={2}
                    dot={<AnomalyDot />}
                    activeDot={{ r: 6, fill: '#0284c7' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Humidity Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1 text-xs">
              <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-emerald-600" />
                Humidity (%)
              </span>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-rose-500"></span> Max Threshold: {config.humidity_max}%
                </span>
                <span className="text-slate-400">Scale: 0–100%</span>
              </div>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="displayTime" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[0, 110]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                  <Tooltip content={renderCustomTooltip} />
                  <ReferenceLine y={config.humidity_max} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `Limit (${config.humidity_max}%)`, position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#16a34a' }}
                    activeDot={{ r: 6, fill: '#16a34a' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Wind Speed Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1 text-xs">
              <span className="font-semibold text-orange-800 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-orange-600" />
                Wind Speed (m/s)
              </span>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-rose-500"></span> Max: {config.wind_speed_max} m/s
                </span>
                <span className="text-slate-400">Min: 0.0 m/s</span>
              </div>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="displayTime" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[-5, 45]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                  <Tooltip content={renderCustomTooltip} />
                  <ReferenceLine y={config.wind_speed_max} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `Max (${config.wind_speed_max} m/s)`, position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }} />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="2 2" />
                  <Line
                    type="monotone"
                    dataKey="wind_speed"
                    stroke="#ea580c"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#ea580c' }}
                    activeDot={{ r: 6, fill: '#ea580c' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : activeTab === 'temperature' ? (
        /* Detailed Temperature View matching Figure B.1 exactly */
        <div className="h-80 w-full">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700">Detailed Temperature Profile with Threshold Limits</span>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-rose-500"></span> Upper Limit ({config.temp_max}°C)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500"></span> Lower Limit (0°C)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Flagged for review</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="displayTime" tick={{ fontSize: 11, fill: '#475569' }} tickMargin={8} />
              <YAxis domain={[-15, 60]} tick={{ fontSize: 11, fill: '#475569' }} label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: '#475569' }} />
              <Tooltip content={renderCustomTooltip} />
              <Legend verticalAlign="top" height={36} />
              <ReferenceLine y={config.temp_max} stroke="#ef4444" strokeDasharray="5 5" label={{ value: `Upper limit (${config.temp_max}°C)`, position: 'insideTopRight', fill: '#ef4444', fontSize: 11 }} />
              <ReferenceLine y={0} stroke="#10b981" strokeDasharray="5 5" label={{ value: `Lower limit (0°C)`, position: 'insideBottomRight', fill: '#10b981', fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="temperature_c"
                name="Temperature (°C)"
                stroke="#0284c7"
                strokeWidth={2.5}
                dot={<AnomalyDot />}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : activeTab === 'humidity' ? (
        /* Detailed Humidity View */
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="displayTime" tick={{ fontSize: 11, fill: '#475569' }} tickMargin={8} />
              <YAxis domain={[0, 105]} tick={{ fontSize: 11, fill: '#475569' }} label={{ value: 'Relative Humidity (%)', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: '#475569' }} />
              <Tooltip content={renderCustomTooltip} />
              <Legend verticalAlign="top" height={36} />
              <ReferenceLine y={config.humidity_max} stroke="#ef4444" strokeDasharray="5 5" label={{ value: `Configured Limit (${config.humidity_max}%)`, position: 'insideTopRight', fill: '#ef4444', fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="humidity"
                name="Relative Humidity (%)"
                stroke="#16a34a"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#16a34a' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        /* Detailed Wind Speed View */
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="displayTime" tick={{ fontSize: 11, fill: '#475569' }} tickMargin={8} />
              <YAxis domain={[-5, 45]} tick={{ fontSize: 11, fill: '#475569' }} label={{ value: 'Wind Speed (m/s)', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: '#475569' }} />
              <Tooltip content={renderCustomTooltip} />
              <Legend verticalAlign="top" height={36} />
              <ReferenceLine y={config.wind_speed_max} stroke="#ef4444" strokeDasharray="5 5" label={{ value: `Threshold (${config.wind_speed_max} m/s)`, position: 'insideTopRight', fill: '#ef4444', fontSize: 11 }} />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="wind_speed"
                name="Wind Speed (m/s)"
                stroke="#ea580c"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#ea580c' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
