// 导出类型
export type {
  Question,
  MatchResult,
  OCRResponse,
  TokenResponse,
  AppState,
  APIError,
} from "./lib/types";

// 导出函数
export {
  getAllQuestions,
  getQuestionById,
  getQuestionCount,
  searchQuestions,
} from "./lib/questions";
