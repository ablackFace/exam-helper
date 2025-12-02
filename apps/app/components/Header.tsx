"use client";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({
  title = "12123学法减分考试神器",
  subtitle = "拍照识别题目，快速获取答案",
}: HeaderProps) {
  return (
    <header className="text-center py-6 px-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-lg">
        {title}
      </h1>
      <p className="text-white/80 text-sm sm:text-base">{subtitle}</p>
    </header>
  );
}

