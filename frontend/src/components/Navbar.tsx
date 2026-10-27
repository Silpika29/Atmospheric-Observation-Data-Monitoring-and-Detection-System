import React, { useState } from 'react';
import { 
  Activity, 
  BarChart3, 
  AlertTriangle, 
  Database, 
  Info, 
  Sliders, 
  Menu, 
  X, 
  Radio, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenThresholds: () => void;
  backendOnline: boolean;
  anomalyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenThresholds,
  backendOnline,
  anomalyCount
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'data', label: 'Atmospheric Data', icon: BarChart3 },
    { id: 'anomalies', label: 'Anomaly Detection', icon: AlertTriangle, badge: anomalyCount },
    { id: 'evidence', label: 'Dataset & Evidence', icon: CheckCircle2 },
    { id: 'management', label: 'Data Management', icon: Database },
    { id: 'about', label: 'About Project', icon: Info },
  ];

  return (
    <header className="bg-[#0f2b48] text-white shadow-md sticky top-0 z-50 border-b border-slate-700/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Project Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-600/30 border border-sky-400/40 flex items-center justify-center text-sky-300 shadow-inner">
              <Radio className="w-5 h-5 animate-pulse text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-wider text-white">NARL | CDMG</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Sample Data Mode
                </span>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block tracking-wide">
                Atmospheric Observation Data Monitoring System
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sky-700/60 text-white shadow-sm border border-sky-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action: Thresholds & Status */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={onOpenThresholds}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800/80 hover:bg-slate-700 text-sky-300 border border-slate-600/60 transition-all shadow-sm"
              title="Configure physical and data-quality limits"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Thresholds</span>
            </button>

            <div
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
                backendOnline
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
                  : 'bg-rose-950/60 text-rose-300 border-rose-700/50'
              }`}
              title={backendOnline ? 'Backend API Connected (Port 8000)' : 'Backend API Unreachable'}
            >
              {backendOnline ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono">API Ready</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="font-mono">Offline</span>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={onOpenThresholds}
              className="p-2 rounded-md text-sky-300 hover:bg-slate-800"
              title="Thresholds"
            >
              <Sliders className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0c223a] border-t border-slate-700/80 px-4 pt-2 pb-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium ${
                  isActive
                    ? 'bg-sky-700 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
