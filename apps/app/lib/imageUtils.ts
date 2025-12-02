/**
 * 图片处理工具
 * 用于压缩上传的图片，优化移动端传输
 */

/**
 * 压缩图片
 */
export function compressImage(
  imageData: string,
  maxWidth: number = 1280,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("无法创建 Canvas 上下文"));
          return;
        }

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed.split(",")[1]);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("图片加载失败"));
    };

    img.src = imageData;
  });
}

/**
 * 将 File 对象转换为 Data URL
 */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("文件读取失败"));
      }
    };

    reader.onerror = () => {
      reject(new Error("文件读取失败"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 验证文件是否为图片
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

