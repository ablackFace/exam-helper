'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  CheckIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/solid';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  imageUrl: string;
  onConfirm: (croppedArea: CropArea) => void;
  onCancel: () => void;
}

type DragHandle = 'move' | 'tl' | 'tr' | 'bl' | 'br' | null;

export function ImageCropper({
  imageUrl,
  onConfirm,
  onCancel,
}: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [activeHandle, setActiveHandle] = useState<DragHandle>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState<CropArea | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // 最小裁剪尺寸
  const MIN_SIZE = 50;

  // 图片加载完成后计算显示尺寸
  const handleImageLoad = useCallback(() => {
    const img = imageRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    setImageSize({ width: naturalWidth, height: naturalHeight });

    // 计算适应容器的显示尺寸
    const containerRect = container.getBoundingClientRect();
    const maxWidth = containerRect.width - 32;
    const maxHeight = containerRect.height - 140;

    let displayWidth = naturalWidth;
    let displayHeight = naturalHeight;

    if (displayWidth > maxWidth) {
      displayHeight = (maxWidth / displayWidth) * displayHeight;
      displayWidth = maxWidth;
    }
    if (displayHeight > maxHeight) {
      displayWidth = (maxHeight / displayHeight) * displayWidth;
      displayHeight = maxHeight;
    }

    setDisplaySize({ width: displayWidth, height: displayHeight });

    // 默认选择中间 80% 区域
    const defaultCrop: CropArea = {
      x: displayWidth * 0.1,
      y: displayHeight * 0.1,
      width: displayWidth * 0.8,
      height: displayHeight * 0.8,
    };
    setCropArea(defaultCrop);
    setIsImageLoaded(true);
  }, []);

  // 获取触摸/鼠标坐标
  const getEventPosition = useCallback(
    (e: TouchEvent | MouseEvent | React.TouchEvent | React.MouseEvent) => {
      const img = imageRef.current;
      if (!img) return { x: 0, y: 0 };

      const rect = img.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        return { x: 0, y: 0 };
      }

      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    []
  );

  // 限制裁剪区域在图片范围内
  const constrainCropArea = useCallback(
    (crop: CropArea): CropArea => {
      let { x, y, width, height } = crop;

      // 限制最小尺寸
      width = Math.max(MIN_SIZE, width);
      height = Math.max(MIN_SIZE, height);

      // 限制最大尺寸
      width = Math.min(width, displaySize.width);
      height = Math.min(height, displaySize.height);

      // 限制位置
      x = Math.max(0, Math.min(x, displaySize.width - width));
      y = Math.max(0, Math.min(y, displaySize.height - height));

      return { x, y, width, height };
    },
    [displaySize]
  );

  // 开始拖拽
  const handleDragStart = useCallback(
    (handle: DragHandle) => (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const pos = getEventPosition(e);
      setDragStart(pos);
      setActiveHandle(handle);
      setInitialCrop({ ...cropArea });
    },
    [getEventPosition, cropArea]
  );

  // 拖拽移动
  const handleDragMove = useCallback(
    (e: TouchEvent | MouseEvent) => {
      if (!activeHandle || !initialCrop) return;
      e.preventDefault();

      const pos = getEventPosition(e);
      const deltaX = pos.x - dragStart.x;
      const deltaY = pos.y - dragStart.y;

      let newCrop: CropArea;

      if (activeHandle === 'move') {
        // 移动整个选区
        newCrop = {
          ...initialCrop,
          x: initialCrop.x + deltaX,
          y: initialCrop.y + deltaY,
        };
      } else {
        // 调整四个角
        newCrop = { ...initialCrop };

        switch (activeHandle) {
          case 'tl': // 左上角
            newCrop.x = initialCrop.x + deltaX;
            newCrop.y = initialCrop.y + deltaY;
            newCrop.width = initialCrop.width - deltaX;
            newCrop.height = initialCrop.height - deltaY;
            break;
          case 'tr': // 右上角
            newCrop.y = initialCrop.y + deltaY;
            newCrop.width = initialCrop.width + deltaX;
            newCrop.height = initialCrop.height - deltaY;
            break;
          case 'bl': // 左下角
            newCrop.x = initialCrop.x + deltaX;
            newCrop.width = initialCrop.width - deltaX;
            newCrop.height = initialCrop.height + deltaY;
            break;
          case 'br': // 右下角
            newCrop.width = initialCrop.width + deltaX;
            newCrop.height = initialCrop.height + deltaY;
            break;
        }
      }

      setCropArea(constrainCropArea(newCrop));
    },
    [activeHandle, initialCrop, dragStart, getEventPosition, constrainCropArea]
  );

  // 结束拖拽
  const handleDragEnd = useCallback(() => {
    setActiveHandle(null);
    setInitialCrop(null);
  }, []);

  // 确认裁剪
  const handleConfirm = useCallback(() => {
    // 将显示坐标转换为原图坐标
    const scaleX = imageSize.width / displaySize.width;
    const scaleY = imageSize.height / displaySize.height;

    onConfirm({
      x: Math.round(cropArea.x * scaleX),
      y: Math.round(cropArea.y * scaleY),
      width: Math.round(cropArea.width * scaleX),
      height: Math.round(cropArea.height * scaleY),
    });
  }, [cropArea, imageSize, displaySize, onConfirm]);

  // 全屏选择
  const handleSelectAll = useCallback(() => {
    setCropArea({
      x: 0,
      y: 0,
      width: displaySize.width,
      height: displaySize.height,
    });
  }, [displaySize]);

  // 监听全局触摸/鼠标事件
  useEffect(() => {
    if (!activeHandle) return;

    const onMove = (e: TouchEvent | MouseEvent) => handleDragMove(e);
    const onEnd = () => handleDragEnd();

    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchend', onEnd);
    window.addEventListener('mouseup', onEnd);

    return () => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('mouseup', onEnd);
    };
  }, [activeHandle, handleDragMove, handleDragEnd]);

  // 角落拖拽手柄样式
  const handleStyle =
    'absolute w-10 h-10 flex items-center justify-center touch-none';
  const handleDotStyle =
    'w-5 h-5 bg-white rounded-full shadow-lg border-2 border-primary';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
    >
      {/* 提示文字 */}
      <div className="absolute top-4 left-0 right-0 text-center text-white/90 text-sm px-4 safe-area-top z-10">
        拖动角落调整选区，拖动中心移动位置
      </div>

      {/* 图片容器 */}
      <div className="relative flex-1 flex items-center justify-center w-full px-4 py-16">
        <div
          className="relative"
          style={{ width: displaySize.width, height: displaySize.height }}
        >
          {/* 图片 */}
          <img
            ref={imageRef}
            src={imageUrl}
            alt="待裁剪图片"
            className="block select-none pointer-events-none"
            style={{ width: displaySize.width, height: displaySize.height }}
            onLoad={handleImageLoad}
            draggable={false}
          />

          {isImageLoaded && (
            <>
              {/* 暗色遮罩 - 使用 clip-path 实现镂空效果 */}
              <div
                className="absolute inset-0 bg-black/60 pointer-events-none"
                style={{
                  clipPath: `polygon(
                    0% 0%, 
                    0% 100%, 
                    ${cropArea.x}px 100%, 
                    ${cropArea.x}px ${cropArea.y}px, 
                    ${cropArea.x + cropArea.width}px ${cropArea.y}px, 
                    ${cropArea.x + cropArea.width}px ${
                    cropArea.y + cropArea.height
                  }px, 
                    ${cropArea.x}px ${cropArea.y + cropArea.height}px, 
                    ${cropArea.x}px 100%, 
                    100% 100%, 
                    100% 0%
                  )`,
                }}
              />

              {/* 裁剪框边框 */}
              <div
                className="absolute border-2 border-white pointer-events-none"
                style={{
                  left: cropArea.x,
                  top: cropArea.y,
                  width: cropArea.width,
                  height: cropArea.height,
                }}
              >
                {/* 网格线 */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="border border-white/30" />
                  ))}
                </div>
              </div>

              {/* 中心移动区域 */}
              <div
                className="absolute cursor-move touch-none"
                style={{
                  left: cropArea.x + 20,
                  top: cropArea.y + 20,
                  width: cropArea.width - 40,
                  height: cropArea.height - 40,
                }}
                onTouchStart={handleDragStart('move')}
                onMouseDown={handleDragStart('move')}
              />

              {/* 左上角 */}
              <div
                className={handleStyle}
                style={{
                  left: cropArea.x - 20,
                  top: cropArea.y - 20,
                }}
                onTouchStart={handleDragStart('tl')}
                onMouseDown={handleDragStart('tl')}
              >
                <div className={handleDotStyle} />
              </div>

              {/* 右上角 */}
              <div
                className={handleStyle}
                style={{
                  left: cropArea.x + cropArea.width - 20,
                  top: cropArea.y - 20,
                }}
                onTouchStart={handleDragStart('tr')}
                onMouseDown={handleDragStart('tr')}
              >
                <div className={handleDotStyle} />
              </div>

              {/* 左下角 */}
              <div
                className={handleStyle}
                style={{
                  left: cropArea.x - 20,
                  top: cropArea.y + cropArea.height - 20,
                }}
                onTouchStart={handleDragStart('bl')}
                onMouseDown={handleDragStart('bl')}
              >
                <div className={handleDotStyle} />
              </div>

              {/* 右下角 */}
              <div
                className={handleStyle}
                style={{
                  left: cropArea.x + cropArea.width - 20,
                  top: cropArea.y + cropArea.height - 20,
                }}
                onTouchStart={handleDragStart('br')}
                onMouseDown={handleDragStart('br')}
              >
                <div className={handleDotStyle} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="flex items-center justify-center gap-8 pb-8 safe-area-bottom">
        <button
          onClick={onCancel}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20 text-white active:bg-white/30 transition-colors"
        >
          <XMarkIcon className="w-7 h-7" />
        </button>

        <button
          onClick={handleSelectAll}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 text-white active:bg-white/30 transition-colors"
        >
          <ArrowsPointingOutIcon className="w-6 h-6" />
        </button>

        <button
          onClick={handleConfirm}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-green-500 text-white active:bg-green-600 transition-colors"
        >
          <CheckIcon className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}
