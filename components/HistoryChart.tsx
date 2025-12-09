import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { WaterReading, SystemConfig } from '../types';
import { BarChart3 } from 'lucide-react';

interface HistoryChartProps {
  data: WaterReading[];
  config: SystemConfig;
}

export const HistoryChart: React.FC<HistoryChartProps> = ({ data, config }) => {
  // Format data for chart
  const chartData = [...data].reverse().map(item => ({
    ...item,
    time: new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }));

  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700 h-96 flex flex-col">
      <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
        <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
        Lịch sử mức nước (Live)
      </h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="time" 
              stroke="#94a3b8" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#94a3b8" 
              domain={[0, 100]} 
              unit="%" 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
              itemStyle={{ color: '#60a5fa' }}
            />
            <ReferenceLine y={config.maxThreshold} label="MAX" stroke="red" strokeDasharray="3 3" />
            <ReferenceLine y={config.minThreshold} label="MIN" stroke="orange" strokeDasharray="3 3" />
            
            <Line 
              type="monotone" 
              dataKey="level" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 6, fill: '#60a5fa' }}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
