// AI Selector Generation Types
export interface GeneratedSelector {
  key: string;
  cssSelector: string;
  xpathSelector?: string;
  confidence: number;
  description: string;
  alternatives: string[];
  warnings: string[];
}

export interface SelectorGenerationRequest {
  prompt: string;
  url?: string;
  existingSelectors?: string[];
  options?: {
    includeAlternatives?: boolean;
    maxSelectors?: number;
    minConfidence?: number;
  };
}

export interface SelectorGenerationResponse {
  success: boolean;
  selectors: GeneratedSelector[];
  suggestions?: string[];
  error?: string;
  metadata?: {
    processingTime: number;
    model: string;
    timestamp: Date;
  };
}

// AI Analytics and Metrics
export interface AIMetrics {
  totalRequests: number;
  successRate: number;
  averageConfidence: number;
  mostRequestedFields: string[];
  processingTimeMs: number;
}

export interface SelectorPerformanceMetrics {
  selector: string;
  successCount: number;
  failureCount: number;
  averageConfidence: number;
  lastUsed: Date;
}
