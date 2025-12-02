/**
 * HTML 题库解析器
 * 解析 HTML 格式的题库文件并转换为 JSON 格式
 */

import * as cheerio from 'cheerio';
import type { Question } from '@exam-helper/questions';

/**
 * 提取图片 URL（从 img 标签的 src 或 ybsrc 属性）
 */
function extractImageUrl(questionHtml: string): string | null {
  const imgMatch = questionHtml.match(
    /<img[^>]*(?:src|ybsrc)=["']([^"']+)["'][^>]*>/i
  );
  if (imgMatch && imgMatch[1]) {
    let imageUrl = imgMatch[1];
    // 如果 URL 以 // 开头，添加 https: 前缀
    if (imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl;
    }
    return imageUrl;
  }
  return null;
}

/**
 * 清理题目文本（去除 HTML 标签、图片、多余空格）
 */
function cleanQuestionText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<img[^>]*>/gi, '') // 移除图片标签
    .replace(/<[^>]+>/g, '') // 移除所有 HTML 标签
    .replace(/\s+/g, ' ') // 多个空格合并为一个
    .trim();
}

/**
 * 提取选项（从题目文本中解析 A、B、C、D 选项）
 */
function extractOptions(questionHtml: string): string[] {
  const options: string[] = [];

  // 先清理 HTML 标签，将 <br> 替换为换行符
  const cleanText = questionHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<img[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();

  // 匹配 A、B、C、D 开头的选项
  const optionPattern = /([A-D])[、.]([^\n]+)/g;
  let match;

  while ((match = optionPattern.exec(cleanText)) !== null) {
    const optionLetter = match[1];
    const optionText = match[2].trim();
    if (optionText) {
      options.push(`${optionLetter}. ${optionText}`);
    }
  }

  return options;
}

/**
 * 提取题目文本（去除选项部分）
 */
function extractQuestionOnly(text: string): string {
  const optionMatch = text.match(/([A-D])[、.]/);
  if (optionMatch) {
    return text.substring(0, optionMatch.index).trim();
  }
  return text.trim();
}

/**
 * 题目文本去重键（去除空格和标点）
 */
function getQuestionKey(question: string): string {
  return question
    .replace(/[，。、；：！？""''（）【】《》\s]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * 解析单个 HTML 文件内容
 */
export function parseHtmlContent(htmlContent: string): Omit<Question, 'id'>[] {
  // HTML 文件开头可能有单引号，需要处理
  let cleanHtml = htmlContent.startsWith("'")
    ? htmlContent.substring(1)
    : htmlContent;

  // 包装成完整的 HTML 文档
  cleanHtml = `<table>${cleanHtml}</table>`;

  const $ = cheerio.load(cleanHtml);
  const questions: Omit<Question, 'id'>[] = [];

  const rows = $('tr.TR_bgW');

  rows.each((_, element) => {
    const $row = $(element);

    // 跳过表头
    if ($row.find('th').length > 0) {
      return;
    }

    // 提取题目内容
    const $questionCell = $row.find('td.stTR');
    if ($questionCell.length === 0) {
      return;
    }

    const $link = $questionCell.find('a');
    if ($link.length === 0) {
      return;
    }

    const questionHtml = $link.html() || '';
    const questionText = cleanQuestionText(questionHtml);

    if (!questionText) {
      return;
    }

    // 提取选项
    let options = extractOptions(questionHtml);
    const questionOnly = extractQuestionOnly(questionText);

    // 提取图片 URL
    const cellHtml = $questionCell.html() || '';
    const imageUrl = extractImageUrl(cellHtml);

    // 提取答案
    const $answerCell = $row.find('td.DAV');
    let answerText = $answerCell.find('strong').text().trim();

    if (!answerText || answerText === '显示答案') {
      const allText = $answerCell.text().trim();
      answerText = allText.replace(/显示答案/g, '').trim();
    }

    if (!answerText) {
      return;
    }

    // 如果是判断题，添加标准选项
    if ((answerText === '对' || answerText === '错') && options.length === 0) {
      options = ['A. 正确', 'B. 错误'];
      answerText = answerText === '对' ? 'A' : 'B';
    }

    // 构建题目对象
    const questionObj: Omit<Question, 'id'> = {
      question: questionOnly,
      options: options,
      answer: answerText,
      explanation: '',
    };

    // 如果有图片，添加 image 字段
    if (imageUrl) {
      questionObj.image = imageUrl;
    }

    questions.push(questionObj);
  });

  return questions;
}

/**
 * 合并并去重题目
 */
export function mergeAndDeduplicate(
  existingQuestions: Question[],
  newQuestions: Omit<Question, 'id'>[]
): Question[] {
  const questionKeyMap = new Map<string, boolean>();
  const mergedQuestions: Question[] = [];

  // 先添加现有题目
  existingQuestions.forEach((q) => {
    const key = getQuestionKey(q.question);
    if (!questionKeyMap.has(key)) {
      questionKeyMap.set(key, true);
      mergedQuestions.push(q);
    }
  });

  // 添加新题目（去重）
  let addedCount = 0;
  let duplicateCount = 0;

  newQuestions.forEach((q) => {
    const key = getQuestionKey(q.question);
    if (!questionKeyMap.has(key)) {
      questionKeyMap.set(key, true);
      mergedQuestions.push({ ...q, id: 0 }); // 临时 ID
      addedCount++;
    } else {
      duplicateCount++;
    }
  });

  console.log(
    `合并结果: 新增 ${addedCount} 道题目，跳过 ${duplicateCount} 道重复题目`
  );

  // 重新分配 ID
  mergedQuestions.forEach((q, index) => {
    q.id = index + 1;
  });

  return mergedQuestions;
}
