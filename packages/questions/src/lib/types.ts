/**
 * 题目类型定义
 */

// 题目类型
export interface Question {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
  image?: string;
}

// 匹配结果类型
export interface MatchResult extends Question {
  similarity: number;
}

// OCR API 响应类型
export interface OCRResponse {
  words_result?: Array<{ words: string }>;
  error_code?: number;
  error_msg?: string;
}

// 百度 Token 响应类型
export interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

// 应用状态类型
export interface AppState {
  isLoading: boolean;
  loadingText: string;
  recognizedText: string;
  matchResults: MatchResult[];
  error: string | null;
  questionBank: Question[];
}

// API 错误类型
export interface APIError {
  code: number;
  message: string;
}

