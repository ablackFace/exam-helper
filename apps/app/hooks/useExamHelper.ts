'use client';

/**
 * 考试助手核心业务逻辑 Hook
 */

import { useState, useEffect, useCallback } from 'react';
import type { Question, MatchResult } from '@exam-helper/questions';
import {
  compressImage,
  fileToDataURL,
  isImageFile,
  cropImage,
  type CropArea,
} from '../lib/imageUtils';
import { recognizeText } from '../lib/ocr';
import { findBestMatches } from '../lib/matcher';
import { cleanRecognizedText } from '../lib/textProcessor';

interface UseExamHelperReturn {
  isLoading: boolean;
  loadingText: string;
  recognizedText: string;
  matchResults: MatchResult[];
  error: string | null;
  isQuestionBankLoaded: boolean;
  // 裁剪相关
  pendingImageUrl: string | null;
  handleImageSelect: (file: File) => Promise<void>;
  handleCropConfirm: (cropArea: CropArea) => Promise<void>;
  handleCropCancel: () => void;
  clearResults: () => void;
  clearError: () => void;
}

export function useExamHelper(): UseExamHelperReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [recognizedText, setRecognizedText] = useState('');
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [questionBank, setQuestionBank] = useState<Question[]>([]);
  const [isQuestionBankLoaded, setIsQuestionBankLoaded] = useState(false);
  // 裁剪相关状态
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);

  // 加载题库
  useEffect(() => {
    async function loadQuestionBank() {
      try {
        const response = await fetch('/questions.json');
        if (!response.ok) {
          throw new Error('题库加载失败');
        }
        const data: Question[] = await response.json();
        setQuestionBank(data);
        setIsQuestionBankLoaded(true);
        console.log(`题库加载成功，共 ${data.length} 道题目`);
      } catch (err) {
        console.error('题库加载失败:', err);
        setError('题库加载失败，请刷新页面重试');
      }
    }

    loadQuestionBank();
  }, []);

  const clearResults = useCallback(() => {
    setRecognizedText('');
    setMatchResults([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 选择图片后，进入裁剪模式
  const handleImageSelect = useCallback(
    async (file: File) => {
      if (!isImageFile(file)) {
        setError('请选择图片文件');
        return;
      }

      if (!isQuestionBankLoaded || questionBank.length === 0) {
        setError('题库尚未加载完成，请稍后重试');
        return;
      }

      clearResults();
      clearError();

      try {
        const imageData = await fileToDataURL(file);
        // 进入裁剪模式
        setPendingImageUrl(imageData);
      } catch (err) {
        console.error('读取图片出错:', err);
        setError(err instanceof Error ? err.message : '读取图片失败，请重试');
      }
    },
    [isQuestionBankLoaded, questionBank.length, clearResults, clearError]
  );

  // 取消裁剪
  const handleCropCancel = useCallback(() => {
    setPendingImageUrl(null);
  }, []);

  // 确认裁剪后进行识别
  const handleCropConfirm = useCallback(
    async (cropArea: CropArea) => {
      if (!pendingImageUrl) return;

      setIsLoading(true);
      setPendingImageUrl(null);

      try {
        setLoadingText('正在裁剪图片...');
        const croppedImage = await cropImage(pendingImageUrl, cropArea);
        console.log('图片裁剪完成');

        setLoadingText('正在压缩图片...');
        const compressedImage = await compressImage(croppedImage, 1280, 0.7);
        console.log('图片压缩完成');

        setLoadingText('正在识别文字...');
        const ocrText = await recognizeText(compressedImage);
        console.log('OCR 识别完成:', ocrText);

        const cleanedText = cleanRecognizedText(ocrText);
        setRecognizedText(cleanedText);

        setLoadingText('正在匹配题库...');
        const results = findBestMatches(ocrText, questionBank);

        if (results.length > 0) {
          setMatchResults(results);
          console.log(`找到 ${results.length} 道匹配题目`);
        } else {
          setError('未找到匹配的题目，请确保题目清晰完整');
        }
      } catch (err) {
        console.error('识别流程出错:', err);
        setError(err instanceof Error ? err.message : '识别失败，请重试');
      } finally {
        setIsLoading(false);
        setLoadingText('');
      }
    },
    [pendingImageUrl, questionBank]
  );

  return {
    isLoading,
    loadingText,
    recognizedText,
    matchResults,
    error,
    isQuestionBankLoaded,
    pendingImageUrl,
    handleImageSelect,
    handleCropConfirm,
    handleCropCancel,
    clearResults,
    clearError,
  };
}
