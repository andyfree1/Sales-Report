import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/database';
import type { Sale, DateRange, ReportPeriod } from './types/sales';
import { calculateMonthlyVPG, generateReportPeriods } from './types/sales';
import SalesTable from './components/SalesTable';
import DateRangeSelector from './components/DateRangeSelector';
import SalesMetrics from './components/SalesMetrics';
import CommissionLevels from './components/CommissionLevels';
import SalesForm from './components/SalesForm';
import ExportButton from './components/ExportButton';
import SaveReport from './components/SaveReport';
import RecentReports from './components/RecentReports';
import Header from './components/Header';

export default function App() {
  const [dateRange, setDateRange] = useState<DateRange>('monthly');
  const [customStartDate, setCustomStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | undefined>();
  
  const reportGroups = useMemo(() => generateReportPeriods(new Date()), []);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>(reportGroups.monthly[new Date().getMonth()]);

  const currentProject = useLiveQuery(() => db.getCurrentProject());
  const sales = useLiveQuery(() => db.sales.toArray()) || [];

  // Filter sales based on selected period, but don't restrict entry dates
  const filteredSales = useMemo(() => {
    if (!selectedPeriod) return [];
    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const startDate = new Date(selectedPeriod.startDate);
      const endDate = new Date(selectedPeriod.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      saleDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
      return saleDate >= startDate && saleDate <= endDate;
    });
  }, [sales, selectedPeriod]);

  const handleRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
    let newPeriod;
    switch (newRange) {
      case 'monthly':
        newPeriod = reportGroups.monthly[new Date().getMonth()];
        break;
      case 'annual':
        newPeriod = reportGroups.annual[0];
        break;
      case '45day':
        newPeriod = reportGroups.rolling45[0];
        break;
      case '90day':
        newPeriod = reportGroups.rolling90[0];
        break;
      default:
        newPeriod = selectedPeriod;
    }
    setSelectedPeriod(newPeriod);
  };

  // Separate sales into categories
  const activeSales = filteredSales.filter(sale => !sale.isCancelled && sale.clientLastName !== 'NO SALE');
  const cancelledSales = filteredSales.filter(sale => sale.isCancelled);
  const noSales = filteredSales.filter(sale => sale.clientLastName === 'NO SALE');

  // Calculate totals including all tours
  const totals = filteredSales.reduce(
    (acc, sale) => {
      // Always add tours regardless of sale type
      acc.totalTours += sale.numberOfTours || 0;

      // Only add other metrics for active sales
      if (!sale.isCancelled && sale.clientLastName !== 'NO SALE') {
        acc.totalVolume += sale.saleAmount;
        acc.totalCommission += sale.commissionAmount;
        acc.deedSales += (sale.saleType === 'DEED' ? 1 : 0);
        acc.trustSales += (sale.saleType === 'TRUST' ? 1 : 0);
        acc.totalFDIPoints += sale.fdiPoints;
        acc.totalFDIGivenPoints += sale.fdiGivenPoints;
        acc.totalFDICost += sale.fdiCost;
      }

      return acc;
    },
    {
      totalTours: 0,
      totalVolume: 0,
      totalCommission: 0,
      activeSales: activeSales.length,
      cancelledSales: cancelledSales.length,
      noSales: noSales.length,
      deedSales: 0,
      trustSales: 0,
      monthlyVPG: 0,
      totalFDIPoints: 0,
      totalFDIGivenPoints: 0,
      totalFDICost: 0
    }
  );

  // Calculate VPG after all totals are summed
  totals.monthlyVPG = calculateMonthlyVPG(totals.totalVolume, totals.totalTours);

  const handleAddSale = async (saleData: Omit<Sale, 'id'>) => {
    try {
      await db.sales.add({
        ...saleData,
        projectId: currentProject?.id || 1
      } as Sale);
      setIsFormOpen(false);
      setEditingSale(undefined);
    } catch (error) {
      console.error('Failed to add sale:', error);
      alert('Failed to add sale. Please try again.');
    }
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setIsFormOpen(true);
  };

  const handleDeleteSale = async (id: string) => {
    if (confirm('Are you sure you want to delete this sale?')) {
      try {
        await db.sales.delete(id);
      } catch (error) {
        console.error('Failed to delete sale:', error);
        alert('Failed to delete sale. Please try again.');
      }
    }
  };

  const handleToggleCancel = async (id: string) => {
    try {
      const sale = await db.sales.get(id);
      if (sale) {
        await db.sales.update(id, { isCancelled: !sale.isCancelled });
      }
    } catch (error) {
      console.error('Failed to toggle sale status:', error);
      alert('Failed to update sale status. Please try again.');
    }
  };

  const handleEditNote = async (id: string) => {
    try {
      const sale = await db.sales.get(id);
      if (sale) {
        const newNote = prompt('Enter new note:', sale.notes);
        if (newNote !== null) {
          await db.sales.update(id, { notes: newNote });
        }
      }
    } catch (error) {
      console.error('Failed to update note:', error);
      alert('Failed to update note. Please try again.');
    }
  };

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      try {
        await db.clearAllData();
        alert('All data has been cleared successfully.');
      } catch (error) {
        console.error('Failed to clear data:', error);
        alert('Failed to clear data. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-4">
              <ExportButton sales={filteredSales} totals={totals} />
              <SaveReport 
                sales={filteredSales} 
                totals={totals}
                currentProject={currentProject}
              />
              <button 
                onClick={() => {
                  setEditingSale(undefined);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#002C51] hover:bg-[#003666] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002C51]"
              >
                Add New Entry
              </button>
              <button
                onClick={handleClearData}
                className="inline-flex items-center px-4 py-2 border border-red-600 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Clear All Data
              </button>
            </div>
          </div>

          <RecentReports />
          
          <DateRangeSelector
            selectedRange={dateRange}
            onRangeChange={handleRangeChange}
            customStartDate={customStartDate}
            onCustomStartDateChange={setCustomStartDate}
            reportPeriods={
              dateRange === 'monthly' ? reportGroups.monthly :
              dateRange === 'annual' ? reportGroups.annual :
              dateRange === '45day' ? reportGroups.rolling45 :
              reportGroups.rolling90
            }
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <SalesMetrics {...totals} />
            </div>
            <div>
              <CommissionLevels currentVolume={totals.totalVolume} projectId={currentProject?.id || 1} />
            </div>
          </div>

          <SalesTable
            sales={filteredSales}
            totals={totals}
            onEditSale={handleEditSale}
            onDeleteSale={handleDeleteSale}
            onEditNote={handleEditNote}
            onToggleCancel={handleToggleCancel}
          />

          <SalesForm
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false);
              setEditingSale(undefined);
            }}
            onSubmit={handleAddSale}
            editingSale={editingSale}
            currentTotalVolume={totals.totalVolume}
            selectedPeriod={selectedPeriod}
          />
        </div>
      </div>
    </div>
  );
}