import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { TrendingUp, PieChart as PieIcon, Calendar, Download, FileSpreadsheet, Eye, Clock, AlertCircle, Film } from 'lucide-react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = "http://localhost:5000";
const COLORS = ['#f97316', '#f59e0b', '#ef4444', '#10b981', '#38bdf8'];

export function Reports() {
  const [stats, setStats] = useState(null);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Date Range Export States
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [pendingExportType, setPendingExportType] = useState(null); // 'PDF' or 'CSV'
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isExporting, setIsExporting] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, vRes] = await Promise.all([
          axios.get(`${API_BASE}/api/stats`),
          axios.get(`${API_BASE}/api/violations`)
        ]);
        setStats(sRes.data);
        setViolations(vRes.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching reports data:", err);
      }
    };
    fetchData();
  }, []);

  const fetchCustomRangeData = async (start, end) => {
    try {
      const [sRes, vRes] = await Promise.all([
        axios.get(`${API_BASE}/api/stats`, { params: { start, end } }),
        axios.get(`${API_BASE}/api/violations`, { params: { start, end } })
      ]);
      setStats(sRes.data);
      setViolations(vRes.data);
    } catch (err) {
      console.error("Error fetching filtered reports data:", err);
    }
  };

  const loadImageAsBase64 = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg'));
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await axios.get(`${API_BASE}/api/violations`, {
        params: { start: dateRange.start, end: dateRange.end }
      });
      const data = response.data;
      
      // Update displayed stats and charts for selected range
      await fetchCustomRangeData(dateRange.start, dateRange.end);

      if (pendingExportType === 'PDF') {
        await generatePDF(data);
      } else if (pendingExportType === 'EXCEL') {
        await generateExcel(data);
      } else {
        generateCSV(data);
      }
      setShowRangeModal(false);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const generatePDF = async (data) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const timestamp = new Date().toLocaleString();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Pre-fetch base64 images for evidence thumbnails
    const imagesMap = {};
    const maxRows = Math.min(data.length, 35);
    await Promise.all(data.slice(0, maxRows).map(async (v) => {
      if (v.image_path) {
        const b64 = await loadImageAsBase64(`${API_BASE}/${v.image_path}`);
        if (b64) imagesMap[v.id] = b64;
      }
    }));

    // --- OFFICIAL HEADER ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text("BUKIDNON STATE UNIVERSITY", pageWidth / 2, 14, { align: "center" });
    
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text("CITY TRANSPORT & TRAFFIC MANAGEMENT CENTER (TMC) - MALAYBALAY CITY", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(234, 88, 12);
    doc.text("AI-POWERED YELLOW BOX ZONE VIOLATION MONITORING & ENFORCEMENT REPORT", pageWidth / 2, 27, { align: "center" });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(14, 30, pageWidth - 14, 30);

    // --- REPORT METADATA & SUMMARY BOX ---
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 33, pageWidth - 28, 22, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 33, pageWidth - 28, 22, 2, 2, 'D');

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("Report Reference:", 18, 39);
    doc.text("Location Monitored:", 18, 45);
    doc.text("Target Scope:", 18, 51);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text("TMC-BSU-YBZ-032", 50, 39);
    doc.text("Sayre Highway - Fortich St. Intersection, Malaybalay City", 50, 45);
    doc.text("All Vehicle Classes (Multicabs, Cars, Buses, Trucks, Motorcycles)", 50, 51);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("Reporting Period:", pageWidth / 2 + 10, 39);
    doc.text("Total Violations:", pageWidth / 2 + 10, 45);
    doc.text("Date Generated:", pageWidth / 2 + 10, 51);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(`${dateRange.start} to ${dateRange.end}`, pageWidth / 2 + 45, 39);
    doc.text(`${data.length} Infraction(s) Recorded`, pageWidth / 2 + 45, 45);
    doc.text(`${timestamp}`, pageWidth / 2 + 45, 51);

    // --- VIOLATION RECORD TABLE WITH EMBEDDED IMAGES ---
    autoTable(doc, {
      startY: 59,
      head: [['ID', 'Evidence Photo', 'Timestamp', 'Location', 'Vehicle Class', 'Color', 'Plate No.', 'Stop Duration', 'Status']],
      body: data.slice(0, maxRows).map(v => [
        `#${v.id}`,
        '', // Reserved space for evidence image
        new Date(v.timestamp || v.violation_timestamp).toLocaleString(),
        v.location || 'Sayre Highway - Fortich St.',
        (v.label || 'Vehicle').toUpperCase(),
        v.vehicle_color || 'Standard',
        v.plate_number && !v.plate_number.toUpperCase().includes('DISABLED') && v.plate_number !== 'UNREAD' ? v.plate_number : 'LPR DISABLED',
        `${v.stop_duration}s`,
        (v.status || 'recorded').toUpperCase()
      ]),
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: [51, 65, 85], minCellHeight: 14, verticalAlign: 'middle' },
      columnStyles: {
        1: { cellWidth: 26 } // Photo column width
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didDrawCell: (cellData) => {
        if (cellData.section === 'body' && cellData.column.index === 1) {
          const rowItem = data.slice(0, maxRows)[cellData.row.index];
          if (rowItem && imagesMap[rowItem.id]) {
            const dim = cellData.cell;
            doc.addImage(imagesMap[rowItem.id], 'JPEG', dim.x + 2, dim.y + 1.5, 22, 11);
          }
        }
      },
      margin: { left: 14, right: 14, top: 59 }
    });

    // --- SIGNATORIES SECTION ---
    let finalY = doc.lastAutoTable.finalY || 130;
    if (finalY > 155) {
      doc.addPage();
      finalY = 25;
    } else {
      finalY += 15;
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);

    const colWidth = (pageWidth - 28) / 3;

    // Signatory 1: Prepared By
    doc.text("Prepared by:", 14, finalY);
    doc.line(14, finalY + 15, 14 + colWidth - 10, finalY + 15);
    doc.text("TMC System Operator / AI Officer", 14, finalY + 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Traffic Management Center", 14, finalY + 24);

    // Signatory 2: Recommending Approval
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Recommending Approval:", 14 + colWidth, finalY);
    doc.line(14 + colWidth, finalY + 15, 14 + (colWidth * 2) - 10, finalY + 15);
    doc.text("TMC Operations Supervisor", 14 + colWidth, finalY + 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("City Traffic Management Division", 14 + colWidth, finalY + 24);

    // Signatory 3: Approved By
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Approved by:", 14 + (colWidth * 2), finalY);
    doc.line(14 + (colWidth * 2), finalY + 15, pageWidth - 14, finalY + 15);
    doc.text("Head, TMC Malaybalay City", 14 + (colWidth * 2), finalY + 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("City Transport & Traffic Office", 14 + (colWidth * 2), finalY + 24);

    doc.save(`TMC_YellowBox_Violation_Report_${dateRange.start}_to_${dateRange.end}.pdf`);
  };

  const generateExcel = async (data) => {
    const maxRows = Math.min(data.length, 50);
    const imagesMap = {};
    await Promise.all(data.slice(0, maxRows).map(async (v) => {
      if (v.image_path) {
        const b64 = await loadImageAsBase64(`${API_BASE}/${v.image_path}`);
        if (b64) imagesMap[v.id] = b64;
      }
    }));

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Violations Log</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th { background-color: #1e293b; color: white; border: 1px solid #64748b; padding: 10px; font-size: 12px; }
          td { border: 1px solid #cbd5e1; padding: 8px; text-align: center; vertical-align: middle; font-size: 11px; }
          img { width: 90px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #000; }
        </style>
      </head>
      <body>
        <h2>BUKIDNON STATE UNIVERSITY & TMC MALAYBALAY CITY</h2>
        <h3>Yellow Box Zone Violation Enforcement Spreadsheet (${dateRange.start} to ${dateRange.end})</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Evidence Snapshot</th>
              <th>Timestamp</th>
              <th>Location</th>
              <th>Vehicle Class</th>
              <th>Vehicle Color</th>
              <th>Plate Number</th>
              <th>Stop Duration</th>
              <th>Status</th>
              <th>Direct Image Link</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.slice(0, maxRows).forEach(v => {
      const imgB64 = imagesMap[v.id] ? `<img src="${imagesMap[v.id]}" width="90" height="50" />` : 'No Photo';
      const imgUrl = `${API_BASE}/${v.image_path}`;
      html += `
        <tr>
          <td>#${v.id}</td>
          <td height="55">${imgB64}</td>
          <td>${v.timestamp || v.violation_timestamp}</td>
          <td>${v.location || 'Sayre Highway - Fortich St., Malaybalay City'}</td>
          <td>${(v.label || 'Vehicle').toUpperCase()}</td>
          <td>${v.vehicle_color || 'Standard'}</td>
          <td><b>${v.plate_number && !v.plate_number.toUpperCase().includes('DISABLED') && v.plate_number !== 'UNREAD' ? v.plate_number : 'LPR DISABLED'}</b></td>
          <td>${v.stop_duration}s</td>
          <td>${(v.status || 'recorded').toUpperCase()}</td>
          <td><a href="${imgUrl}">${imgUrl}</a></td>
        </tr>
      `;
    });

    html += `</tbody></table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TMC_Violations_With_Photos_${dateRange.start}_to_${dateRange.end}.xls`;
    link.click();
  };

  const generateCSV = (data) => {
    const headers = ["ID", "Timestamp", "Location", "Vehicle Class", "Vehicle Color", "Plate Number", "Stop Duration (s)", "Status", "Confidence (%)", "Evidence Photo URL"];
    const rows = data.map(v => [
      v.id,
      v.timestamp || v.violation_timestamp,
      v.location || 'Sayre Highway - Fortich St., Malaybalay City',
      v.label,
      v.vehicle_color || 'Standard',
      v.plate_number && !v.plate_number.toUpperCase().includes('DISABLED') && v.plate_number !== 'UNREAD' ? v.plate_number : 'LPR DISABLED',
      v.stop_duration,
      v.status,
      v.confidence ? (v.confidence * 100).toFixed(1) : '0',
      `${API_BASE}/${v.image_path}`
    ]);

    const content = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Violations_${dateRange.start}_to_${dateRange.end}.csv`;
    link.click();
  };

  const downloadImage = async (path) => {
    try {
      const response = await fetch(`${API_BASE}/${path}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = path.split('/').pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  if (loading || !stats) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Format data for charts with safety checks
  const trendData = (stats?.trend || []).map((item) => ({
    name: item.date,
    violations: item.count
  }));

  const pieData = Object.entries(stats?.by_type || {}).map(([key, value]) => ({
    name: key,
    value: value
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12 w-full">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Analytics & Reports</h2>
          <p className="text-muted text-xs sm:text-sm mt-0.5">Detailed breakdown of traffic violations and trends</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
          <button 
            onClick={() => {
              setPendingExportType('EXCEL');
              setShowRangeModal(true);
            }}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs sm:text-sm font-bold text-emerald-400 shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span> Excel (.xls)
          </button>
          <button 
            onClick={() => {
              setPendingExportType('CSV');
              setShowRangeModal(true);
            }}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs sm:text-sm font-bold text-blue-400 shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span> CSV
          </button>
          <button 
            onClick={() => {
              setPendingExportType('PDF');
              setShowRangeModal(true);
            }}
            className="btn-primary px-4 sm:px-6 py-2.5 rounded-2xl flex items-center gap-2 text-xs sm:text-sm font-bold shrink-0"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span> PDF Report
          </button>
        </div>
      </header>

      {/* Date Range Modal */}
      <AnimatePresence>
        {showRangeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRangeModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-2xl border border-white/10"
            >
              <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Select Export Period</h3>
              <p className="text-muted text-xs sm:text-sm mb-6 sm:mb-8">Choose the date range for your {pendingExportType} report.</p>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Start Date</label>
                  <input 
                    type="date" 
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 sm:py-4 text-sm outline-none focus:border-accent/50 transition-colors text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">End Date</label>
                  <input 
                    type="date" 
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 sm:py-4 text-sm outline-none focus:border-accent/50 transition-colors text-white"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3 sm:gap-4">
                <button 
                  onClick={() => setShowRangeModal(false)}
                  className="flex-1 py-3.5 sm:py-4 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-all text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex-1 py-3.5 sm:py-4 rounded-2xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 font-bold transition-all text-xs sm:text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isExporting ? (
                     <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : null}
                  {isExporting ? 'Generating...' : `Export ${pendingExportType}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard title="Daily Peak" value={`${trendData.reduce((max, p) => p.violations > max ? p.violations : max, 0)} Violations`} icon={TrendingUp} color="primary" />
        <StatCard title="Most Common" value={pieData[0]?.name || "N/A"} icon={PieIcon} color="warning" />
        <StatCard title="Saved Videos" value={stats.saved_videos} icon={Film} color="accent" />
        <StatCard title="Reporting Period" value="Last 7 Days" icon={Calendar} color="accent" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
          <div className="lg:col-span-8 glass p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] min-h-[350px] sm:min-h-[450px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted">
              <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              <p className="text-sm font-medium">Loading chart data...</p>
            </div>
          </div>
          <div className="lg:col-span-4 glass p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] min-h-[350px] sm:min-h-[450px] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
          {/* Main Trend Chart */}
          <div className="lg:col-span-8 glass p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] min-h-[380px] sm:min-h-[450px]">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-bold">Violation Frequency</h3>
            <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none">
               <option>Last 7 Days</option>
            </select>
          </div>
          
          <div className="h-[350px] w-full min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={100}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="violations" 
                  stroke="#f97316" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorViolations)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Pie Chart */}
        <div className="lg:col-span-4 glass p-8 rounded-[2.5rem] flex flex-col justify-between">
          <h3 className="text-xl font-bold mb-6">Type Distribution</h3>
          
          <div className="h-[250px] w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={100}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {(pieData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={10} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 mt-6">
            {(pieData || []).slice(0, 4).map((entry, index) => (
              <div key={entry.name || index} className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm font-medium">{entry.name}</span>
                </div>
                <span className="text-sm font-bold">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}

      {/* Violation Records Table */}
      <div className="glass p-10 rounded-[2.5rem]">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-2xl font-bold text-white/90">Violation Records</h3>
            <p className="text-muted text-sm mt-1">Full documentary list of recorded infractions</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-muted text-xs uppercase tracking-widest border-b border-white/5">
                <th className="pb-6 px-4">ID</th>
                <th className="pb-6 px-4">Vehicle Type</th>
                <th className="pb-6 px-4">Plate No.</th>
                <th className="pb-6 px-4">Timestamp</th>
                <th className="pb-6 px-4">Stop Duration</th>
                <th className="pb-6 px-4">Status</th>
                <th className="pb-6 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(violations || []).map((v, index) => (
                <tr key={v.id || index} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="py-6 px-4 text-sm font-medium text-muted">#{v.id}</td>
                  <td className="py-6 px-4">
                    <span className="capitalize font-bold text-white">{v.label}</span>
                  </td>
                  <td className="py-6 px-4">
                    {v.plate_number && !v.plate_number.toUpperCase().includes('DISABLED') && v.plate_number !== 'UNREAD' ? (
                      <span className="text-xs font-black tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded border border-emerald-400/20">
                        {v.plate_number}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold tracking-wider text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-400/20">
                        LPR DISABLED
                      </span>
                    )}
                  </td>
                  <td className="py-6 px-4 text-sm text-neutral-400">
                    {new Date(v.timestamp || v.violation_timestamp).toLocaleString()}
                  </td>
                  <td className="py-6 px-4 text-sm">
                    <span className="px-3 py-1 bg-accent/10 text-accent rounded-full font-bold">
                      {v.stop_duration}s
                    </span>
                  </td>
                  <td className="py-6 px-4 text-sm">
                    <span className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                       <span className="font-medium">Recorded</span>
                    </span>
                  </td>
                  <td className="py-6 px-4">
                    <button 
                      onClick={() => setSelectedViolation(v)}
                      className="p-2 hover:bg-accent/10 rounded-xl transition-all group-hover:scale-110"
                    >
                      <Eye className="w-5 h-5 text-accent" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Violation Detail Modal */}
      <AnimatePresence>
        {selectedViolation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedViolation(null)}
          >
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="relative max-w-5xl w-full glass rounded-[2.5rem] overflow-hidden border-white/10 shadow-2xl"
               onClick={(e) => e.stopPropagation()}
             >
                <div className="absolute top-6 right-6 z-10">
                   <button 
                    onClick={() => setSelectedViolation(null)}
                    className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                   >
                     ✕
                   </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12">
                   <div className="lg:col-span-8 bg-black">
                      <img 
                        src={`${API_BASE}/${selectedViolation.image_path}`} 
                        className="w-full h-auto object-contain" 
                        alt="Evidence"
                      />
                   </div>
                   <div className="lg:col-span-4 p-8 space-y-8 self-center">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Violation Details</h3>
                        <p className="text-muted text-sm italic">Report Evidence Analysis</p>
                      </div>

                      <div className="space-y-4">
                         <div className="flex justify-between items-center py-3 border-b border-white/5">
                            <span className="text-sm text-muted flex items-center gap-2"><Clock className="w-4 h-4" /> Timestamp</span>
                            <span className="text-sm font-bold">{selectedViolation.timestamp || selectedViolation.violation_timestamp}</span>
                         </div>
                         <div className="flex justify-between items-center py-3 border-b border-white/5">
                            <span className="text-sm text-muted flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Vehicle Type</span>
                            <span className="text-sm font-bold text-red-400 capitalize">{selectedViolation.label}</span>
                         </div>
                         <div className="flex justify-between items-center py-3 border-b border-white/5">
                            <span className="text-sm text-muted flex items-center gap-2"><Eye className="w-4 h-4" /> Confidence</span>
                            <span className="text-sm font-bold">{selectedViolation.confidence ? (selectedViolation.confidence * 100).toFixed(1) : '0'}%</span>
                         </div>
                         <div className="flex justify-between items-center py-3 border-b border-white/5">
                            <span className="text-sm text-muted">Plate Number</span>
                            {selectedViolation.plate_number && !selectedViolation.plate_number.toUpperCase().includes('DISABLED') && selectedViolation.plate_number !== 'UNREAD' ? (
                              <span className="text-xs font-black tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded border border-emerald-400/20">
                                {selectedViolation.plate_number}
                              </span>
                            ) : (
                              <span className="text-xs font-bold tracking-wider text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/20">
                                LPR DISABLED
                              </span>
                            )}
                         </div>
                      </div>

                      <button 
                        onClick={() => downloadImage(selectedViolation.image_path)}
                        className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all"
                      >
                         <Download className="w-5 h-5" />
                         Download Evidence
                      </button>
                   </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
