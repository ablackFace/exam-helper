"use client";

interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
}

export function LoadingOverlay({
  isVisible,
  text = "正在处理中...",
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-xs w-full text-center animate-fade-in">
        <div className="relative mx-auto w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-violet-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-violet-500 animate-pulse-slow"></div>
          </div>
        </div>

        <p className="text-gray-700 font-medium">{text}</p>
        <p className="text-gray-400 text-sm mt-2">请稍候...</p>
      </div>
    </div>
  );
}

