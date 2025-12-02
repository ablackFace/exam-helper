/**
 * 题库匹配算法
 */

import type { Question, MatchResult } from "@exam-helper/questions";
import {
  preprocessText,
  extractKeywords,
  correctOCRErrors,
  isNoiseLine,
} from "./textProcessor";

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

  const distance = levenshteinDistance(processed1, processed2);
  const maxLength = Math.max(processed1.length, processed2.length);
  const editSimilarity = 1 - distance / maxLength;

  const keywordSimilarity = calculateKeywordSimilarity(text1, text2);

  return editSimilarity * 0.4 + keywordSimilarity * 0.6;
}

/**
 * 从识别文本中提取题目内容
 */
function extractQuestionText(recognizedText: string): string {
  const lines = recognizedText.split("\n").filter((line) => line.trim());
  let questionText = "";
  let foundQuestionStart = false;
  const collectedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (/^\d+$/.test(line)) continue;

    if (
      line === "判断题" ||
      line === "单选题" ||
      line === "多选题" ||
      line.includes("判断题") ||
      line.includes("单选题") ||
      line.includes("多选题")
    ) {
      continue;
    }

    if (/^[○●]?[A-D][:：]/.test(line)) {
      if (foundQuestionStart) break;
      continue;
    }

    if (!foundQuestionStart) {
      if (/^[?？]?\d*[、.]/.test(line) || /^[?？]/.test(line)) {
        foundQuestionStart = true;
        questionText = line
          .replace(/^[?？]?\d*[、.]\s*/, "")
          .replace(/^[?？]\s*/, "");
        collectedLines.push(questionText);
      } else if (line.length > 5 && !/^[学法减分●○]+$/.test(line)) {
        foundQuestionStart = true;
        questionText = line;
        collectedLines.push(questionText);
      }
    } else {
      if (/^[○●]?[A-D][:：]/.test(line)) break;
      if (isNoiseLine(line)) break;

      collectedLines.push(line);
      questionText += line;
    }
  }

  if (!questionText) {
    const filteredText = recognizedText
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim();
        return (
          trimmed &&
          !/^\d+$/.test(trimmed) &&
          trimmed !== "判断题" &&
          trimmed !== "单选题" &&
          trimmed !== "多选题" &&
          !/^[○●]?[A-D][:：]/.test(trimmed) &&
          !/^[学法减分●○]+$/.test(trimmed)
        );
      })
      .join("");
    questionText = filteredText
      .split("\n")
      .filter((line) => !isNoiseLine(line))
      .join("");
  } else {
    questionText = collectedLines
      .filter((line) => !isNoiseLine(line))
      .join("");
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
    console.error("题库为空，无法匹配");
    return [];
  }

  const questionText = extractQuestionText(recognizedText);
  console.log("提取的题目文本:", questionText);

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

