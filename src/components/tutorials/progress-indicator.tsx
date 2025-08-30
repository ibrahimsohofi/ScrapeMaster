'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Clock, Trophy, RotateCcw } from 'lucide-react';
import { useTutorialProgress, type TutorialChapter } from '@/lib/contexts/tutorial-progress';

interface ProgressIndicatorProps {
  tutorialId: string;
  currentChapter?: string;
  onChapterSelect?: (chapterId: string) => void;
}

export function ProgressIndicator({ tutorialId, currentChapter, onChapterSelect }: ProgressIndicatorProps) {
  const { getTutorialProgress, updateChapterProgress } = useTutorialProgress();
  const tutorial = getTutorialProgress(tutorialId);

  if (!tutorial) return null;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  return (
    <Card className="sticky top-4">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Tutorial Progress</h4>
              <Badge variant={tutorial.completed ? "default" : "secondary"}>
                {tutorial.completedChapters}/{tutorial.totalChapters}
              </Badge>
            </div>
            <Progress value={tutorial.overallProgress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {tutorial.overallProgress}% complete
            </p>
          </div>

          {/* Chapter List */}
          <div className="space-y-2">
            <h5 className="font-medium text-sm">Chapters</h5>
            <div className="space-y-1">
              {tutorial.chapters.map((chapter, index) => (
                <div
                  key={chapter.id}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer hover:bg-muted/50 ${
                    currentChapter === chapter.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => onChapterSelect?.(chapter.id)}
                >
                  <div className="flex-shrink-0">
                    {chapter.completed ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{chapter.title}</p>
                    {chapter.timeSpent && (
                      <p className="text-xs text-muted-foreground">
                        {formatTime(chapter.timeSpent)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Total time: {formatTime(tutorial.totalTimeSpent)}</span>
            </div>
            {tutorial.completed && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Trophy className="h-4 w-4" />
                <span>Tutorial completed!</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ChapterTrackerProps {
  tutorialId: string;
  chapterId: string;
  title: string;
  children: React.ReactNode;
}

export function ChapterTracker({ tutorialId, chapterId, title, children }: ChapterTrackerProps) {
  const { updateChapterProgress, addTimeSpent, getTutorialProgress } = useTutorialProgress();
  const [startTime] = useState(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const tutorial = getTutorialProgress(tutorialId);
    const chapter = tutorial?.chapters.find(c => c.id === chapterId);
    setIsCompleted(chapter?.completed || false);

    // Track time on unmount
    return () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      if (timeSpent > 5) { // Only track if spent more than 5 seconds
        addTimeSpent(tutorialId, chapterId, timeSpent);
      }
    };
  }, [tutorialId, chapterId, startTime, addTimeSpent]);

  const handleMarkComplete = () => {
    updateChapterProgress(tutorialId, chapterId, !isCompleted);
    setIsCompleted(!isCompleted);
  };

  return (
    <div className="space-y-6">
      {/* Chapter Header */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          {isCompleted ? (
            <CheckCircle className="h-6 w-6 text-green-500" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground" />
          )}
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {isCompleted ? 'Completed' : 'In Progress'}
            </p>
          </div>
        </div>
        <Button
          variant={isCompleted ? "outline" : "default"}
          size="sm"
          onClick={handleMarkComplete}
          className="gap-2"
        >
          {isCompleted ? (
            <>
              <RotateCcw className="h-4 w-4" />
              Mark Incomplete
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Mark Complete
            </>
          )}
        </Button>
      </div>

      {/* Chapter Content */}
      {children}
    </div>
  );
}

interface TutorialNavigationProps {
  tutorialId: string;
  currentChapter: string;
  onNavigate?: (chapterId: string) => void;
}

export function TutorialNavigation({ tutorialId, currentChapter, onNavigate }: TutorialNavigationProps) {
  const { getTutorialProgress } = useTutorialProgress();
  const tutorial = getTutorialProgress(tutorialId);

  if (!tutorial) return null;

  const currentIndex = tutorial.chapters.findIndex(c => c.id === currentChapter);
  const prevChapter = currentIndex > 0 ? tutorial.chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < tutorial.chapters.length - 1 ? tutorial.chapters[currentIndex + 1] : null;

  return (
    <div className="flex items-center justify-between p-4 border-t">
      <div>
        {prevChapter && (
          <Button
            variant="outline"
            onClick={() => {
              if (onNavigate) {
                onNavigate(prevChapter.id);
              } else {
                const element = document.getElementById(prevChapter.id);
                element?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="gap-2"
          >
            ← {prevChapter.title}
          </Button>
        )}
      </div>
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Chapter {currentIndex + 1} of {tutorial.chapters.length}
        </p>
      </div>
      <div>
        {nextChapter && (
          <Button
            variant="outline"
            onClick={() => {
              if (onNavigate) {
                onNavigate(nextChapter.id);
              } else {
                const element = document.getElementById(nextChapter.id);
                element?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="gap-2"
          >
            {nextChapter.title} →
          </Button>
        )}
      </div>
    </div>
  );
}
