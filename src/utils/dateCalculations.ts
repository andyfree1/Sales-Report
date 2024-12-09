import { startOfMonth, endOfMonth, eachDayOfInterval, format, parse, isFirstDayOfMonth } from 'date-fns';
import type { Sale } from '../types/sales';

export interface DailyMetrics {
  date: Date;
  totalSales: number;
  totalVolume: number;
  totalCommission: number;
  numberOfTours: number;
  dailyVPG: number;
  isFirstOfMonth: boolean;
  entries: Sale[];
}

export const calculateDailyMetrics = (sales: Sale[]): DailyMetrics[] => {
  // Create a map of dates to sales
  const salesByDate = new Map<string, Sale[]>();
  
  // Get the date range
  const dates = sales.map(sale => new Date(sale.date));
  const startDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
  const endDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();
  
  // Initialize metrics for each day in the range
  const dailyMetrics: DailyMetrics[] = eachDayOfInterval({ start: startDate, end: endDate })
    .map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dailySales = sales.filter(sale => format(new Date(sale.date), 'yyyy-MM-dd') === dateStr);
      salesByDate.set(dateStr, dailySales);
      
      // Include all sales for tour count, but only active sales for other metrics
      const activeSales = dailySales.filter(sale => !sale.isCancelled && sale.clientLastName !== 'NO SALE');
      const totalTours = dailySales.reduce((sum, sale) => sum + (sale.numberOfTours || 0), 0);
      
      return {
        date,
        totalSales: activeSales.length,
        totalVolume: activeSales.reduce((sum, sale) => sum + (sale.saleAmount || 0), 0),
        totalCommission: activeSales.reduce((sum, sale) => sum + (sale.commissionAmount || 0), 0),
        numberOfTours: totalTours,
        dailyVPG: calculateDailyVPG(activeSales, totalTours),
        isFirstOfMonth: isFirstDayOfMonth(date),
        entries: dailySales
      };
    });

  return dailyMetrics;
};

export const calculateDailyVPG = (sales: Sale[], totalTours: number = 0): number => {
  const totalVolume = sales.reduce((sum, sale) => sum + (sale.saleAmount || 0), 0);
  return totalTours > 0 ? totalVolume / totalTours : 0;
};

export const calculateMonthlyTotals = (metrics: DailyMetrics[]) => {
  const monthlyData = new Map<string, {
    totalVolume: number;
    totalCommission: number;
    totalTours: number;
    totalSales: number;
    vpg: number;
  }>();

  metrics.forEach(metric => {
    const monthKey = format(metric.date, 'yyyy-MM');
    const current = monthlyData.get(monthKey) || {
      totalVolume: 0,
      totalCommission: 0,
      totalTours: 0,
      totalSales: 0,
      vpg: 0
    };

    const newTotal = {
      totalVolume: current.totalVolume + metric.totalVolume,
      totalCommission: current.totalCommission + metric.totalCommission,
      totalTours: current.totalTours + metric.numberOfTours,
      totalSales: current.totalSales + metric.totalSales,
      vpg: 0
    };
    
    // Calculate VPG after all totals are summed
    newTotal.vpg = newTotal.totalTours > 0 ? newTotal.totalVolume / newTotal.totalTours : 0;
    
    monthlyData.set(monthKey, newTotal);
  });

  return monthlyData;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};