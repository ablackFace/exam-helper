"use client";

import { useState } from "react";
import Image from "next/image";
import type { MatchResult } from "@exam-helper/questions";
import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";

interface MatchResultCardProps {
  result: MatchResult;
  rank: number;
  isBestMatch?: boolean;
}

export function MatchResultCard({
  result,
  rank,
  isBestMatch = false,
}: MatchResultCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  const similarityPercent = (result.similarity * 100).toFixed(1);

  const getSimilarityColor = () => {
    if (result.similarity >= 0.8) return "bg-emerald-500";
    if (result.similarity >= 0.6) return "bg-amber-500";
    return "bg-gray-400";
  };

  const isCorrectOption = (option: string) => {
    const optionLetter = option.trim().charAt(0);
    return result.answer && optionLetter === result.answer.trim();
  };

  return (
    <div
      className={`
        bg-white rounded-2xl shadow-lg overflow-hidden
        transition-all duration-300
        ${isBestMatch ? "ring-2 ring-emerald-500 shadow-emerald-100" : ""}
        animate-slide-up
      `}
      style={{ animationDelay: `${rank * 50}ms` }}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span
            className={`
            inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold
            ${isBestMatch ? "bg-emerald-500 text-white" : "bg-violet-100 text-violet-600"}
          `}
          >
            {rank}
          </span>
          {isBestMatch && (
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              最佳匹配
            </span>
          )}
        </div>
        <span
          className={`
          inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white
          ${getSimilarityColor()}
        `}
        >
          {similarityPercent}%
        </span>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <div className="text-xs font-medium text-violet-500 mb-1.5">题目</div>
          <p className="text-gray-800 leading-relaxed">{result.question}</p>
        </div>

        {result.image && !imageError && (
          <div>
            <div className="text-xs font-medium text-violet-500 mb-1.5">
              图片
            </div>
            <div
              className="relative cursor-pointer"
              onClick={() => setIsImageExpanded(true)}
            >
              <Image
                src={result.image}
                alt="题目图片"
                width={300}
                height={200}
                className="w-full rounded-lg border border-gray-200 object-contain bg-gray-50"
                onError={() => setImageError(true)}
                unoptimized
              />
            </div>
          </div>
        )}

        {result.options && result.options.length > 0 && (
          <div>
            <div className="text-xs font-medium text-violet-500 mb-1.5">
              选项
            </div>
            <div className="space-y-2">
              {result.options.map((option, index) => (
                <div
                  key={index}
                  className={`
                    px-3 py-2.5 rounded-xl text-sm transition-colors
                    ${
                      isCorrectOption(option)
                        ? "bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-500 text-emerald-800 font-medium"
                        : "bg-gray-50 text-gray-600 border-l-4 border-transparent"
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    {isCorrectOption(option) && (
                      <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    )}
                    <span>{option}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.explanation && (
          <div>
            <div className="text-xs font-medium text-violet-500 mb-1.5">
              解析
            </div>
            <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-3 rounded-xl">
              {result.explanation}
            </p>
          </div>
        )}
      </div>

      {isImageExpanded && result.image && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsImageExpanded(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={() => setIsImageExpanded(false)}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <Image
            src={result.image}
            alt="题目图片"
            width={800}
            height={600}
            className="max-w-full max-h-full object-contain rounded-lg"
            unoptimized
          />
        </div>
      )}
    </div>
  );
}

