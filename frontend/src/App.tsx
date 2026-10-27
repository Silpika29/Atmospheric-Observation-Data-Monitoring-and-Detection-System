import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { AtmosphericDataPage } from './pages/AtmosphericDataPage';
import { AnomalyDetectionPage } from './pages/AnomalyDetectionPage';
import { DatasetEvidencePage } from './pages/DatasetEvidencePage';
import { DataManagementPage } from './pages/DataManagementPage';
import { AboutProjectPage } from './pages/AboutProjectPage';
import { ThresholdModal } from './components/ThresholdModal';
import { 
  SummaryStats, 
  AtmosphericReading, 
  AnomalyDetail, 
  ThresholdConfig, 
  AnomalySummary 
} from './types/atmospheric';
import { api } from './services/api';
import { AlertCircle, RefreshCw, Radio } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [backendOnline, setBackendOnline] = useState<boolean>(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Core Data State
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [chartReadings, setChartReadings] = useState<AtmosphericReading[]>([]);
  const [tableReadings, setTableReadings] = useState<AtmosphericReading[]>([]);
  const [tableTotal, setTableTotal] = useState<number>(0);
  const [tablePage, setTablePage] = useState<number>(1);
  const [tableTotalPages, setTableTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [anomalySummary, setAnomalySummary] = useState<AnomalySummary | null>(null);

  const [config, setConfig] = useState<ThresholdConfig>({
    temp_min: -20.0,
    temp_max: 45.0,
    humidity_min: 0.0,
    humidity_max: 90.0,
    wind_speed_min: 0.0,
    wind_speed_max: 30.0,
  });

  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState<boolean>(false);

  // Load all dataset elements
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      setGlobalError(null);

      // 1. Health check
      try {
        await api.getHealth();
        setBackendOnline(true);
      } catch (err) {
        setBackendOnline(false);
        throw new Error('Backend server is currently offline or unreachable at http://127.0.0.1:8000. Please ensure the FastAPI backend is running.');
      }

      // 2. Fetch parallel resources
      const [sumRes, cfgRes, chartRes, tableRes, anomRes] = await Promise.all([
        api.getSummary(),
        api.getConfig(),
        api.getAllReadingsForCharts(),
        api.getReadings({ page: tablePage, pageSize, search: searchQuery, status: selectedStatus }),
        api.getAnomalies()
      ]);

      setSummary(sumRes);
      setConfig(cfgRes);
      setChartReadings(chartRes);
      setTableReadings(tableRes.readings);
      setTableTotal(tableRes.total);
      setTableTotalPages(tableRes.total_pages);
      setAnomalySummary(anomRes);
    } catch (err: any) {
      console.error('Failed to load application data:', err);
      setGlobalError(err.message || 'An error occurred while loading atmospheric observation records.');
    } finally {
      setLoading(false);
    }
  }, [tablePage, pageSize, searchQuery, selectedStatus]);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle table search / filter changes
  const handlePageChange = (newPage: number) => {
    setTablePage(newPage);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setTablePage(1); // Reset to first page
  };

  const handleStatusChange = (st: string) => {
    setSelectedStatus(st);
    setTablePage(1); // Reset to first page
  };

  // Update threshold configuration
  const handleUpdateConfig = async (newConfig: ThresholdConfig) => {
    try {
      const updated = await api.updateConfig(newConfig);
      setConfig(updated);
      await loadAllData();
    } catch (err: any) {
      throw err;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f8] text-slate-800 antialiased selection:bg-sky-200">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenThresholds={() => setIsThresholdModalOpen(true)}
        backendOnline={backendOnline}
        anomalyCount={summary?.anomaly_records ?? 0}
      />

      {/* Offline or Error Banner */}
      {(!backendOnline || globalError) && (
        <div className="bg-rose-600 text-white px-4 py-3 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-white" />
              <span>
                {globalError || 'Backend API server (http://127.0.0.1:8000) is currently offline.'}
              </span>
            </div>
            <button
              onClick={() => loadAllData()}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-white text-rose-700 font-bold hover:bg-rose-50 transition-colors shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardPage
            summary={summary}
            chartReadings={chartReadings}
            tableReadings={tableReadings}
            anomalies={anomalySummary?.anomalies || []}
            totalAnomalies={summary?.anomaly_records ?? 0}
            config={config}
            loading={loading}
            tableTotal={tableTotal}
            tablePage={tablePage}
            tableTotalPages={tableTotalPages}
            pageSize={pageSize}
            searchQuery={searchQuery}
            selectedStatus={selectedStatus}
            onPageChange={handlePageChange}
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
            onNavigateToAnomalies={() => setActiveTab('anomalies')}
          />
        )}

        {activeTab === 'data' && (
          <AtmosphericDataPage
            summary={summary}
            readings={tableReadings}
            totalCount={tableTotal}
            currentPage={tablePage}
            totalPages={tableTotalPages}
            pageSize={pageSize}
            searchQuery={searchQuery}
            selectedStatus={selectedStatus}
            config={config}
            loading={loading}
            onPageChange={handlePageChange}
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
            onOpenThresholds={() => setIsThresholdModalOpen(true)}
          />
        )}

        {activeTab === 'anomalies' && (
          <AnomalyDetectionPage
            anomalySummary={anomalySummary}
            config={config}
            loading={loading}
            onUpdateConfig={handleUpdateConfig}
            onOpenThresholdModal={() => setIsThresholdModalOpen(true)}
          />
        )}

        {activeTab === 'evidence' && (
          <DatasetEvidencePage
            summary={summary}
            processedReadings={chartReadings}
            onReload={loadAllData}
          />
        )}

        {activeTab === 'management' && (
          <DataManagementPage
            summary={summary}
            onDatasetReload={loadAllData}
          />
        )}

        {activeTab === 'about' && (
          <AboutProjectPage />
        )}
      </main>

      {/* Threshold Modal */}
      <ThresholdModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        config={config}
        onSave={handleUpdateConfig}
      />

      {/* Professional Scientific Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-600" />
            <span className="font-semibold text-slate-700">NARL | CDMG</span>
            <span className="text-slate-300">•</span>
            <span>Atmospheric Observation Data Monitoring & Anomaly Detection System</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span>Six-Week Internship Educational Prototype</span>
            <span className="text-slate-300">•</span>
            <span>National Atmospheric Research Laboratory</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">Sample Data Mode</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
