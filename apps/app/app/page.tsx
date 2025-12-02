"use client";

import { useExamHelper } from "../hooks/useExamHelper";
import {
  Header,
  CaptureButton,
  LoadingOverlay,
  RecognizedText,
  MatchResultList,
  ErrorAlert,
  EmptyState,
  ImageCropper,
} from "../components";

export default function HomePage() {
  const {
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
    clearError,
  } = useExamHelper();

  const hasResults = recognizedText || matchResults.length > 0;

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col">
      <Header />

      <main className="flex-1 px-4 pb-24 overflow-y-auto">
        <div className="max-w-lg mx-auto space-y-4">
          {!hasResults && !isLoading && (
            <EmptyState isQuestionBankLoaded={isQuestionBankLoaded} />
          )}

          {recognizedText && <RecognizedText text={recognizedText} />}

          {matchResults.length > 0 && (
            <MatchResultList results={matchResults} />
          )}
        </div>
      </main>

      <CaptureButton
        onCapture={handleImageSelect}
        disabled={isLoading || !isQuestionBankLoaded}
      />

      <LoadingOverlay isVisible={isLoading} text={loadingText} />

      <ErrorAlert message={error} onClose={clearError} />

      {/* 图片裁剪界面 */}
      {pendingImageUrl && (
        <ImageCropper
          imageUrl={pendingImageUrl}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
