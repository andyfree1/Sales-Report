import React, { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Calendar, AlertCircle } from 'lucide-react';
import type { Sale } from '../types/sales';
import { formatCurrency } from '../utils/dateCalculations';

interface MonthlyReportProps {
  sales: Sale[];
  selectedMonth: Date;
}

export default function MonthlyReport({ sales, selectedMonth }: MonthlyReportProps) {
  const monthDays = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    return eachDayOfInterval({ start, end });
  }, [selectedMonth]);

  const dailyEntries = useMemo(() => {
    return monthDays.map(day => {
      const daysSales = sales.filter(sale => 
        isSameDay(new Date(sale.date), day)
      );

      const activeSales = daysSales.filter(
        sale => !sale.isCancelled && sale.clientLastName !== 'NO SALE'
      );

      return {
        date: day,
        entries: daysSales,
        metrics: {
          totalSales: activeSales.length,
          totalVolume: activeSales.reduce((sum, sale) => sum + sale.saleAmount, 0),
          totalCommission: activeSales.reduce((sum, sale) => sum + sale.commissionAmount, 0),
          totalTours: daysSales.reduce((sum, sale) => sum + sale.numberOfTours, 0)
        }
      };
    });
  }, [sales, monthDays]);

  const monthlyTotals = useMemo(() => {
    return dailyEntries.reduce((totals, day) => ({
      totalSales: totals.totalSales + day.metrics.totalSales,
      totalVolume: totals.totalVolume + day.metrics.totalVolume,
      totalCommission: totals.totalCommission + day.metrics.totalCommission,
      totalTours: totals.totalTours + day.metrics.totalTours
    }), {
      totalSales: 0,
      totalVolume: 0,
      totalCommission: 0,
      totalTours: 0
    });
  }, [dailyEntries]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Calendar className="h-6 w-6 text-[#002C51] mr-2" />
            <h2 className="text-xl font-semibold">
              Monthly Report: {format(selectedMonth, 'MMMM yyyy')}
            </h2>
          </div>
          <div className="text-sm text-gray-500">
            {monthDays.length} Days • {monthlyTotals.totalSales} Sales
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Volume</div>
              <div className="text-lg font-semibold">{formatCurrency(monthlyTotals.totalVolume)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Commission</div>
              <div className="text-lg font-semibold">{formatCurrency(monthlyTotals.totalCommission)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Tours</div>
              <div className="text-lg font-semibold">{monthlyTotals.totalTours}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Sales</div>
              <div className="text-lg font-semibold">{monthlyTotals.totalSales}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {dailyEntries.map(day => (
            <div 
              key={day.date.toISOString()}
              className={`border rounded-lg ${
                day.entries.length > 0 ? 'border-gray-200' : 'border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <div className="flex items-center">
                  <div className="font-medium">
                    {format(day.date, 'EEEE, MMMM d, yyyy')}
                  </div>
                  {day.entries.length === 0 && (
                    <div className="ml-3 flex items-center text-gray-500 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      No scheduled activities
                    </div>
                  )}
                </div>
                {day.entries.length > 0 && (
                  <div className="text-sm text-gray-500">
                    {day.metrics.totalSales} Sales • {day.metrics.totalTours} Tours
                  </div>
                )}
              </div>
              
              {day.entries.length > 0 && (
                <div className="p-4 space-y-3">
                  {day.entries.map((entry, index) => (
                    <div 
                      key={entry.id}
                      className={`flex justify-between items-center ${
                        index !== day.entries.length - 1 ? 'border-b pb-3' : ''
                      }`}
                    >
                      <div>
                        <div className="font-medium">
                          {entry.clientLastName === 'NO SALE' ? 'NO SALE' : entry.clientLastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Lead: {entry.leadNumber} • Manager: {entry.managerName}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(entry.saleAmount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.numberOfTours} Tours • {entry.saleType}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}