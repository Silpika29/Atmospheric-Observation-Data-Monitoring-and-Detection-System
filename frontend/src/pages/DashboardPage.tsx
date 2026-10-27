import React from 'react';
import { SummaryCards } from '../components/SummaryCards';
import { AtmosphericCharts } from '../components/AtmosphericCharts';
import { LatestReadingsPanel } from '../components/LatestReadingsPanel';
import { AnomaliesPanel } from '../components/AnomaliesPanel';
import { ObservationTable } from '../components/ObservationTable';
import { 
  SummaryStats, 
  AtmosphericReading, 
  AnomalyDetail, 
  ThresholdConfig 
} from '../types/atmospheric';

interface DashboardPageProps {
  summary: SummaryStats | null;
  chartReadings: AtmosphericReading[];
  tableReadings: AtmosphericReading[];
  anomalies: AnomalyDetail[];
  totalAnomalies: number;
  config: ThresholdConfig;
  loading: boolean;
  tableTotal: number;
  tablePage: number;
  tableTotalPages: number;
  pageSize: number;
  searchQuery: string;
  selectedStatus: string;
  onPageChange: (page: number) => void;
  onSearchChange: (q: string) => void;
  onStatusChange: (s: string) => void;
  onNavigateToAnomalies: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  summary,
  chartReadings,
  tableReadings,
  anomalies,
  totalAnomalies,
  config,
  loading,
  tableTotal,
  tablePage,
  tableTotalPages,
  pageSize,
  searchQuery,
  selectedStatus,
  onPageChange,
  onSearchChange,
  onStatusChange,
  onNavigateToAnomalies
}) => {
  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <SummaryCards summary={summary} loading={loading} />

      {/* Main Grid: Charts on Left (8 cols) + Side Panels on Right (4 cols) matching Reference Photo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Atmospheric Monitoring Charts */}
        <div className="lg:col-span-8">
          <AtmosphericCharts
            readings={chartReadings}
            config={config}
            loading={loading}
          />
        </div>

        {/* Right Column: Latest Readings Panel + Detected Anomalies Panel */}
        <div className="lg:col-span-4 space-y-6">
          <LatestReadingsPanel summary={summary} loading={loading} />
          
          <AnomaliesPanel
            anomalies={anomalies}
            totalAnomalies={totalAnomalies}
            loading={loading}
            onViewAll={onNavigateToAnomalies}
          />
        </div>
      </div>

      {/* Observation Data Table Section */}
      <ObservationTable
        readings={tableReadings}
        totalCount={tableTotal}
        currentPage={tablePage}
        totalPages={tableTotalPages}
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
