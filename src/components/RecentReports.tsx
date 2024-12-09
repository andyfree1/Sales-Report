import React, { useState, useEffect } from 'react';
import { Clock, ExternalLink } from 'lucide-react';
import { hiltonMediaStorage } from '../db/mediaStorage';
import { format } from 'date-fns';

interface RecentReport {
  name: string;
  path: string;
  createdAt: string;
  metadata: {
    totalSales: number;
    totalVolume: number;
  };
}

export default function RecentReports() {
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);

  useEffect(() => {
    loadRecentReports();
  }, []);

  const loadRecentReports = async () => {
    try {
      const reports = await hiltonMediaStorage.listFiles('/reports/saved');
      const sortedReports = reports
        .filter(report => report.type === 'file')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4)
        .map(report => ({
          name: report.content.name,
          path: report.path,
          createdAt: report.createdAt,
          metadata: report.content.metadata
        }));
      
      setRecentReports(sortedReports);
    } catch (error) {
      console.error('Failed to load recent reports:', error);
    }
  };

  const handleOpenReport = async (report: RecentReport) => {
    try {
      const reportData = await hiltonMediaStorage.getFile(report.path);
      if (!reportData?.content) {
        alert('Report data not found');
        return;
      }

      // Create a blob URL for the report data
      const blob = new Blob([JSON.stringify(reportData.content, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);

      // Open in new tab
      window.open(url, '_blank');

      // Clean up the blob URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to open report:', error);
      alert('Failed to open report. Please try again.');
    }
  };

  if (recentReports.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
      <div className="flex items-center text-sm text-gray-500 mb-2">
        <Clock className="h-4 w-4 mr-1" />
        <span>Recent Reports</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {recentReports.map((report, index) => (
          <button
            key={index}
            onClick={() => handleOpenReport(report)}
            className="text-left p-2 rounded hover:bg-gray-50 border border-gray-100 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm truncate">{report.name}</span>
              <ExternalLink className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {format(new Date(report.createdAt), 'MMM d, yyyy')}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {report.metadata.totalSales} sales • ${report.metadata.totalVolume.toLocaleString()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}