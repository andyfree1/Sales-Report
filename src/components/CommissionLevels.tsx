import React, { useState, useEffect } from 'react';
import { Target, Edit2, Save, X } from 'lucide-react';
import { CommissionLevel } from '../types/sales';
import { db, updateCommissionLevels } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';

interface CommissionLevelsProps {
  currentVolume: number;
  projectId: number;
}

export default function CommissionLevels({ currentVolume, projectId }: CommissionLevelsProps) {
  const project = useLiveQuery(
    () => db.projects.get(projectId),
    [projectId]
  );

  const [editingLevel, setEditingLevel] = useState<number | null>(null);
  const [commissionLevels, setCommissionLevels] = useState<CommissionLevel[]>([]);
  const [editForm, setEditForm] = useState<CommissionLevel | null>(null);

  useEffect(() => {
    if (project?.commissionLevels) {
      setCommissionLevels(project.commissionLevels);
    }
  }, [project]);

  const getCurrentLevel = () => {
    return commissionLevels.find(
      level => currentVolume >= level.minAmount && currentVolume <= level.maxAmount
    );
  };

  const currentLevel = getCurrentLevel();

  const handleEdit = (level: CommissionLevel) => {
    setEditingLevel(level.level);
    setEditForm({ ...level });
  };

  const handleSave = async () => {
    if (!editForm) return;

    const updatedLevels = commissionLevels.map(level =>
      level.level === editForm.level ? editForm : level
    );

    try {
      await updateCommissionLevels(projectId, updatedLevels);
      setCommissionLevels(updatedLevels);
      setEditingLevel(null);
      setEditForm(null);
    } catch (error) {
      console.error('Failed to update commission levels:', error);
      alert('Failed to update commission levels. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getBaseCommission = (minAmount: number): number => {
    if (minAmount >= 50000) return 6;
    if (minAmount >= 20000) return 5;
    return 4;
  };

  const getTotalCommission = (level: CommissionLevel) => {
    const baseCommission = getBaseCommission(level.minAmount);
    return baseCommission + level.additionalCommission;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Target className="h-5 w-5 text-[#002C51] mr-2" />
          <h2 className="text-lg font-semibold">Commission Structure</h2>
        </div>
        {currentLevel && (
          <div className="text-sm">
            <span className="font-medium">Current Level: {currentLevel.level}</span>
            <span className="mx-2">•</span>
            <span>Total: {getTotalCommission(currentLevel)}%</span>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex justify-between">
            <span>Under $20K:</span>
            <span className="font-medium">4%</span>
          </div>
          <div className="flex justify-between">
            <span>$20K - $50K:</span>
            <span className="font-medium">5%</span>
          </div>
          <div className="flex justify-between">
            <span>$50K+:</span>
            <span className="font-medium">6%</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-medium text-gray-600">Level</th>
              <th className="text-left py-2 font-medium text-gray-600">Volume Range</th>
              <th className="text-left py-2 font-medium text-gray-600">Base</th>
              <th className="text-left py-2 font-medium text-gray-600">Additional</th>
              <th className="text-left py-2 font-medium text-gray-600">Total</th>
              <th className="text-left py-2 font-medium text-gray-600 w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {commissionLevels.map((level) => (
              <tr 
                key={level.level}
                className={currentLevel?.level === level.level ? 'bg-blue-50' : ''}
              >
                {editingLevel === level.level && editForm ? (
                  <>
                    <td className="py-2">{level.level}</td>
                    <td className="py-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={editForm.minAmount}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            minAmount: parseInt(e.target.value)
                          })}
                          className="w-24 px-2 py-1 border rounded text-sm"
                        />
                        <span>-</span>
                        <input
                          type="number"
                          value={editForm.maxAmount}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            maxAmount: parseInt(e.target.value)
                          })}
                          className="w-24 px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </td>
                    <td className="py-2">
                      {getBaseCommission(editForm.minAmount)}%
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        step="0.5"
                        value={editForm.additionalCommission}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          additionalCommission: parseFloat(e.target.value)
                        })}
                        className="w-16 px-2 py-1 border rounded text-sm"
                      />
                    </td>
                    <td className="py-2">
                      {getTotalCommission(editForm)}%
                    </td>
                    <td className="py-2">
                      <div className="flex space-x-1">
                        <button
                          onClick={handleSave}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingLevel(null);
                            setEditForm(null);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2">{level.level}</td>
                    <td className="py-2">
                      {formatCurrency(level.minAmount)} - {formatCurrency(level.maxAmount)}
                    </td>
                    <td className="py-2">{getBaseCommission(level.minAmount)}%</td>
                    <td className="py-2">+{level.additionalCommission}%</td>
                    <td className="py-2">{getTotalCommission(level)}%</td>
                    <td className="py-2">
                      <button
                        onClick={() => handleEdit(level)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}