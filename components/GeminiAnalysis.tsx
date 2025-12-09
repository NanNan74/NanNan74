import React, { useState } from 'react';
import { analyzeFloodRisk } from '../services/geminiService';
import { WaterReading, SystemConfig } from '../types';
import { Sparkles, Loader2, AlertOctagon } from 'lucide-react';

interface GeminiAnalysisProps {
  data: WaterReading[];
  config: SystemConfig;
}

export const GeminiAnalysis: React.FC<GeminiAnalysisProps> = ({ data, config }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeFloodRisk(data, config);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-6 shadow-lg border border-indigo-700/50 relative overflow-hidden">
        {/* Decoration */}
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="w-24 h-24 text-white" />
        </div>

      <h3 className="text-lg font-semibold text-white mb-4 flex items-center relative z-10">
        <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
        Phân tích rủi ro AI (Gemini)
      </h3>
      
      <p className="text-indigo-200 text-sm mb-4 relative z-10">
        Sử dụng trí tuệ nhân tạo để phân tích xu hướng mực nước và dự báo nguy cơ lũ lụt tiềm ẩn dựa trên dữ liệu lịch sử gần nhất.
      </p>

      {analysis ? (
        <div className="bg-black/30 rounded-lg p-4 border border-indigo-500/30 mb-4 animate-fade-in relative z-10">
           <div className="flex items-start">
              <AlertOctagon className="w-6 h-6 text-yellow-400 mr-3 mt-1 flex-shrink-0" />
              <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-line">{analysis}</p>
           </div>
        </div>
      ) : null}

      <button
        onClick={handleAnalyze}
        disabled={loading || data.length === 0}
        className="relative z-10 w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center justify-center shadow-lg shadow-indigo-900/50"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Đang phân tích...
          </>
        ) : (
          'Phân tích ngay'
        )}
      </button>
    </div>
  );
};
