'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface TutorialChapter {
  id: string;
  title: string;
  completed: boolean;
  timeSpent?: number; // in seconds
  lastAccessed?: Date;
}

export interface TutorialProgress {
  id: string;
  title: string;
  totalChapters: number;
  completedChapters: number;
  chapters: TutorialChapter[];
  overallProgress: number; // percentage
  totalTimeSpent: number; // in seconds
  lastAccessed: Date;
  completed: boolean;
  rating?: number;
  feedback?: string;
}

interface TutorialProgressContextType {
  tutorials: Record<string, TutorialProgress>;
  updateChapterProgress: (tutorialId: string, chapterId: string, completed: boolean) => void;
  addTimeSpent: (tutorialId: string, chapterId: string, timeSeconds: number) => void;
  rateTutorial: (tutorialId: string, rating: number, feedback?: string) => void;
  getTutorialProgress: (tutorialId: string) => TutorialProgress | null;
  getOverallProgress: () => { completed: number; total: number; percentage: number };
  initializeTutorial: (tutorialId: string, title: string, chapters: Omit<TutorialChapter, 'completed' | 'timeSpent' | 'lastAccessed'>[]) => void;
  resetProgress: (tutorialId?: string) => void;
}

const TutorialProgressContext = createContext<TutorialProgressContextType | undefined>(undefined);

const STORAGE_KEY = 'scrapecloud_tutorial_progress';

// Default tutorial structure
const defaultTutorials: Record<string, Omit<TutorialProgress, 'lastAccessed'>> = {
  'getting-started': {
    id: 'getting-started',
    title: 'Getting Started with Web Scraping',
    totalChapters: 5,
    completedChapters: 0,
    chapters: [
      { id: 'understanding', title: 'Understanding Web Scraping', completed: false },
      { id: 'creating-scraper', title: 'Creating Your First Scraper', completed: false },
      { id: 'css-selectors', title: 'Understanding CSS Selectors', completed: false },
      { id: 'running-scrape', title: 'Running Your First Scrape', completed: false },
      { id: 'exporting-data', title: 'Viewing and Exporting Data', completed: false },
    ],
    overallProgress: 0,
    totalTimeSpent: 0,
    completed: false,
  },
  'css-selectors': {
    id: 'css-selectors',
    title: 'Advanced CSS Selector Techniques',
    totalChapters: 5,
    completedChapters: 0,
    chapters: [
      { id: 'advanced-patterns', title: 'Advanced Selector Patterns', completed: false },
      { id: 'combinators', title: 'Combinator Selectors', completed: false },
      { id: 'real-world', title: 'Real-World Examples', completed: false },
      { id: 'xpath', title: 'Introduction to XPath', completed: false },
      { id: 'testing', title: 'Testing and Debugging Selectors', completed: false },
    ],
    overallProgress: 0,
    totalTimeSpent: 0,
    completed: false,
  },
  'dynamic-content': {
    id: 'dynamic-content',
    title: 'Handling Dynamic Content & JavaScript',
    totalChapters: 4,
    completedChapters: 0,
    chapters: [
      { id: 'detection', title: 'Detecting Dynamic Content', completed: false },
      { id: 'solutions', title: 'ScrapeCloud\'s Dynamic Content Solutions', completed: false },
      { id: 'scenarios', title: 'Common Dynamic Content Scenarios', completed: false },
      { id: 'troubleshooting', title: 'Troubleshooting Dynamic Content', completed: false },
    ],
    overallProgress: 0,
    totalTimeSpent: 0,
    completed: false,
  },
  'api-integration': {
    id: 'api-integration',
    title: 'API Integration & Webhooks',
    totalChapters: 5,
    completedChapters: 0,
    chapters: [
      { id: 'authentication', title: 'API Authentication', completed: false },
      { id: 'endpoints', title: 'Core API Endpoints', completed: false },
      { id: 'webhooks', title: 'Webhook Integration', completed: false },
      { id: 'examples', title: 'Language-Specific Examples', completed: false },
      { id: 'patterns', title: 'Common Integration Patterns', completed: false },
    ],
    overallProgress: 0,
    totalTimeSpent: 0,
    completed: false,
  },
  'scheduling': {
    id: 'scheduling',
    title: 'Setting Up Automated Schedules',
    totalChapters: 5,
    completedChapters: 0,
    chapters: [
      { id: 'schedule-types', title: 'Types of Schedules', completed: false },
      { id: 'setup', title: 'Setting Up Your First Schedule', completed: false },
      { id: 'cron-guide', title: 'Cron Expression Guide', completed: false },
      { id: 'scenarios', title: 'Real-World Scheduling Scenarios', completed: false },
      { id: 'monitoring', title: 'Monitoring and Alerts', completed: false },
    ],
    overallProgress: 0,
    totalTimeSpent: 0,
    completed: false,
  },
  'large-scale': {
    id: 'large-scale',
    title: 'Handling Large Scale Scraping',
    totalChapters: 5,
    completedChapters: 0,
    chapters: [
      { id: 'architecture', title: 'Architecture & Planning', completed: false },
      { id: 'optimization', title: 'Performance Optimization', completed: false },
      { id: 'anti-bot', title: 'Handling Anti-Bot Measures', completed: false },
      { id: 'data-quality', title: 'Data Quality & Consistency', completed: false },
      { id: 'cost', title: 'Cost Optimization Strategies', completed: false },
    ],
    overallProgress: 0,
    totalTimeSpent: 0,
    completed: false,
  },
};

export function TutorialProgressProvider({ children }: { children: ReactNode }) {
  const [tutorials, setTutorials] = useState<Record<string, TutorialProgress>>({});

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedData = JSON.parse(saved);
        // Convert date strings back to Date objects
        const processedData: Record<string, TutorialProgress> = {};
        Object.keys(parsedData).forEach(key => {
          processedData[key] = {
            ...parsedData[key],
            lastAccessed: new Date(parsedData[key].lastAccessed),
            chapters: parsedData[key].chapters.map((chapter: any) => ({
              ...chapter,
              lastAccessed: chapter.lastAccessed ? new Date(chapter.lastAccessed) : undefined
            }))
          };
        });
        setTutorials(processedData);
      } else {
        // Initialize with default tutorials
        const initialTutorials: Record<string, TutorialProgress> = {};
        Object.keys(defaultTutorials).forEach(key => {
          initialTutorials[key] = {
            ...defaultTutorials[key],
            lastAccessed: new Date(),
          };
        });
        setTutorials(initialTutorials);
      }
    } catch (error) {
      console.error('Error loading tutorial progress:', error);
      // Fallback to default tutorials
      const initialTutorials: Record<string, TutorialProgress> = {};
      Object.keys(defaultTutorials).forEach(key => {
        initialTutorials[key] = {
          ...defaultTutorials[key],
          lastAccessed: new Date(),
        };
      });
      setTutorials(initialTutorials);
    }
  }, []);

  // Save to localStorage whenever tutorials change
  useEffect(() => {
    if (Object.keys(tutorials).length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tutorials));
      } catch (error) {
        console.error('Error saving tutorial progress:', error);
      }
    }
  }, [tutorials]);

  const updateChapterProgress = (tutorialId: string, chapterId: string, completed: boolean) => {
    setTutorials(prev => {
      const tutorial = prev[tutorialId];
      if (!tutorial) return prev;

      const updatedChapters = tutorial.chapters.map(chapter =>
        chapter.id === chapterId
          ? { ...chapter, completed, lastAccessed: new Date() }
          : chapter
      );

      const completedCount = updatedChapters.filter(c => c.completed).length;
      const overallProgress = Math.round((completedCount / tutorial.totalChapters) * 100);
      const isCompleted = completedCount === tutorial.totalChapters;

      return {
        ...prev,
        [tutorialId]: {
          ...tutorial,
          chapters: updatedChapters,
          completedChapters: completedCount,
          overallProgress,
          completed: isCompleted,
          lastAccessed: new Date(),
        }
      };
    });
  };

  const addTimeSpent = (tutorialId: string, chapterId: string, timeSeconds: number) => {
    setTutorials(prev => {
      const tutorial = prev[tutorialId];
      if (!tutorial) return prev;

      const updatedChapters = tutorial.chapters.map(chapter =>
        chapter.id === chapterId
          ? {
              ...chapter,
              timeSpent: (chapter.timeSpent || 0) + timeSeconds,
              lastAccessed: new Date()
            }
          : chapter
      );

      const totalTimeSpent = updatedChapters.reduce((sum, chapter) => sum + (chapter.timeSpent || 0), 0);

      return {
        ...prev,
        [tutorialId]: {
          ...tutorial,
          chapters: updatedChapters,
          totalTimeSpent,
          lastAccessed: new Date(),
        }
      };
    });
  };

  const rateTutorial = (tutorialId: string, rating: number, feedback?: string) => {
    setTutorials(prev => {
      const tutorial = prev[tutorialId];
      if (!tutorial) return prev;

      return {
        ...prev,
        [tutorialId]: {
          ...tutorial,
          rating,
          feedback,
          lastAccessed: new Date(),
        }
      };
    });
  };

  const getTutorialProgress = (tutorialId: string): TutorialProgress | null => {
    return tutorials[tutorialId] || null;
  };

  const getOverallProgress = () => {
    const tutorialIds = Object.keys(tutorials);
    const totalTutorials = tutorialIds.length;
    const completedTutorials = tutorialIds.filter(id => tutorials[id].completed).length;
    const percentage = totalTutorials > 0 ? Math.round((completedTutorials / totalTutorials) * 100) : 0;

    return {
      completed: completedTutorials,
      total: totalTutorials,
      percentage
    };
  };

  const initializeTutorial = (
    tutorialId: string,
    title: string,
    chapters: Omit<TutorialChapter, 'completed' | 'timeSpent' | 'lastAccessed'>[]
  ) => {
    setTutorials(prev => {
      if (prev[tutorialId]) return prev; // Don't overwrite existing

      const newTutorial: TutorialProgress = {
        id: tutorialId,
        title,
        totalChapters: chapters.length,
        completedChapters: 0,
        chapters: chapters.map(chapter => ({
          ...chapter,
          completed: false,
          timeSpent: 0,
        })),
        overallProgress: 0,
        totalTimeSpent: 0,
        lastAccessed: new Date(),
        completed: false,
      };

      return {
        ...prev,
        [tutorialId]: newTutorial
      };
    });
  };

  const resetProgress = (tutorialId?: string) => {
    if (tutorialId) {
      // Reset specific tutorial
      setTutorials(prev => {
        const defaultTutorial = defaultTutorials[tutorialId];
        if (!defaultTutorial) return prev;

        return {
          ...prev,
          [tutorialId]: {
            ...defaultTutorial,
            lastAccessed: new Date(),
          }
        };
      });
    } else {
      // Reset all tutorials
      const resetTutorials: Record<string, TutorialProgress> = {};
      Object.keys(defaultTutorials).forEach(key => {
        resetTutorials[key] = {
          ...defaultTutorials[key],
          lastAccessed: new Date(),
        };
      });
      setTutorials(resetTutorials);
    }
  };

  const value: TutorialProgressContextType = {
    tutorials,
    updateChapterProgress,
    addTimeSpent,
    rateTutorial,
    getTutorialProgress,
    getOverallProgress,
    initializeTutorial,
    resetProgress,
  };

  return (
    <TutorialProgressContext.Provider value={value}>
      {children}
    </TutorialProgressContext.Provider>
  );
}

export function useTutorialProgress() {
  const context = useContext(TutorialProgressContext);
  if (context === undefined) {
    throw new Error('useTutorialProgress must be used within a TutorialProgressProvider');
  }
  return context;
}
