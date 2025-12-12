// services/geminiService.ts

// Hàm phân tích mức nước bằng Logic (Nhanh - Chuẩn - Không lỗi)
export const analyzeWaterLevel = async (level: number) => {
  if (level >= 70) {
    return "Mức NGUY HIỂM! Nước đã dâng rất cao.";
  } else if (level >= 30) {
    return "Mức CẢNH BÁO. Cần theo dõi sát sao.";
  } else {
    return "Mức AN TOÀN. Mực nước ổn định.";
  }
};

// Hàm đưa ra lời khuyên
export const getFloodAdvice = async (status: string) => {
  // Status này lấy từ Firebase hoặc Logic ở trên
  if (status.includes("NGUY HIỂM") || status.includes("cao")) {
    return "🚨 HÀNH ĐỘNG: Ngắt cầu dao điện, di dời người già/trẻ em và tài sản lên cao ngay lập tức!";
  } else if (status.includes("CẢNH BÁO")) {
    return "⚠️ CHUẨN BỊ: Kê cao đồ đạc, sạc đầy điện thoại và đèn pin dự phòng.";
  } else {
    return "✅ TRẠNG THÁI TỐT: Hệ thống hoạt động bình thường, chưa cần sơ tán.";
  }
};
