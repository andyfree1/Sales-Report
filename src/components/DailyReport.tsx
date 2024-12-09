import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { calculateDailyMetrics, calculateMonthlyTotals, formatCurrency } from '../utils/dateCalculations';
import type { Sale } from '../types/sales';
import type { DailyMetrics } from '../utils/dateCalculations';
import { Table, Calendar, DollarSign, Users } from 'lucide-react';

interface DailyReportProps {
  sales: Sale[];
  onEditSale?: (sale: Sale) => void;
}

export default function DailyReport({ sales, onEditSale }: DailyReportProps) {
  const metrics = useMemo(() => calculateDailyMetrics(sales), [sales]);
  const monthlyTotals = useMemo(() => calculateMonthlyTotals(metrics), [metrics]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Table className="h-5 w-5 mr-2 text-[#002C51]" />
            Daily Performance Report
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Volume
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Daily VPG
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.map((metric) => (
                <tr 
                  key={metric.date.toISOString()}
                  className={metric.isFirstOfMonth ? 'bg-blue-50' : undefined}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {format(metric.date, 'MM/dd/yyyy')}
                    {metric.isFirstOfMonth && (
                      <span className="ml-2 text-xs text-blue-600">
                        Month Start
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.totalSales}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(metric.totalVolume)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(metric.totalCommission)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.numberOfTours}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(metric.dailyVPG)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-[#002C51]" />
            Monthly Totals
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from(monthlyTotals.entries()).map(([month, totals]) => (
            <div key={month} className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {format(new Date(month + '-01'), 'MMMM yyyy')}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Volume:</span>
                  <span className="font-medium">{formatCurrency(totals.totalVolume)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Commission:</span>
                  <span className="font-medium">{formatCurrency(totals.totalCommission)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Tours:</span>
                  <span className="font-medium">{totals.totalTours}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Sales:</span>
                  <span className="font-medium">{totals.totalSales}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}