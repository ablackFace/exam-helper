"use client";

import type { MatchResult } from "@exam-helper/questions";
import { MatchResultCard } from "./MatchResultCard";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface MatchResultListProps {
  results: MatchResult[];
}

export function MatchResultList({ results }: MatchResultListProps) {
  if (results.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <MagnifyingGlassIcon className="w-5 h-5 text-white" />
        <h2 className="text-lg font-semibold text-white">
          匹配结果
          <span className="text-white/70 font-normal text-sm ml-2">
            找到 {results.length} 道相似题目
          </span>
        </h2>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <MatchResultCard
            key={result.id}
            result={result}
            rank={index + 1}
            isBestMatch={index === 0}
          />
        ))}
      </div>
    </div>
  );
}

