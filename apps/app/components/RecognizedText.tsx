'use client';

import { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface RecognizedTextProps {
  text: string;
}

export function RecognizedText({ text }: RecognizedTextProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!text) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-slide-up">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-gray-700">
          <DocumentTextIcon className="w-5 h-5 text-violet-500" />
          <span className="font-medium">识别结果</span>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        )}
      </button>

      <div
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isExpanded ? 'max-h-96' : 'max-h-0'}
        `}
      >
        <div className="p-4 border-t border-gray-100">
          <pre className="text-sm text-gray-600 whitespace-pre-wrap break-words font-sans leading-relaxed">
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}
