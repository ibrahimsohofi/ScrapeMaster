"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const spinnerVariants = cva(
  "animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]",
  {
    variants: {
      size: {
        sm: "h-4 w-4 border",
        default: "h-6 w-6 border-2",
        lg: "h-8 w-8 border-2",
        xl: "h-12 w-12 border-4",
      },
      variant: {
        default: "text-primary",
        secondary: "text-secondary-foreground",
        muted: "text-muted-foreground",
        white: "text-white",
        destructive: "text-destructive",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
  overlay?: boolean;
  fullScreen?: boolean;
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size, variant, label, overlay, fullScreen, ...props }, ref) => {
    const spinner = (
      <div
        ref={ref}
        className={cn(spinnerVariants({ size, variant }), className)}
        role="status"
        aria-label={label || "Loading"}
        {...props}
      >
        <span className="sr-only">{label || "Loading..."}</span>
      </div>
    );

    if (fullScreen) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-2">
            {spinner}
            {label && (
              <p className="text-sm text-muted-foreground animate-pulse">
                {label}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (overlay) {
      return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center space-y-2">
            {spinner}
            {label && (
              <p className="text-sm text-muted-foreground">
                {label}
              </p>
            )}
          </div>
        </div>
      );
    }

    return label ? (
      <div className="flex items-center space-x-2">
        {spinner}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    ) : (
      spinner
    );
  }
);

LoadingSpinner.displayName = "LoadingSpinner";

// Skeleton component for content loading
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  avatar?: boolean;
  card?: boolean;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, lines = 1, avatar, card, ...props }, ref) => {
    if (card) {
      return (
        <div
          ref={ref}
          className={cn("space-y-3 p-4 border rounded-lg", className)}
          {...props}
        >
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-3 bg-muted rounded animate-pulse"
                style={{ width: `${100 - i * 10}%` }}
              />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {avatar && (
          <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
        )}
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-muted rounded animate-pulse"
            style={{ width: `${100 - (i % 3) * 15}%` }}
          />
        ))}
      </div>
    );
  }
);

Skeleton.displayName = "Skeleton";

// Progress indicator for operations
export interface ProgressIndicatorProps {
  progress: number;
  status: string;
  showPercentage?: boolean;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  status,
  showPercentage = true,
  className,
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">{status}</span>
        {showPercentage && (
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      <div className="w-full bg-secondary rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

// Loading states for different scenarios
export const LoadingStates = {
  Button: ({ children, loading, ...props }: any) => (
    <button disabled={loading} {...props}>
      {loading ? (
        <div className="flex items-center space-x-2">
          <LoadingSpinner size="sm" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  ),

  Card: ({ loading, children, ...props }: any) => (
    <div className="relative" {...props}>
      {children}
      {loading && <LoadingSpinner overlay label="Loading data..." />}
    </div>
  ),

  Table: ({ loading, rows = 5 }: { loading: boolean; rows?: number }) =>
    loading ? (
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} lines={1} />
        ))}
      </div>
    ) : null,

  Dashboard: ({ loading }: { loading: boolean }) =>
    loading ? (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} card />
          ))}
        </div>
        <Skeleton lines={8} />
      </div>
    ) : null,
};

export { LoadingSpinner, Skeleton, spinnerVariants };
