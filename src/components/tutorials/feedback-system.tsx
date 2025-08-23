'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Send, Heart } from 'lucide-react';
import { useTutorialProgress } from '@/lib/contexts/tutorial-progress';
import { useToast } from '@/hooks/use-toast';

interface TutorialRatingProps {
  tutorialId: string;
  onComplete?: () => void;
}

export function TutorialRating({ tutorialId, onComplete }: TutorialRatingProps) {
  const { getTutorialProgress, rateTutorial } = useTutorialProgress();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const tutorial = getTutorialProgress(tutorialId);

  useEffect(() => {
    if (tutorial?.rating) {
      setRating(tutorial.rating);
      setFeedback(tutorial.feedback || '');
      setHasRated(true);
    }
  }, [tutorial]);

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      rateTutorial(tutorialId, rating, feedback);
      setHasRated(true);
      setIsSubmitting(false);

      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
      });

      onComplete?.();
    }, 1000);
  };

  const getRatingText = (stars: number) => {
    switch (stars) {
      case 1: return "Poor";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Very Good";
      case 5: return "Excellent";
      default: return "Select rating";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Rate This Tutorial
        </CardTitle>
        <CardDescription>
          Help us improve by sharing your experience with this tutorial
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Star Rating */}
        <div className="space-y-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className="p-1 transition-colors"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  disabled={hasRated}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm font-medium">
              {getRatingText(hoveredRating || rating)}
            </p>
          </div>
        </div>

        <Separator />

        {/* Feedback Text */}
        <div className="space-y-3">
          <label className="text-sm font-medium">
            Additional Feedback <span className="text-muted-foreground">(Optional)</span>
          </label>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share what you liked or what could be improved..."
            className="min-h-[100px]"
            disabled={hasRated}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          {hasRated ? (
            <div className="flex items-center gap-2 text-green-600">
              <Heart className="h-4 w-4" />
              <span className="text-sm">Thanks for your feedback!</span>
            </div>
          ) : (
            <Button
              onClick={handleSubmitRating}
              disabled={isSubmitting || rating === 0}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickFeedbackProps {
  tutorialId: string;
  chapterId?: string;
  onFeedback?: (helpful: boolean) => void;
}

export function QuickFeedback({ tutorialId, chapterId, onFeedback }: QuickFeedbackProps) {
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const { toast } = useToast();

  const handleFeedback = (helpful: boolean) => {
    setFeedback(helpful ? 'helpful' : 'not-helpful');
    onFeedback?.(helpful);

    if (!helpful) {
      setShowComment(true);
    } else {
      toast({
        title: "Thank you!",
        description: "Glad this tutorial was helpful.",
      });
    }
  };

  const handleSubmitComment = () => {
    // Simulate API call to save comment
    console.log('Feedback submitted:', { tutorialId, chapterId, helpful: feedback === 'helpful', comment });

    toast({
      title: "Feedback Submitted",
      description: "Thank you for helping us improve!",
    });

    setShowComment(false);
  };

  return (
    <Card className="border-dashed">
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm font-medium mb-3">Was this section helpful?</p>

            {feedback === null ? (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFeedback(true)}
                  className="gap-2"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Yes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFeedback(false)}
                  className="gap-2"
                >
                  <ThumbsDown className="h-4 w-4" />
                  No
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Badge variant={feedback === 'helpful' ? 'default' : 'secondary'}>
                  {feedback === 'helpful' ? (
                    <>
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      Helpful
                    </>
                  ) : (
                    <>
                      <ThumbsDown className="h-3 w-3 mr-1" />
                      Not Helpful
                    </>
                  )}
                </Badge>
              </div>
            )}
          </div>

          {showComment && (
            <div className="space-y-3">
              <Separator />
              <div>
                <label className="text-sm font-medium">
                  How can we improve this section?
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what was confusing or missing..."
                  className="mt-2"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComment(false)}
                >
                  Skip
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!comment.trim()}
                  className="gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Submit
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface FeedbackStatsProps {
  tutorialId: string;
}

export function FeedbackStats({ tutorialId }: FeedbackStatsProps) {
  // Mock data - in real app, this would come from API
  const stats = {
    totalRatings: 1247,
    averageRating: 4.6,
    distribution: {
      5: 687,
      4: 398,
      3: 123,
      2: 28,
      1: 11,
    },
    helpfulPercentage: 94,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Community Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Average Rating */}
        <div className="flex items-center gap-3">
          <div className="text-3xl font-bold">{stats.averageRating}</div>
          <div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(stats.averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {stats.totalRatings} ratings
            </p>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => (
            <div key={stars} className="flex items-center gap-2">
              <span className="text-sm w-3">{stars}</span>
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{
                    width: `${(stats.distribution[stars as keyof typeof stats.distribution] / stats.totalRatings) * 100}%`
                  }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-8">
                {stats.distribution[stars as keyof typeof stats.distribution]}
              </span>
            </div>
          ))}
        </div>

        {/* Helpful Percentage */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm">Found helpful</span>
            <Badge variant="secondary">
              {stats.helpfulPercentage}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
