import React, { useState, useEffect } from 'react';
import { format, startOfMonth } from 'date-fns';
import { Calendar, AlertCircle } from 'lucide-react';
import type { Sale } from '../types/sales';
import { DailyEntry, MonthlyTotals, calculateDailyEntries, calculateMonthlyTotals, generateMonthDays } from '../utils/monthlyReportUtils';
import { formatCurrency } from '../utils/dateCalculations';
import ReportMetrics from './ReportMetrics';

interface MonthlyReportManagerProps {
  sales: Sale[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export default function MonthlyReportManager({ sales, currentMonth, onMonthChange }: MonthlyReportManagerProps) {
  const [monthDays, setMonthDays] = useState<Date[]>([]);
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotals>({
    totalSales: 0,
    totalVolume: 0,
    totalCommission: 0,
    totalTours: 0,
    vpg: 0
  });

  useEffect(() => {
    const days = generateMonthDays(currentMonth);
    setMonthDays(days);
  }, [currentMonth]);

  useEffect(() => {
    if (monthDays.length > 0) {
      const entries = calculateDailyEntries(sales, monthDays);
      setDailyEntries(entries);
      const totals = calculateMonthlyTotals(entries);
      setMonthlyTotals(totals);
    }
  }, [sales, monthDays]);

  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const [year, month] = event.target.value.split('-').map(Number);
    onMonthChange(new Date(year, month - 1));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Calendar className="h-6 w-6 text-[#002C51] mr-2" />
            <h2 className="text-xl font-semibold">Monthly Report</h2>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={format(currentMonth, 'yyyy-MM')}
              onChange={handleMonthChange}
              className="rounded-md border-gray-300 shadow-sm focus:border-[#002C51] focus:ring-[#002C51]"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date(currentMonth.getFullYear(), i);
                return (
                  <option key={i} value={format(date, 'yyyy-MM')}>
                    {format(date, 'MMMM yyyy')}
                  </option>
                );
              })}
            </select>
            <div className="text-sm text-gray-500">
              {monthDays.length} Days • {monthlyTotals.totalSales} Sales
            </div>
          </div>
        </div>

        <ReportMetrics metrics={dailyEntries.map(entry => ({
          date: entry.date,
          totalSales: entry.metrics.totalSales,
          totalVolume: entry.metrics.totalVolume,
          totalCommission: entry.metrics.totalCommission,
          numberOfTours: entry.metrics.totalTours,
          dailyVPG: entry.metrics.vpg,
          isFirstOfMonth: entry.date.getDate() === 1,
          entries: entry.entries
        }))} />

        <div className="space-y-4 mt-6">
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
                      No entries
                    </div>
                  )}
                </div>
                {day.entries.length > 0 && (
                  <div className="text-sm text-gray-500">
                    {day.metrics.totalSales} Sales • {day.metrics.totalTours} Tours • VPG: {formatCurrency(day.metrics.vpg)}
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
                          {entry.isCancelled && (
                            <span className="ml-2 text-red-600">Cancelled</span>
                          )}
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