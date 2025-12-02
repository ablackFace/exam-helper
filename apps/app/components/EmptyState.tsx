"use client";

import { CameraIcon, SparklesIcon } from "@heroicons/react/24/outline";

interface EmptyStateProps {
  isQuestionBankLoaded: boolean;
}

export function EmptyState({ isQuestionBankLoaded }: EmptyStateProps) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 text-center animate-fade-in">
      <div className="relative mx-auto w-20 h-20 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-2xl rotate-6 opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center">
          <CameraIcon className="w-10 h-10 text-white" />
        </div>
        <SparklesIcon className="absolute -top-2 -right-2 w-6 h-6 text-amber-400" />
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-2">开始识别</h2>

      <p className="text-gray-500 mb-6 leading-relaxed">
        点击底部按钮拍照或上传题目图片
        <br />
        AI 将自动识别并匹配答案
      </p>

      <div className="space-y-3 text-left max-w-xs mx-auto">
        <Step number={1} text="点击「拍照识别」按钮" />
        <Step number={2} text="对准题目拍照或选择图片" />
        <Step number={3} text="等待 AI 识别并匹配答案" />
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-center gap-2 text-sm">
          <div
            className={`w-2 h-2 rounded-full ${isQuestionBankLoaded ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`}
          ></div>
          <span className="text-gray-500">
            {isQuestionBankLoaded ? "题库已就绪" : "题库加载中..."}
          </span>
        </div>
      </div>
    </div>
  );
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-600 text-sm font-semibold flex items-center justify-center">
        {number}
      </span>
      <span className="text-gray-600 text-sm">{text}</span>
    </div>
  );
}

