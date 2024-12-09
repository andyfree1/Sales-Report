import React, { useState } from 'react';
import { ListFilter, Calendar, TrendingUp } from 'lucide-react';
import type { Sale } from '../types/sales';
import DailyReport from './DailyReport';
import MonthlyReportManager from './MonthlyReportManager';

interface ReportTabsProps {
  sales: Sale[];
  onEditSale?: (sale: Sale) => void;
}

export default function ReportTabs({ sales, onEditSale }: ReportTabsProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('monthly');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const tabs = [
    { id: 'monthly', label: 'Monthly View', icon: Calendar },
    { id: 'daily', label: 'Daily View', icon: TrendingUp }
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'daily' | 'monthly')}
              className={`
                flex items-center py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-[#002C51] text-[#002C51]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'daily' ? (
        <DailyReport sales={sales} onEditSale={onEditSale} />
      ) : (
        <MonthlyReportManager
          sales={sales}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
        />
      )}
    </div>
  );
}