import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Github, FolderDown, ArrowRight } from 'lucide-react';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({ isOpen, onClose }) => {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, step: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const steps = [
    {
      title: "1. Tạo Repository trên GitHub",
      desc: "Truy cập github.com, tạo một Repository mới (để trống, không chọn Add README).",
      command: null
    },
    {
      title: "2. Khởi tạo Git trong VS Code",
      desc: "Mở Terminal trong VS Code (Ctrl + `) và chạy lệnh sau để khởi tạo kho lưu trữ.",
      command: "git init"
    },
    {
      title: "3. Thêm file vào Git",
      desc: "Lệnh này sẽ thêm tất cả các file trong thư mục hiện tại vào danh sách chờ commit.",
      command: "git add ."
    },
    {
      title: "4. Lưu trạng thái (Commit)",
      desc: "Lưu lại phiên bản hiện tại với ghi chú.",
      command: 'git commit -m "First commit FloodGuard System"'
    },
    {
      title: "5. Đổi tên nhánh chính",
      desc: "Chuyển tên nhánh thành 'main' theo chuẩn mới của GitHub.",
      command: "git branch -M main"
    },
    {
      title: "6. Kết nối với GitHub",
      desc: "Thay thế URL bên dưới bằng link Repository bạn vừa tạo ở bước 1.",
      command: "git remote add origin https://github.com/USERNAME/TEN_PROJECT.git"
    },
    {
      title: "7. Đẩy code lên (Push)",
      desc: "Đẩy toàn bộ code từ máy tính lên GitHub.",
      command: "git push -u origin main"
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 w-full max-w-2xl rounded-xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800/50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-700 p-2 rounded-lg">
              <Github className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Đưa Code lên GitHub</h2>
              <div className="text-xs text-slate-400 mt-0.5">Hướng dẫn từng bước cho VS Code</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-2 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            
            {/* Step 0: Download Warning */}
            <div className="mb-8 bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 flex gap-4">
                <div className="bg-blue-600/20 p-2 rounded-full h-fit">
                    <FolderDown className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <h3 className="text-blue-200 font-bold text-sm mb-1">Trước khi bắt đầu:</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                        Bạn cần đảm bảo toàn bộ mã nguồn web này đã được tải về máy tính và đang mở trong VS Code. 
                        Nếu bạn đang xem trên trình duyệt, hãy tải code về trước.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {steps.map((step, index) => (
                    <div key={index} className="relative pl-8 border-l border-slate-700 pb-1">
                        <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-300">
                            {index + 1}
                        </div>
                        
                        <h3 className="text-white font-medium text-sm mb-1">{step.title}</h3>
                        <p className="text-slate-500 text-xs mb-3">{step.desc}</p>
                        
                        {step.command && (
                            <div className="bg-black/50 rounded-lg border border-slate-800 group relative">
                                <div className="flex items-center px-4 py-2 border-b border-slate-800/50">
                                    <Terminal className="w-3 h-3 text-green-500 mr-2" />
                                    <span className="text-xs text-slate-500 font-mono">Terminal</span>
                                </div>
                                <div className="p-4 font-mono text-sm text-green-400 break-all pr-12">
                                    {step.command}
                                </div>
                                <button 
                                    onClick={() => handleCopy(step.command!, index)}
                                    className="absolute top-1/2 -translate-y-1/2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"
                                    title="Copy lệnh"
                                >
                                    {copiedStep === index ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="mt-8 text-center">
                 <p className="text-slate-500 text-xs flex items-center justify-center gap-1">
                    Sau khi hoàn tất, refresh trang GitHub để thấy code của bạn <Check className="w-3 h-3 text-green-500" />
                 </p>
            </div>
        </div>
      </div>
    </div>
  );
};