/**
 * 百度 OCR 文字识别 API
 * POST /api/ocr
 */

import { NextRequest, NextResponse } from 'next/server';

const BAIDU_API_KEY = process.env.BAIDU_API_KEY;
const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY;

// 缓存 Access Token
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * 获取 Access Token（带缓存）
 */
async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry - 5 * 60 * 1000) {
    return cachedToken;
  }

  const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`获取 Token 失败: HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data.access_token) {
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in || 2592000) * 1000;
    return data.access_token;
  } else {
    throw new Error(data.error_description || '获取 Token 失败');
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!BAIDU_API_KEY || !BAIDU_SECRET_KEY) {
      return NextResponse.json(
        {
          error:
            '未配置百度 API 密钥，请在 .env.local 中配置 BAIDU_API_KEY 和 BAIDU_SECRET_KEY',
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: '缺少图片数据' }, { status: 400 });
    }

    const accessToken = await getAccessToken();

    const ocrUrl = `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`;

    const ocrResponse = await fetch(ocrUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `image=${encodeURIComponent(image)}&language_type=CHN_ENG`,
    });

    if (!ocrResponse.ok) {
      throw new Error(`OCR 请求失败: HTTP ${ocrResponse.status}`);
    }

    const ocrData = await ocrResponse.json();

    if (ocrData.error_code) {
      console.error('百度 OCR 错误:', ocrData);

      if (ocrData.error_code === 110 || ocrData.error_code === 111) {
        cachedToken = null;
        tokenExpiry = 0;
      }

      return NextResponse.json(
        {
          error_code: ocrData.error_code,
          error_msg: ocrData.error_msg || 'OCR 识别失败',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(ocrData);
  } catch (error) {
    console.error('OCR API 错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'OCR 识别失败' },
      { status: 500 }
    );
  }
}
