import React from 'react';
import { WaterReading } from '../types';
import { formatDate } from '../services/mockService';
import { History } from 'lucide-react';

interface HistoryListProps {
  data: WaterReading[];
}

export const HistoryList: React.FC<HistoryListProps> = ({ data }) => {
  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700 flex flex-col h-96">
      <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
        <History className="w-5 h-5 mr-2 text-blue-400" />
        Nhật ký dữ liệu
      </h3>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="grid grid-cols-3 gap-4 pb-2 border-b border-slate-700 text-sm font-medium text-slate-400">
          <div>Thời gian</div>
          <div className="text-center">Mức nước (%)</div>
          <div className="text-right">Trạng thái</div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {data.length === 0 ? (
            <div className="text-center text-slate-500 py-4">Chưa có dữ liệu...</div>
          ) : (
            data.map((item) => (
              <div key={item.id} className="grid grid-cols-3 gap-4 py-3 border-b border-slate-700/50 text-sm hover:bg-slate-700/30 transition-colors">
                <div className="text-slate-300">{formatDate(item.timestamp).split(',')[1]}</div>
                <div className="text-center font-mono font-bold text-slate-200">{item.level.toFixed(2)}</div>
                <div className="text-right">
                  <span className={`
                    text-xs px-2 py-1 rounded font-bold
                    ${item.status === 'CRITICAL' ? 'bg-red-900/50 text-red-400' :
                      item.status === 'HIGH' ? 'bg-orange-900/50 text-orange-400' :
                      item.status === 'LOW' ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-green-900/50 text-green-400'}
                  `}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
