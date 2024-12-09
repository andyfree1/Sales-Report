import React from 'react';
import { DollarSign, Users, TrendingUp, Calendar } from 'lucide-react';
import { formatCurrency } from '../utils/dateCalculations';
import type { DailyMetrics } from '../utils/dateCalculations';

interface ReportMetricsProps {
  metrics: DailyMetrics[];
}

export default function ReportMetrics({ metrics }: ReportMetricsProps) {
  const totals = metrics.reduce(
    (acc, metric) => ({
      volume: acc.volume + metric.totalVolume,
      commission: acc.commission + metric.totalCommission,
      tours: acc.tours + metric.numberOfTours,
      sales: acc.sales + metric.totalSales,
    }),
    { volume: 0, commission: 0, tours: 0, sales: 0 }
  );

  const avgVPG = totals.tours > 0 ? totals.volume / totals.tours : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Volume</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(totals.volume)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-600">
            <Users className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Tours</p>
            <p className="text-lg font-semibold text-gray-900">{totals.tours}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Average VPG</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(avgVPG)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
            <Calendar className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Sales</p>
            <p className="text-lg font-semibold text-gray-900">{totals.sales}</p>
          </div>
        </div>
      </div>
    </div>
  );
}