'use client';

import { ProgressIndicator } from '@/components/tutorials/progress-indicator';
import { TutorialRating } from '@/components/tutorials/feedback-system';

interface TutorialLayoutProps {
  tutorialId: string;
  currentChapter?: string;
  children: React.ReactNode;
  onChapterSelect?: (chapterId: string) => void;
  showRating?: boolean;
}

export function TutorialLayout({
  tutorialId,
  currentChapter,
  children,
  onChapterSelect,
  showRating = false
}: TutorialLayoutProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {children}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Progress Indicator */}
            <ProgressIndicator
              tutorialId={tutorialId}
              currentChapter={currentChapter}
              onChapterSelect={onChapterSelect}
            />

            {/* Tutorial Rating (shown when tutorial is completed) */}
            {showRating && (
              <TutorialRating
                tutorialId={tutorialId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
