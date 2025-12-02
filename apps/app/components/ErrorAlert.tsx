"use client";

import { useEffect } from "react";
import { XMarkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";

interface ErrorAlertProps {
  message: string | null;
  onClose: () => void;
  autoHideDuration?: number;
}

export function ErrorAlert({
  message,
  onClose,
  autoHideDuration = 5000,
}: ErrorAlertProps) {
  useEffect(() => {
    if (message && autoHideDuration > 0) {
      const timer = setTimeout(onClose, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [message, autoHideDuration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[150] animate-slide-up">
      <div className="bg-rose-50 border border-rose-200 rounded-2xl shadow-lg overflow-hidden max-w-md mx-auto">
        <div className="flex items-start gap-3 p-4">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="w-6 h-6 text-rose-500" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-rose-800">识别失败</p>
            <p className="mt-1 text-sm text-rose-600">{message}</p>
          </div>

          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {autoHideDuration > 0 && (
          <div className="h-1 bg-rose-100">
            <div
              className="h-full bg-rose-400"
              style={{
                animation: `shrink ${autoHideDuration}ms linear forwards`,
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

