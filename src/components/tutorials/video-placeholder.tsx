'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, BookOpen, Volume2, Settings, Maximize } from 'lucide-react';

interface VideoPlaceholderProps {
  title: string;
  duration?: string;
  description?: string;
  thumbnail?: string;
  topics?: string[];
  comingSoon?: boolean;
}

export function VideoPlaceholder({
  title,
  duration = "5:30",
  description,
  thumbnail,
  topics = [],
  comingSoon = true
}: VideoPlaceholderProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className="relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-white">
            <Play className="h-16 w-16 mx-auto mb-4" />
            <p className="text-lg font-medium">{title}</p>
          </div>
        )}

        {/* Overlay */}
        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <Button size="lg" className="rounded-full w-16 h-16 p-0">
            <Play className="h-8 w-8 ml-1" />
          </Button>
        </div>

        {/* Duration Badge */}
        <Badge className="absolute bottom-3 right-3 bg-black/70 text-white border-0">
          <Clock className="h-3 w-3 mr-1" />
          {duration}
        </Badge>

        {/* Coming Soon Badge */}
        {comingSoon && (
          <Badge className="absolute top-3 left-3 bg-orange-500 text-white border-0">
            Coming Soon
          </Badge>
        )}
      </div>

      {/* Video Info */}
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg leading-tight">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>

          {topics.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {topics.map((topic, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          )}

          {comingSoon ? (
            <Button variant="outline" className="w-full" disabled>
              <BookOpen className="h-4 w-4 mr-2" />
              Read Tutorial Instead
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Watch Now
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface VideoSectionProps {
  title: string;
  videos?: VideoPlaceholderProps[];
}

export function VideoSection({ title, videos = [] }: VideoSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">{title}</h2>
        <p className="text-muted-foreground">
          Visual walkthroughs to complement your learning
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video, index) => (
          <VideoPlaceholder key={index} {...video} />
        ))}
      </div>
    </div>
  );
}

interface InteractiveVideoPlayerProps {
  title: string;
  src?: string;
  chapters?: Array<{
    title: string;
    time: string;
    completed?: boolean;
  }>;
}

export function InteractiveVideoPlayer({ title, src, chapters = [] }: InteractiveVideoPlayerProps) {
  const [currentTime, setCurrentTime] = useState("0:00");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Player Placeholder */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {src ? (
            <video
              className="w-full h-full"
              controls
              poster="/api/placeholder/800/450"
            >
              <source src={src} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              <div className="text-center">
                <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Video content coming soon</p>
                <p className="text-sm opacity-75">This video tutorial is being prepared</p>
              </div>
            </div>
          )}
        </div>

        {/* Video Controls */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Play className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <span className="text-sm font-mono">{currentTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Volume2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chapter Navigation */}
        {chapters.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Chapters</h4>
            <div className="space-y-1">
              {chapters.map((chapter, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                    currentChapter === index ? 'bg-primary/10' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setCurrentChapter(index)}
                >
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="flex-1 text-sm">{chapter.title}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {chapter.time}
                  </span>
                  {chapter.completed && (
                    <Badge variant="default" className="text-xs">
                      ✓
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Description */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">About this video</h4>
          <p className="text-sm text-muted-foreground">
            This interactive video tutorial will guide you through the concepts step by step.
            Click on chapters to jump to specific topics, and track your progress as you learn.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Sample video data for different tutorials
export const sampleVideos = {
  'getting-started': [
    {
      title: "Setting Up Your First Scraper",
      duration: "8:45",
      description: "Complete walkthrough of creating your first web scraper",
      topics: ["Setup", "Configuration", "Testing"],
    },
    {
      title: "Understanding CSS Selectors",
      duration: "6:20",
      description: "Visual guide to selecting elements on web pages",
      topics: ["CSS", "Selectors", "DOM"],
    },
    {
      title: "Running and Monitoring Scrapers",
      duration: "5:30",
      description: "Learn how to execute and track your scraping jobs",
      topics: ["Execution", "Monitoring", "Results"],
    }
  ],
  'css-selectors': [
    {
      title: "Advanced Selector Techniques",
      duration: "12:15",
      description: "Master complex CSS selectors for any website",
      topics: ["Advanced CSS", "XPath", "Pseudo-selectors"],
    },
    {
      title: "Real-World Selector Examples",
      duration: "9:40",
      description: "Practice with actual e-commerce and social media sites",
      topics: ["E-commerce", "Social Media", "Practice"],
    }
  ],
  'dynamic-content': [
    {
      title: "Handling JavaScript-Heavy Sites",
      duration: "15:30",
      description: "Techniques for scraping modern SPAs and dynamic content",
      topics: ["JavaScript", "SPA", "Async Content"],
    },
    {
      title: "Wait Strategies and Troubleshooting",
      duration: "11:20",
      description: "Master timing and solve common dynamic content issues",
      topics: ["Wait Conditions", "Troubleshooting", "Performance"],
    }
  ]
};
