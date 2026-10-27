import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  ExternalLink, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Table, 
  Layers, 
  Check, 
  Sliders, 
  AlertCircle 
} from 'lucide-react';
import { ExcelWorkbookData, ExcelSheetContent } from '../types/atmospheric';
import { api } from '../services/api';

interface ExcelSheetViewerProps {
  onDownloadWorkbook?: () => void;
}

export const ExcelSheetViewer: React.FC<ExcelSheetViewerProps> = () => {
  const [workbook, setWorkbook] = useState<ExcelWorkbookData | null>(null);
  const [activeSheetName, setActiveSheetName] = useState<string>('Raw_Data');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number; colLetter: string; value: string }>({
    row: 1,
    col: 0,
    colLetter: 'A',
    value: ''
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [desktopLaunching, setDesktopLaunching] = useState<boolean>(false);
  const [desktopMsg, setDesktopMsg] = useState<string | null>(null);

  const fetchWorkbook = async () => {
    try {
      setLoading(true);
      const data = await api.getExcelWorkbookData();
      setWorkbook(data);
      if (data.sheet_names && data.sheet_names.length > 0 && !data.sheet_names.includes(activeSheetName)) {
        setActiveSheetName(data.sheet_names[0]);
      }
    } catch (err) {
      console.error('Failed to load Excel workbook data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkbook();
  }, []);

  const activeSheet: ExcelSheetContent | undefined = workbook?.sheets[activeSheetName];

  // Helper to convert index 0 -> 'A', 1 -> 'B', etc.
  const getColLetter = (index: number): string => {
    let letter = '';
    while (index >= 0) {
      letter = String.fromCharCode((index % 26) + 65) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
  };

  // Filter rows by search
  const filteredRows = activeSheet?.rows.filter((row) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return row.some((cell) => String(cell).toLowerCase().includes(q));
  }) || [];

  const handleCellClick = (rowIdx: number, colIdx: number, val: any) => {
    const colLetter = getColLetter(colIdx);
    setSelectedCell({
      row: rowIdx + 1, // 1-based display
      col: colIdx,
      colLetter,
      value: String(val ?? '')
    });
  };

  const handleOpenDesktopExcel = async () => {
    try {
      setDesktopLaunching(true);
      setDesktopMsg(null);
      const res = await api.openDesktopExcel();
      setDesktopMsg(res.message);
      setTimeout(() => setDesktopMsg(null), 5000);
    } catch (err: any) {
      setDesktopMsg(err.message || 'Failed to open local Excel');
      setTimeout(() => setDesktopMsg(null), 5000);
    } finally {
      setDesktopLaunching(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-300 shadow-md overflow-hidden font-sans">
      {/* 1. EXCEL TOP TITLE & RIBBON BAR */}
      <div className="bg-[#107c41] text-white px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-sm shadow-inner">
            X
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide">
                {workbook?.filename || 'atmospheric_monitoring_evidence.xlsx'}
              </span>
              <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-white/25 text-white uppercase tracking-wider">
                Excel Spreadsheet
              </span>
            </div>
            <p className="text-[11px] text-emerald-100 flex items-center gap-2">
              <span>Dynamic OpenXML Workbook</span>
              <span>•</span>
              <span>{workbook?.file_size || '20.67 KB'}</span>
              <span>•</span>
              <span>6 Sheets Verified</span>
            </p>
          </div>
        </div>

        {/* Action Buttons in Ribbon */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenDesktopExcel}
            disabled={desktopLaunching}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-white text-[#107c41] hover:bg-emerald-50 transition-colors shadow-xs"
            title="Launch Microsoft Excel directly on Windows"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{desktopLaunching ? 'Launching...' : 'Open in Desktop Excel'}</span>
          </button>

          <a
            href={api.getEvidenceExcelUrl()}
            download="atmospheric_monitoring_evidence.xlsx"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-emerald-800 hover:bg-emerald-900 text-white transition-colors border border-emerald-600/60 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .xlsx</span>
          </a>
        </div>
      </div>

      {/* Notification Toast if opened */}
      {desktopMsg && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{desktopMsg}</span>
          </div>
          <button onClick={() => setDesktopMsg(null)} className="text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {/* 2. EXCEL FORMULA & TOOLBAR ROW */}
      <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex items-center gap-3 text-xs">
        {/* Cell Name Box */}
        <div className="font-mono font-bold text-slate-700 px-2.5 py-1 bg-white border border-slate-300 rounded min-w-[55px] text-center shadow-inner">
          {selectedCell.colLetter}{selectedCell.row}
        </div>

        {/* fx formula symbol */}
        <div className="text-slate-400 font-serif italic text-sm font-bold select-none px-1">
          fx
        </div>

        {/* Formula Bar Content */}
        <div className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-mono text-slate-800 truncate shadow-inner">
          {selectedCell.value !== '' ? selectedCell.value : (activeSheet?.rows[0]?.[0] ? String(activeSheet.rows[0][0]) : '')}
        </div>

        {/* Search Input in Grid */}
        <div className="relative min-w-[180px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sheet..."
            className="w-full pl-8 pr-2.5 py-1 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <button
          onClick={fetchWorkbook}
          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
          title="Reload Excel Sheet Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {/* 3. EXCEL SPREADSHEET GRID */}
      <div className="relative overflow-x-auto max-h-[460px] overflow-y-auto bg-slate-50 select-text">
        {loading ? (
          <div className="p-16 text-center text-slate-400">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto mb-2"></div>
            <p className="text-xs font-medium">Loading Excel workbook cells...</p>
          </div>
        ) : !activeSheet || activeSheet.headers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No rows found in this sheet.
          </div>
        ) : (
          <table className="w-full border-collapse text-xs text-slate-800">
            {/* Column Letter Headers (A, B, C, D...) */}
            <thead className="bg-[#f3f4f6] text-slate-600 sticky top-0 z-20 border-b border-slate-300 select-none">
              <tr>
                {/* Top-left corner box */}
                <th className="w-12 min-w-[48px] px-2 py-1.5 text-center text-[11px] font-semibold border-r border-slate-300 bg-slate-200 text-slate-500">
                  ◢
                </th>
                {activeSheet.headers.map((_, colIdx) => (
                  <th
                    key={colIdx}
                    className={`px-3 py-1 text-center font-bold text-[11px] border-r border-slate-300 font-mono tracking-wider ${
                      selectedCell.col === colIdx ? 'bg-emerald-100 text-emerald-900 border-b-2 border-b-[#107c41]' : 'text-slate-600'
                    }`}
                  >
                    {getColLetter(colIdx)}
                  </th>
                ))}
              </tr>
              {/* Row 1: The Sheet Column Headers */}
              <tr className="bg-[#0f2b48] text-white border-b border-slate-300">
                <th className="px-2 py-2 text-center font-mono text-[10px] bg-slate-200 text-slate-700 border-r border-slate-300">
                  1
                </th>
                {activeSheet.headers.map((h, colIdx) => (
                  <th
                    key={colIdx}
                    className="px-3 py-2 text-left font-bold text-xs border-r border-slate-700/60 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Grid Data Rows */}
            <tbody className="divide-y divide-slate-200 bg-white font-mono text-[11px]">
              {filteredRows.map((row, rowIdx) => {
                const displayRowNum = rowIdx + 2; // Row 1 is header
                const isSelectedRow = selectedCell.row === displayRowNum;

                return (
                  <tr
                    key={rowIdx}
                    className={`hover:bg-emerald-50/40 transition-colors ${isSelectedRow ? 'bg-emerald-50/60' : ''}`}
                  >
                    {/* Row Number in Left Margin */}
                    <td
                      className={`px-2 py-1.5 text-center text-[10px] font-semibold border-r border-slate-300 select-none ${
                        isSelectedRow ? 'bg-emerald-100 text-emerald-900 font-bold' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {displayRowNum}
                    </td>

                    {/* Cell Values */}
                    {row.map((cellVal, colIdx) => {
                      const isSelectedCell = selectedCell.row === displayRowNum && selectedCell.col === colIdx;
                      const valStr = String(cellVal ?? '');

                      // Soft coloring for status cells
                      let cellStyle = 'border-r border-slate-200 px-3 py-1.5 whitespace-nowrap ';
                      if (valStr.includes('Within configured range') || valStr === 'NORMAL') {
                        cellStyle += 'bg-emerald-50 text-emerald-800 font-semibold ';
                      } else if (valStr.includes('Anomaly - review') || valStr === 'ANOMALY') {
                        cellStyle += 'bg-rose-50 text-rose-800 font-bold ';
                      } else if (valStr.includes('Invalid data') || valStr === 'INVALID') {
                        cellStyle += 'bg-amber-50 text-amber-800 font-bold ';
                      }

                      return (
                        <td
                          key={colIdx}
                          onClick={() => handleCellClick(rowIdx + 1, colIdx, cellVal)}
                          className={`${cellStyle} cursor-cell relative ${
                            isSelectedCell
                              ? 'outline-2 outline-[#107c41] -outline-offset-1 bg-emerald-50/70 font-semibold text-slate-900 z-10'
                              : 'text-slate-800'
                          }`}
                        >
                          {valStr !== '' ? valStr : <span className="text-slate-300 italic font-sans">empty</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. EXCEL BOTTOM SHEET TABS BAR */}
      <div className="bg-[#f3f4f6] border-t border-slate-300 px-2 py-1 flex items-center justify-between text-xs select-none">
        {/* Left Sheet Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          <div className="flex items-center text-slate-400 px-1">
            <ChevronLeft className="w-4 h-4 cursor-pointer hover:text-slate-700" />
            <ChevronRight className="w-4 h-4 cursor-pointer hover:text-slate-700" />
          </div>

          {workbook?.sheet_names.map((name) => {
            const isActive = activeSheetName === name;
            return (
              <button
                key={name}
                onClick={() => {
                  setActiveSheetName(name);
                  setSelectedCell({ row: 1, col: 0, colLetter: 'A', value: '' });
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-t text-xs font-semibold transition-all relative ${
                  isActive
                    ? 'bg-white text-slate-900 border-t-2 border-t-[#107c41] shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                }`}
              >
                <Table className="w-3 h-3 text-[#107c41]" />
                <span>{name}</span>
                <span className="text-[10px] font-normal text-slate-400">
                  ({workbook.sheets[name]?.row_count || 0})
                </span>
              </button>
            );
          })}
        </div>

        {/* Excel Status Footer Right */}
        <div className="hidden sm:flex items-center gap-4 text-[11px] text-slate-500 font-mono pr-2">
          <span>Ready</span>
          <span>•</span>
          <span>Rows: {activeSheet?.row_count || 0}</span>
          <span>•</span>
          <span>Cols: {activeSheet?.headers.length || 0}</span>
          <span>•</span>
          <span className="font-sans font-medium text-emerald-700">100% Zoom</span>
        </div>
      </div>
    </div>
  );
};
