import { GoogleGenAI } from "@google/genai";
import { WaterReading, SystemConfig } from '../types';

// Initialize Gemini Client
// In a real app, do not expose keys on client side without safeguards.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeFloodRisk = async (
  readings: WaterReading[],
  config: SystemConfig
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Vui lòng cấu hình API Key để sử dụng tính năng AI.";
  }

  const recentReadings = readings.slice(0, 20).map(r => 
    `Time: ${new Date(r.timestamp).toLocaleTimeString()}, Level: ${r.level}%, Status: ${r.status}`
  ).join('\n');

  const prompt = `
    Bạn là một chuyên gia phân tích dữ liệu thủy văn và an toàn lũ lụt.
    Dưới đây là dữ liệu mực nước gần đây từ cảm biến IoT:
    ${recentReadings}

    Cấu hình cảnh báo: Ngưỡng cao là ${config.maxThreshold}%.

    Hãy phân tích ngắn gọn (dưới 100 từ) về xu hướng mực nước.
    Có nguy cơ lũ lụt hoặc tràn bể không?
    Đưa ra khuyến nghị hành động ngay lập tức nếu cần.
    Trả lời bằng tiếng Việt.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Không thể phân tích dữ liệu.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Lỗi khi kết nối với AI. Vui lòng thử lại sau.";
  }
};
