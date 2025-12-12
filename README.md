# 🌊 HỆ THỐNG CẢNH BÁO LŨ LỤT THÔNG MINH (IOT)

> Dự án IoT: Giám sát mực nước theo thời gian thực, cảnh báo sớm qua Telegram và Web Dashboard.

---

## 1. Giới thiệu
Hệ thống giúp người dân và ban quản lý theo dõi mực nước sông/hồ từ xa, tự động phát hiện nguy cơ lũ lụt để sơ tán kịp thời.

Tính năng chính:
- 📡 Giám sát thời gian thực: Cập nhật mực nước và vị trí GPS mỗi 2 giây.
- 🚨 Cảnh báo tức thì: Gửi tin nhắn Telegram kèm vị trí Google Maps khi nước dâng cao.
- 📊 Web Dashboard: Biểu đồ trực quan, xem lịch sử mực nước.
- 🔋 Hoạt động độc lập: Có pin dự phòng và tự động kết nối lại WiFi.

---

## 2. Cấu tạo hệ thống
Hệ thống gồm 3 thành phần chính:

1. Thiết bị IoT (Hardware):
   - Vi điều khiển: ESP32 (Kết nối WiFi & Xử lý).
   - Cảm biến: Cảm biến mực nước Analog (Độ chính xác cao).
   - Định vị: GPS NEO-6M (Xác định vị trí vùng ngập).
   - Báo động: Còi hú và Đèn LED.

2. Máy chủ (Backend):
   - Xử lý dữ liệu từ ESP32 và lưu trữ vào Firebase Cloud.
   - API viết bằng Node.js/Express.

3. Giao diện người dùng (Frontend):
   - Website theo dõi: Viết bằng ReactJS + Vite.
   - Bot Telegram: Tương tác 1 chiều.

---

## 3. Hướng dẫn sử dụng

### 🛠 Điều kiện cần có
- Điện thoại hoặc Máy tính có kết nối Internet.
- Tài khoản Telegram.

### 🚀 Cách truy cập

Cách 1: Xem trên Website
- Mở trình duyệt và truy cập địa chỉ:
  `https://nan-nan74.vercel.app/` (Hoặc link Render của em)

Cách 2: Nhận cảnh báo qua Telegram
1. Mở ứng dụng Telegram.
2. Tìm kiếm Bot: `@CanhBaoLuLut_Bot` (Thay bằng tên Bot của em).
3. Nhấn Start để bắt đầu nhận tin.

---

## 4. Quy định mức cảnh báo

| Mức nước (%) | Trạng thái | Đèn báo | Hành động |
| :--- | :--- | :--- | :--- |
| **< 10%** | ✅ AN TOÀN | Xanh | Không có |
| **10% - 50%** | ⚠️ CẢNH BÁO | Vàng/Cam | Theo dõi sát sao |
| **> 50%** | 🚨 **NGUY HIỂM** | Đỏ + Còi | **Sơ tán ngay lập tức** |

---

## 5. Liên hệ & Hỗ trợ
- Tác giả: NanNan74
- Email: nhuclaus74@gmail.cm
- GitHub: [Link GitHub của em](https://github.com/NanNan74/NanNan74)

---
*© 2025 Flood Warning System Project.*
