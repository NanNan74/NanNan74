import React from 'react';
import { Activity, AlertTriangle, CheckCircle, Droplets } from 'lucide-react';
import { WaterReading } from '../types';
import { formatDate } from '../services/mockService';

interface StatusCardProps {
  currentReading: WaterReading | null;
}

export const StatusCard: React.FC<StatusCardProps> = ({ currentReading }) => {
  if (!currentReading) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700 animate-pulse h-64">
        <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-slate-700 rounded w-3/4 mb-2"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CRITICAL': return 'text-red-500';
      case 'HIGH': return 'text-orange-500';
      case 'LOW': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CRITICAL':
      case 'HIGH': return <AlertTriangle className="w-6 h-6 mr-2" />;
      case 'LOW': return <Activity className="w-6 h-6 mr-2" />;
      default: return <CheckCircle className="w-6 h-6 mr-2" />;
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700 flex flex-col justify-between h-full">
      <div>
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center border-b border-slate-700 pb-2">
          <Activity className="w-5 h-5 mr-2 text-blue-400" />
          Trạng thái mới nhất
        </h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Thiết bị:</span>
            <span className="font-mono text-slate-100 font-bold">{currentReading.deviceId}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Mức nước:</span>
            <div className="flex items-center">
              <span className={`text-3xl font-bold ${getStatusColor(currentReading.status)}`}>
                {currentReading.level.toFixed(1)}%
              </span>
              <Droplets className={`w-5 h-5 ml-2 ${getStatusColor(currentReading.status)}`} />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Trạng thái:</span>
            <span className={`flex items-center font-bold px-3 py-1 rounded-full bg-slate-900 border border-slate-700 ${getStatusColor(currentReading.status)}`}>
              {getStatusIcon(currentReading.status)}
              {currentReading.status}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Thời gian:</span>
            <span className="text-sm text-slate-300">{formatDate(currentReading.timestamp)}</span>
          </div>
        </div>
      </div>
      
      {/* Progress Bar Visual */}
      <div className="mt-6">
        <div className="w-full bg-slate-900 rounded-full h-4 border border-slate-700 overflow-hidden relative">
          <div 
            className={`h-full transition-all duration-1000 ease-out ${
              currentReading.status === 'CRITICAL' ? 'bg-red-600' :
              currentReading.status === 'HIGH' ? 'bg-orange-500' :
              currentReading.status === 'LOW' ? 'bg-yellow-500' :
              'bg-blue-500'
            }`}
            style={{ width: `${currentReading.level}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};
