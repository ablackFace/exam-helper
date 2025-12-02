/**
 * 题库数据模块
 * 提供题库数据的加载和访问功能
 */

import type { Question } from './types.js';

// 静态导入题库数据（用于服务端）
import questionsData from '../../data/questions.json' with { type: 'json' };

/**
 * 获取所有题目
 */
export function getAllQuestions(): Question[] {
  return questionsData as Question[];
}

/**
 * 根据 ID 获取单个题目
 */
export function getQuestionById(id: number): Question | undefined {
  return (questionsData as Question[]).find((q) => q.id === id);
}

/**
 * 获取题库总数
 */
export function getQuestionCount(): number {
  return questionsData.length;
}

/**
 * 搜索题目（简单文本匹配）
 */
export function searchQuestions(keyword: string): Question[] {
  const lowerKeyword = keyword.toLowerCase();
  return (questionsData as Question[]).filter(
    (q) =>
      q.question.toLowerCase().includes(lowerKeyword) ||
      q.options.some((opt) => opt.toLowerCase().includes(lowerKeyword))
  );
}
