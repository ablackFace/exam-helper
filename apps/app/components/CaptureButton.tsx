"use client";

import { useRef } from "react";
import { CameraIcon } from "@heroicons/react/24/solid";

interface CaptureButtonProps {
  onCapture: (file: File) => void;
  disabled?: boolean;
}

export function CaptureButton({
  onCapture,
  disabled = false,
}: CaptureButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onCapture(file);
      event.target.value = "";
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-[0_-4px_20px_rgba(0,0,0,0.1)] safe-area-bottom">
      <div className="px-4 py-3">
        <button
          onClick={handleClick}
          disabled={disabled}
          className={`
            w-full flex items-center justify-center gap-3
            h-14 rounded-2xl font-semibold text-lg text-white
            btn-gradient
            transition-all duration-300
            ${disabled ? "opacity-50 cursor-not-allowed" : "active:scale-[0.98]"}
          `}
        >
          <CameraIcon className="w-6 h-6" />
          <span>拍照识别</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}

