/**
 * 题库匹配算法
 */

import type { Question, MatchResult } from '@exam-helper/questions';
import {
  preprocessText,
  extractKeywords,
  correctOCRErrors,
  isNoiseLine,
} from './textProcessor';

/**
 * 计算 Levenshtein 距离
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * 计算关键词相似度
 */
function calculateKeywordSimilarity(text1: string, text2: string): number {
  const keywords1 = extractKeywords(text1);
  const keywords2 = extractKeywords(text2);

  if (keywords1.length === 0 || keywords2.length === 0) {
    return 0;
  }

  const intersection = keywords1.filter((k) => keywords2.includes(k));
  const union = new Set([...keywords1, ...keywords2]);
  const jaccard = intersection.length / union.size;

  const coverage1 = intersection.length / keywords1.length;
  const coverage2 = intersection.length / keywords2.length;
  const avgCoverage = (coverage1 + coverage2) / 2;

  return jaccard * 0.6 + avgCoverage * 0.4;
}

/**
 * 计算综合相似度
 */
function calculateSimilarity(text1: string, text2: string): number {
  const processed1 = preprocessText(text1);
  const processed2 = preprocessText(text2);

  if (processed1.length === 0 || processed2.length === 0) {
    return 0;
  }

  // 完全匹配
  if (processed1 === processed2) {
    return 1;
  }

  // 包含关系检查（OCR 识别的文本可能包含题库题目，或反过来）
  let containBonus = 0;
  if (processed1.includes(processed2)) {
    // 识别文本包含题库题目
    containBonus = 0.3 * (processed2.length / processed1.length);
  } else if (processed2.includes(processed1)) {
    // 题库题目包含识别文本
    containBonus = 0.3 * (processed1.length / processed2.length);
  }

  // Levenshtein 编辑距离相似度
  const distance = levenshteinDistance(processed1, processed2);
  const maxLength = Math.max(processed1.length, processed2.length);
  const editSimilarity = 1 - distance / maxLength;

  // 关键词相似度
  const keywordSimilarity = calculateKeywordSimilarity(text1, text2);

  // 综合计算，增加包含关系加成
  const baseSimilarity = editSimilarity * 0.5 + keywordSimilarity * 0.5;

  return Math.min(1, baseSimilarity + containBonus);
}

/**
 * 从识别文本中提取题目内容（不包含选项）
 */
function extractQuestionText(recognizedText: string): string {
  // 先用正则移除所有选项内容（包括行内选项）
  let text = recognizedText
    // 移除选项行（以 ○A、●B、A.、A、等开头）
    .replace(/[○●]?[A-D][、.．:：][^\n]*/g, '')
    // 移除题目序号
    .replace(/^\d+[、.．]\s*/gm, '')
    // 移除题型标识
    .replace(/(单选题|多选题|判断题)/g, '');

  const lines = text.split('\n').filter((line) => line.trim());
  const questionLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // 跳过空行和纯数字
    if (!trimmed || /^\d+$/.test(trimmed)) continue;

    // 跳过噪声行
    if (isNoiseLine(trimmed)) continue;

    // 跳过学法减分等无关内容
    if (/^[学法减分●○]+$/.test(trimmed)) continue;

    // 如果遇到选项标识，停止收集
    if (/^[○●]?[A-D][、.．:：]/.test(trimmed)) break;

    questionLines.push(trimmed);
  }

  let questionText = questionLines.join('');

  // 如果没有提取到内容，尝试从原文本中提取
  if (!questionText) {
    // 尝试提取到第一个选项之前的内容
    const match = recognizedText.match(/^([\s\S]*?)(?:[○●]?[A-D][、.．:：]|$)/);
    if (match && match[1]) {
      questionText = match[1]
        .replace(/^\d+[、.．]\s*/gm, '')
        .replace(/(单选题|多选题|判断题)/g, '')
        .replace(/\n/g, '')
        .trim();
    }
  }

  return correctOCRErrors(questionText);
}

/**
 * 查找最佳匹配的题目
 */
export function findBestMatches(
  recognizedText: string,
  questionBank: Question[],
  threshold: number = 0.25
): MatchResult[] {
  if (questionBank.length === 0) {
    console.error('题库为空，无法匹配');
    return [];
  }

  const questionText = extractQuestionText(recognizedText);
  console.log('提取的题目文本:', questionText);

  const matches: MatchResult[] = [];

  questionBank.forEach((item) => {
    const similarity = calculateSimilarity(questionText, item.question);

    if (similarity > threshold) {
      matches.push({
        ...item,
        similarity,
      });
    }
  });

  matches.sort((a, b) => b.similarity - a.similarity);

  const highSimilarityMatches = matches.filter((m) => m.similarity > 0.4);
  const result =
    highSimilarityMatches.length > 0
      ? highSimilarityMatches
      : matches.slice(0, 10);

  console.log(`匹配完成，找到 ${result.length} 道相似题目`);
  return result;
}
