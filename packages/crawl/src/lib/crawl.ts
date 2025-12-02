/**
 * 题库爬取主程序
 * 读取 HTML 文件并解析为 JSON 格式
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { parseHtmlContent, mergeAndDeduplicate } from "./parser";
import type { Question } from "@exam-helper/questions";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置路径
const QUESTIONS_DIR = path.join(__dirname, "../../questions");
const OUTPUT_FILE = path.join(__dirname, "../../../questions/data/questions.json");

// 科目目录
const SUBJECT_DIRS = ["科目一", "科目四"];

/**
 * 读取现有题库
 */
function loadExistingQuestions(): Question[] {
  try {
    if (fs.existsSync(OUTPUT_FILE)) {
      const content = fs.readFileSync(OUTPUT_FILE, "utf-8");
      const questions = JSON.parse(content);
      console.log(`读取现有题库，共 ${questions.length} 道题目`);
      return questions;
    }
  } catch (error) {
    console.warn("读取现有题库失败，将创建新题库:", (error as Error).message);
  }
  return [];
}

/**
 * 获取所有 HTML 文件路径
 */
function getHtmlFiles(): string[] {
  const htmlFiles: string[] = [];

  SUBJECT_DIRS.forEach((subject) => {
    const subjectDir = path.join(QUESTIONS_DIR, subject);
    if (fs.existsSync(subjectDir)) {
      for (let i = 1; i <= 10; i++) {
        const filePath = path.join(subjectDir, `${i}.html`);
        if (fs.existsSync(filePath)) {
          htmlFiles.push(filePath);
        }
      }
    }
  });

  return htmlFiles;
}

/**
 * 解析单个 HTML 文件
 */
function parseHtmlFile(filePath: string): Omit<Question, "id">[] {
  console.log(`正在解析: ${path.basename(filePath)}`);

  try {
    const htmlContent = fs.readFileSync(filePath, "utf-8");
    const questions = parseHtmlContent(htmlContent);
    console.log(`  解析完成，共 ${questions.length} 道题目`);
    return questions;
  } catch (error) {
    console.error(`解析文件失败 ${filePath}:`, (error as Error).message);
    return [];
  }
}

/**
 * 主函数：解析所有 HTML 文件并生成题库
 */
export function buildQuestionBank(): void {
  console.log("========== 开始解析题库 ==========\n");

  // 读取现有题库
  const existingQuestions = loadExistingQuestions();

  // 获取所有 HTML 文件
  const htmlFiles = getHtmlFiles();
  console.log(`找到 ${htmlFiles.length} 个 HTML 文件\n`);

  if (htmlFiles.length === 0) {
    console.warn("未找到任何 HTML 文件，请检查 questions 目录");
    return;
  }

  // 解析所有 HTML 文件
  const allNewQuestions: Omit<Question, "id">[] = [];
  htmlFiles.forEach((filePath) => {
    const questions = parseHtmlFile(filePath);
    allNewQuestions.push(...questions);
  });

  console.log(`\n共解析出 ${allNewQuestions.length} 道新题目`);

  // 合并并去重
  const mergedQuestions = mergeAndDeduplicate(existingQuestions, allNewQuestions);

  // 确保输出目录存在
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 保存到文件
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mergedQuestions, null, 2), "utf-8");

  console.log(`\n========== 解析完成 ==========`);
  console.log(`最终题库共 ${mergedQuestions.length} 道题目`);
  console.log(`已保存到: ${OUTPUT_FILE}`);
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  buildQuestionBank();
}
