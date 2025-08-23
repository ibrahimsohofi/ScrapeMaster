import { useState, useCallback, useRef, useEffect } from 'react';
import { handleError } from '@/lib/error-handler';

interface UseLoadingOptions {
  initialLoading?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  retryDelay?: number;
  maxRetries?: number;
}

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  lastAttempt: number | null;
}

export function useLoading(options: UseLoadingOptions = {}) {
  const {
    initialLoading = false,
    onSuccess,
    onError,
    retryDelay = 1000,
    maxRetries = 3
  } = options;

  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null,
    retryCount: 0,
    lastAttempt: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Execute async operation with loading state management
  const execute = useCallback(async <T>(
    operation: (signal?: AbortSignal) => Promise<T>,
    options: {
      retryOnError?: boolean;
      resetRetryCount?: boolean;
    } = {}
  ): Promise<T | null> => {
    const { retryOnError = true, resetRetryCount = true } = options;

    // Cleanup previous operation
    cleanup();

    // Reset retry count if requested
    if (resetRetryCount) {
      setState(prev => ({ ...prev, retryCount: 0 }));
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      lastAttempt: Date.now()
    }));

    try {
      const result = await operation(signal);

      if (!signal.aborted) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
          retryCount: 0
        }));

        onSuccess?.(result);
        return result;
      }

      return null;
    } catch (error: any) {
      if (signal.aborted) {
        return null;
      }

      const appError = handleError(error);

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: appError.userMessage,
        retryCount: prev.retryCount + 1
      }));

      onError?.(appError);

      // Auto-retry if conditions are met
      if (
        retryOnError &&
        appError.retryable &&
        state.retryCount < maxRetries
      ) {
        const delay = retryDelay * Math.pow(2, state.retryCount); // Exponential backoff

        retryTimeoutRef.current = setTimeout(() => {
          execute(operation, { retryOnError, resetRetryCount: false });
        }, delay);
      }

      throw appError;
    }
  }, [state.retryCount, maxRetries, retryDelay, onSuccess, onError, cleanup]);

  // Manual retry function
  const retry = useCallback(async <T>(
    operation: (signal?: AbortSignal) => Promise<T>
  ): Promise<T | null> => {
    return execute(operation, { retryOnError: true, resetRetryCount: false });
  }, [execute]);

  // Reset loading state
  const reset = useCallback(() => {
    cleanup();
    setState({
      isLoading: false,
      error: null,
      retryCount: 0,
      lastAttempt: null
    });
  }, [cleanup]);

  // Cancel current operation
  const cancel = useCallback(() => {
    cleanup();
    setState(prev => ({
      ...prev,
      isLoading: false
    }));
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    ...state,
    execute,
    retry,
    reset,
    cancel,
    canRetry: state.error && state.retryCount < maxRetries
  };
}

// Hook for managing multiple loading states
export function useMultipleLoading() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  }, []);

  const setError = useCallback((key: string, error: string | null) => {
    setErrors(prev => ({
      ...prev,
      [key]: error
    }));
  }, []);

  const isLoading = useCallback((key?: string) => {
    if (key) {
      return loadingStates[key] || false;
    }
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const getError = useCallback((key: string) => {
    return errors[key] || null;
  }, [errors]);

  const hasAnyError = useCallback(() => {
    return Object.values(errors).some(error => error !== null);
  }, [errors]);

  const clearError = useCallback((key: string) => {
    setError(key, null);
  }, [setError]);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const reset = useCallback((key?: string) => {
    if (key) {
      setLoading(key, false);
      setError(key, null);
    } else {
      setLoadingStates({});
      setErrors({});
    }
  }, [setLoading, setError]);

  return {
    setLoading,
    setError,
    isLoading,
    getError,
    hasAnyError,
    clearError,
    clearAllErrors,
    reset,
    loadingStates,
    errors
  };
}

// Hook for form submission loading
export function useFormLoading() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const submitForm = useCallback(async <T>(
    submitOperation: () => Promise<T>,
    options: {
      onSuccess?: (data: T) => void;
      onError?: (error: any) => void;
      resetAfter?: number;
    } = {}
  ): Promise<T | null> => {
    const { onSuccess, onError, resetAfter = 3000 } = options;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const result = await submitOperation();

      setSubmitSuccess(true);
      onSuccess?.(result);

      // Auto-reset success state
      setTimeout(() => {
        setSubmitSuccess(false);
      }, resetAfter);

      return result;
    } catch (error: any) {
      const appError = handleError(error);
      setSubmitError(appError.userMessage);
      onError?.(appError);
      throw appError;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const resetForm = useCallback(() => {
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmitSuccess(false);
  }, []);

  return {
    isSubmitting,
    submitError,
    submitSuccess,
    submitForm,
    resetForm
  };
}

// Hook for data fetching with loading states
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  dependencies: React.DependencyList = [],
  options: {
    immediate?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
  } = {}
) {
  const { immediate = true, onSuccess, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const { execute, isLoading, error, retry, reset } = useLoading({
    onSuccess: (result: T) => {
      setData(result);
      onSuccess?.(result);
    },
    onError
  });

  const refetch = useCallback(() => {
    return execute(fetcher);
  }, [execute, fetcher]);

  useEffect(() => {
    if (immediate) {
      refetch();
    }
  }, dependencies);

  return {
    data,
    isLoading,
    error,
    refetch,
    retry: () => retry(fetcher),
    reset: () => {
      reset();
      setData(null);
    }
  };
}

// Hook for pagination with loading
export function usePaginatedLoading<T>(
  fetcher: (page: number, limit: number) => Promise<{ data: T[]; total: number; hasMore: boolean }>,
  initialLimit = 10
) {
  const [allData, setAllData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [limit] = useState(initialLimit);

  const { execute, isLoading, error, reset: resetLoading } = useLoading();

  const loadPage = useCallback(async (pageNum: number, append = false) => {
    const result = await execute(() => fetcher(pageNum, limit));

    if (result) {
      setAllData(prev => append ? [...prev, ...result.data] : result.data);
      setTotal(result.total);
      setHasMore(result.hasMore);
      setPage(pageNum);
    }
  }, [execute, fetcher, limit]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      loadPage(page + 1, true);
    }
  }, [hasMore, isLoading, loadPage, page]);

  const refresh = useCallback(() => {
    setAllData([]);
    loadPage(1, false);
  }, [loadPage]);

  const reset = useCallback(() => {
    resetLoading();
    setAllData([]);
    setPage(1);
    setTotal(0);
    setHasMore(true);
  }, [resetLoading]);

  return {
    data: allData,
    isLoading,
    error,
    page,
    total,
    hasMore,
    loadPage,
    loadMore,
    refresh,
    reset
  };
}
