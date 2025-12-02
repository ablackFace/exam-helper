/**
 * 文本处理工具
 * 处理 OCR 识别结果的清理、纠错和预处理
 */

// OCR 错误纠正映射表
const OCR_ERROR_MAP: Record<string, string> = {
  抑图所示: '如图所示',
  机同: '机向',
  同: '向',
  '○': '',
  '●': '',
  '？': '',
  '?': '',
  ' ': '',
};

/**
 * 纠正 OCR 识别错误
 */
export function correctOCRErrors(text: string): string {
  let corrected = text;
  for (const [error, correct] of Object.entries(OCR_ERROR_MAP)) {
    const escapedError = error.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    corrected = corrected.replace(new RegExp(escapedError, 'g'), correct);
  }

  // 清理多余的空格和换行
  corrected = corrected
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return corrected;
}

/**
 * 检测单行是否是噪声文字
 */
export function isNoiseLine(str: string): boolean {
  const trimmed = str.trim();
  if (!trimmed) return true;

  const noisePatterns = [
    /^[A-D][:：]\s*$/,
    /^[○●]+\s*$/,
    /^\d+[、.]\s*$/,
    /^(判断题|单选题|多选题)$/,
    /^[学法减分]+$/,
  ];

  if (trimmed.length <= 2) return true;
  if (trimmed.length <= 4 && !/[\u4e00-\u9fa5]{2,}/.test(trimmed)) return true;

  for (const pattern of noisePatterns) {
    if (pattern.test(trimmed)) return true;
  }

  const adKeywords = [
    '钢结构',
    '四代宅',
    '创意展示',
    '超云动',
    '天题云',
    '云动从',
    '盈多世',
    '多世好',
    '留大是',
    '名章任',
    '血天',
    '私亨',
    '私享会',
    '留久',
    '留太',
    '名草',
    '告',
  ];
  for (const keyword of adKeywords) {
    if (trimmed.includes(keyword)) return true;
  }

  return false;
}

/**
 * 清理识别结果文本
 */
export function cleanRecognizedText(text: string): string {
  if (!text) return '';

  let cleaned = correctOCRErrors(text);

  const lines = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line);

  const resultLines: string[] = [];
  let foundQuestion = false;
  let foundOptions = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^\d+$/.test(line)) continue;

    if (
      line === '判断题' ||
      line === '单选题' ||
      line === '多选题' ||
      line.includes('判断题') ||
      line.includes('单选题') ||
      line.includes('多选题') ||
      /^[学法减分]+$/.test(line)
    ) {
      continue;
    }

    if (isNoiseLine(line)) continue;

    if (!foundQuestion) {
      if (
        /^[?？]/.test(line) ||
        /^\d+[、.]/.test(line) ||
        (line.length > 5 && !/^[○●]+$/.test(line))
      ) {
        foundQuestion = true;
        const questionLine = line
          .replace(/^[?？]?\d*[、.]\s*/, '')
          .replace(/^[?？]\s*/, '')
          .replace(/^[○●]+\s*/, '');
        if (questionLine) {
          resultLines.push(questionLine);
        }
        continue;
      }
    }

    if (foundQuestion) {
      if (/^[○●]?[A-D][:：]/.test(line)) {
        foundOptions = true;
        const optionLine = line
          .replace(/^[○●]+\s*/, '')
          .replace(/^([A-D])[:：]\s*/, '$1. ');
        resultLines.push(optionLine);
        continue;
      }

      if (!foundOptions) {
        if (!isNoiseLine(line)) {
          resultLines.push(line);
        } else {
          break;
        }
      } else {
        if (/^[○●]?[A-D][:：]/.test(line)) {
          const optionLine = line
            .replace(/^[○●]+\s*/, '')
            .replace(/^([A-D])[:：]\s*/, '$1. ');
          resultLines.push(optionLine);
        } else if (!isNoiseLine(line) && line.length > 3) {
          resultLines.push(line);
        }
      }
    }
  }

  if (resultLines.length === 0) {
    const filtered = lines.filter((line) => !isNoiseLine(line));
    return filtered.join('\n');
  }

  return resultLines.join('\n').replace(/\n{3,}/g, '\n\n');
}

/**
 * 文本预处理（用于匹配）
 */
export function preprocessText(text: string): string {
  let processed = correctOCRErrors(text);
  processed = processed
    .replace(/[，。、；：！？""''（）【】《》\s○●？?]/g, '')
    .toLowerCase()
    .trim();
  return processed;
}

/**
 * 提取关键词
 */
export function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    '的',
    '了',
    '是',
    '在',
    '有',
    '和',
    '就',
    '不',
    '人',
    '都',
    '一',
    '一个',
    '上',
    '也',
    '很',
    '到',
    '说',
    '要',
    '去',
    '你',
    '会',
    '着',
    '没有',
    '看',
    '好',
    '自己',
    '这',
    '那',
    '为',
    '与',
    '及',
    '或',
    '等',
    '个',
    '中',
    '对',
    '能',
    '可',
    '以',
    '向',
    '从',
    '被',
    '由',
    '把',
    '给',
    '让',
    '使',
    '将',
  ]);

  const cleaned = text.replace(/[，。、；：！？""''（）【】《》\s○●]/g, '');
  const keywords = new Set<string>();

  for (let len = 2; len <= 4; len++) {
    for (let i = 0; i <= cleaned.length - len; i++) {
      const word = cleaned.substring(i, i + len);
      const pattern = new RegExp(`[\\u4e00-\\u9fa5]{${len}}`);
      if (pattern.test(word) && !stopWords.has(word)) {
        keywords.add(word);
      }
    }
  }

  return Array.from(keywords);
}
