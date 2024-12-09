import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, format } from 'date-fns';
import type { Sale } from '../types/sales';

export interface DailyEntry {
  date: Date;
  entries: Sale[];
  metrics: {
    totalSales: number;
    totalVolume: number;
    totalCommission: number;
    totalTours: number;
    vpg: number;
  };
}

export interface MonthlyTotals {
  totalSales: number;
  totalVolume: number;
  totalCommission: number;
  totalTours: number;
  vpg: number;
}

export const generateMonthDays = (selectedMonth: Date): Date[] => {
  const start = startOfMonth(selectedMonth);
  const end = endOfMonth(selectedMonth);
  return eachDayOfInterval({ start, end });
};

export const calculateDailyEntries = (sales: Sale[], monthDays: Date[]): DailyEntry[] => {
  return monthDays.map(day => {
    const daysSales = sales.filter(sale => 
      isSameDay(new Date(sale.date), day)
    );

    // Include all sales for tour count
    const totalTours = daysSales.reduce((sum, sale) => sum + (sale.numberOfTours || 0), 0);
    
    // Filter for active sales for other metrics
    const activeSales = daysSales.filter(
      sale => !sale.isCancelled && sale.clientLastName !== 'NO SALE'
    );

    const totalVolume = activeSales.reduce((sum, sale) => sum + (sale.saleAmount || 0), 0);

    return {
      date: day,
      entries: daysSales,
      metrics: {
        totalSales: activeSales.length,
        totalVolume,
        totalCommission: activeSales.reduce((sum, sale) => sum + (sale.commissionAmount || 0), 0),
        totalTours,
        vpg: totalTours > 0 ? totalVolume / totalTours : 0
      }
    };
  });
};

export const calculateMonthlyTotals = (dailyEntries: DailyEntry[]): MonthlyTotals => {
  const totals = dailyEntries.reduce((totals, day) => ({
    totalSales: totals.totalSales + day.metrics.totalSales,
    totalVolume: totals.totalVolume + day.metrics.totalVolume,
    totalCommission: totals.totalCommission + day.metrics.totalCommission,
    totalTours: totals.totalTours + day.metrics.totalTours,
    vpg: 0
  }), {
    totalSales: 0,
    totalVolume: 0,
    totalCommission: 0,
    totalTours: 0,
    vpg: 0
  });

  // Calculate VPG after all totals are summed
  totals.vpg = totals.totalTours > 0 ? totals.totalVolume / totals.totalTours : 0;

  return totals;
};

export const formatMonthlyReportTitle = (date: Date): string => {
  return format(date, 'MMMM yyyy');
};