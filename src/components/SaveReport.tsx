import React from 'react';
import { Save } from 'lucide-react';
import { db } from '../db/database';
import { hiltonMediaStorage } from '../db/mediaStorage';
import type { Sale, SalesTotals } from '../types/sales';

interface SaveReportProps {
  sales: Sale[];
  totals: SalesTotals;
  currentProject: { id: number; name: string } | undefined;
}

export default function SaveReport({ sales, totals, currentProject }: SaveReportProps) {
  const handleSaveReport = async () => {
    if (!currentProject) {
      alert('Please select a project first');
      return;
    }

    const name = prompt('Enter a name for this report:');
    if (!name) return;

    try {
      const timestamp = new Date().toISOString();
      const fileName = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${timestamp}.json`;
      const path = `/reports/saved/${fileName}`;

      // Get current project data including commission levels
      const project = await db.projects.get(currentProject.id);
      
      const reportData = {
        name,
        createdAt: timestamp,
        projectId: currentProject.id,
        projectName: currentProject.name,
        sales,
        totals,
        commissionLevels: project?.commissionLevels || [],
        metadata: {
          version: '1.0',
          generatedAt: timestamp,
          totalSales: sales.length,
          totalVolume: totals.totalVolume,
          dateRange: {
            start: sales[0]?.date,
            end: sales[sales.length - 1]?.date
          }
        }
      };

      await hiltonMediaStorage.saveFile(path, reportData);
      alert('Report saved successfully!');
    } catch (error) {
      console.error('Failed to save report:', error);
      alert('Failed to save report. Please try again.');
    }
  };

  return (
    <button
      onClick={handleSaveReport}
      className="inline-flex items-center px-4 py-2 border border-[#002C51] rounded-md shadow-sm text-sm font-medium text-[#002C51] bg-white hover:bg-[#002C51] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002C51] transition-colors"
    >
      <Save className="h-4 w-4 mr-2" />
      Save Report
    </button>
  );
}