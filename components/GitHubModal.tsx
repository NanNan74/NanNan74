import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Github, FolderDown, Rocket, Globe, Server } from 'lucide-react';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({ isOpen, onClose }) => {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'git' | 'deploy'>('git');

  if (!isOpen) return null;

  const handleCopy = (text: string, step: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const gitSteps = [
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
      <div className="bg-slate-900 w-full max-w-3xl rounded-xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800/50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-700 p-2 rounded-lg">
              <Github className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Quản lý Mã nguồn & Web</h2>
              <div className="text-xs text-slate-400 mt-0.5">Lưu trữ code và chạy web online</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-2 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-900">
            <button 
                onClick={() => setActiveTab('git')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center transition-all ${activeTab === 'git' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/30' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
            >
                <Terminal className="w-4 h-4 mr-2" /> 1. Đẩy Code lên GitHub
            </button>
            <button 
                onClick={() => setActiveTab('deploy')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center transition-all ${activeTab === 'deploy' ? 'text-green-400 border-b-2 border-green-500 bg-slate-800/30' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
            >
                <Rocket className="w-4 h-4 mr-2" /> 2. Chạy Web (Online)
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-900">
            
            {/* TAB 1: GIT */}
            {activeTab === 'git' && (
                <>
                    <div className="mb-6 bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 flex gap-4">
                        <div className="bg-blue-600/20 p-2 rounded-full h-fit">
                            <FolderDown className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-blue-200 font-bold text-sm mb-1">Lưu ý quan trọng:</h3>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                Bạn cần tải code về máy và mở bằng VS Code trước. Sau đó mở Terminal (Ctrl + `) để nhập các lệnh bên dưới.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {gitSteps.map((step, index) => (
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
                </>
            )}

            {/* TAB 2: DEPLOY */}
            {activeTab === 'deploy' && (
                <div className="max-w-2xl mx-auto space-y-8">
                     <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-800/50 rounded-xl p-6 flex items-start gap-4">
                        <div className="bg-green-600/20 p-3 rounded-full">
                            <Globe className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg mb-1">Đưa Web lên Internet</h3>
                            <p className="text-sm text-slate-300">
                                Sau khi đã đẩy code lên GitHub ở Bước 1, hãy làm theo cách này để có đường link web (VD: floodguard.vercel.app) gửi cho mọi người.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                             <h4 className="text-white font-bold mb-2 flex items-center">
                                <span className="w-6 h-6 rounded-full bg-white text-slate-900 flex items-center justify-center text-xs mr-3">1</span>
                                Truy cập Vercel
                             </h4>
                             <p className="text-slate-400 text-sm ml-9">
                                Vào trang web <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-bold">vercel.com</a> và đăng nhập bằng tài khoản <strong>GitHub</strong> của bạn.
                             </p>
                        </div>

                        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                             <h4 className="text-white font-bold mb-2 flex items-center">
                                <span className="w-6 h-6 rounded-full bg-white text-slate-900 flex items-center justify-center text-xs mr-3">2</span>
                                Thêm Dự án mới (New Project)
                             </h4>
                             <p className="text-slate-400 text-sm ml-9 mb-2">
                                Bấm nút <strong>"Add New..."</strong> -&gt; <strong>"Project"</strong>.
                             </p>
                             <p className="text-slate-400 text-sm ml-9">
                                Bạn sẽ thấy danh sách các kho code từ GitHub của bạn. Tìm <strong>FloodGuard</strong> và bấm nút <strong>Import</strong>.
                             </p>
                        </div>

                        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                             <h4 className="text-white font-bold mb-2 flex items-center">
                                <span className="w-6 h-6 rounded-full bg-white text-slate-900 flex items-center justify-center text-xs mr-3">3</span>
                                Bấm Deploy
                             </h4>
                             <p className="text-slate-400 text-sm ml-9 mb-2">
                                Không cần chỉnh sửa gì cả. Chỉ cần bấm nút xanh <strong>"Deploy"</strong>.
                             </p>
                             <p className="text-slate-400 text-sm ml-9">
                                Đợi khoảng 1 phút, màn hình pháo hoa sẽ hiện ra. Bấm vào ảnh giao diện web để mở trang web chính thức của bạn!
                             </p>
                        </div>
                    </div>

                    <div className="text-center p-4">
                        <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-white text-black font-bold py-3 px-6 rounded-lg hover:bg-slate-200 transition-colors">
                            <Server className="w-4 h-4 mr-2" />
                            Đến trang Vercel Deploy ngay
                        </a>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};