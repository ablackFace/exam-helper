/**
 * OCR API 封装
 */

import type { OCRResponse } from "@exam-helper/questions";

/**
 * 调用 OCR 识别 API
 */
export async function recognizeText(imageBase64: string): Promise<string> {
  try {
    const response = await fetch("/api/ocr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: imageBase64 }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP 错误: ${response.status}`);
    }

    const data: OCRResponse = await response.json();

    if (data.error_code) {
      const errorMessages: Record<number, string> = {
        18: "API 调用量超限，请稍后再试",
        19: "API 密钥无效，请检查配置",
        110: "Access Token 无效，请重新获取",
      };
      const message =
        errorMessages[data.error_code] ||
        data.error_msg ||
        `OCR 识别失败 (错误码: ${data.error_code})`;
      throw new Error(message);
    }

    if (data.words_result && data.words_result.length > 0) {
      const text = data.words_result.map((item) => item.words).join("\n");
      console.log("OCR 识别结果:", text);
      return text;
    } else {
      throw new Error("未识别到文字内容");
    }
  } catch (error) {
    console.error("OCR 识别失败:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("OCR 识别失败");
  }
}

