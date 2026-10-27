import React, { useState } from 'react';
import { Sliders, X, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { ThresholdConfig } from '../types/atmospheric';

interface ThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ThresholdConfig;
  onSave: (newConfig: ThresholdConfig) => Promise<void>;
}

export const ThresholdModal: React.FC<ThresholdModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave
}) => {
  const [tempMin, setTempMin] = useState(config.temp_min);
  const [tempMax, setTempMax] = useState(config.temp_max);
  const [humMin, setHumMin] = useState(config.humidity_min);
  const [humMax, setHumMax] = useState(config.humidity_max);
  const [windMin, setWindMin] = useState(config.wind_speed_min);
  const [windMax, setWindMax] = useState(config.wind_speed_max);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleResetDefaults = () => {
    setTempMin(-20.0);
    setTempMax(45.0);
    setHumMin(0.0);
    setHumMax(90.0);
    setWindMin(0.0);
    setWindMax(30.0);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (tempMin >= tempMax) {
      setError('Temperature Minimum must be less than Temperature Maximum.');
      return;
    }
    if (humMin < 0 || humMax > 100) {
      setError('Humidity limits must be between 0% and 100%.');
      return;
    }
    if (humMin >= humMax) {
      setError('Humidity Minimum must be less than Humidity Maximum.');
      return;
    }
    if (windMin < 0) {
      setError('Wind Speed Minimum cannot be negative.');
      return;
    }
    if (windMin >= windMax) {
      setError('Wind Speed Minimum must be less than Wind Speed Maximum.');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        temp_min: tempMin,
        temp_max: tempMax,
        humidity_min: humMin,
        humidity_max: humMax,
        wind_speed_min: windMin,
        wind_speed_max: windMax
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update threshold settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="bg-[#0f2b48] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">Threshold Configuration</h3>
              <p className="text-xs text-slate-300">Rule-based scientific validation parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Temperature Limits */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Temperature Limits (°C)</span>
              <span className="text-[11px] font-normal text-slate-400">Illustrative software validation limits</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Lower Limit (Min)</span>
                <input
                  type="number"
                  step="0.5"
                  value={tempMin}
                  onChange={(e) => setTempMin(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Upper Limit (Max)</span>
                <input
                  type="number"
                  step="0.5"
                  value={tempMax}
                  onChange={(e) => setTempMax(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Humidity Limits */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Relative Humidity Limits (%)</span>
              <span className="text-[11px] font-normal text-slate-400">Physical bounds: 0% – 100%</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Lower Limit (Min)</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={humMin}
                  onChange={(e) => setHumMin(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Upper Limit (Max)</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={humMax}
                  onChange={(e) => setHumMax(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Wind Speed Limits */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Wind Speed Limits (m/s)</span>
              <span className="text-[11px] font-normal text-slate-400">Non-negative physical velocity</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Lower Limit (Min)</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={windMin}
                  onChange={(e) => setWindMin(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Upper Limit (Max)</span>
                <input
                  type="number"
                  step="0.5"
                  value={windMax}
                  onChange={(e) => setWindMax(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <strong>Note:</strong> Modifying thresholds triggers server-side re-validation of all loaded observations and updates anomaly flags immediately.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                {saving ? (
                  <span>Applying...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Apply Thresholds</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
