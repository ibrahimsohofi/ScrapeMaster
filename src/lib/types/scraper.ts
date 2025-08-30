// Base types for scraped data
export interface ScrapedDataItem {
  [key: string]: string | number | boolean | null | undefined;
}

export type ScrapedData = ScrapedDataItem[];

export interface SelectorConfig {
  [fieldName: string]: string; // field name -> CSS selector
}

export interface ScraperJobData {
  id: string;
  url: string;
  selectors: SelectorConfig;
  options?: ScrapingOptions;
  data?: ScrapedData;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ScrapingOptions {
  waitTime?: number;
  scrollToBottom?: boolean;
  enableJavaScript?: boolean;
  maxRetries?: number;
  proxySettings?: ProxySettings;
  browserType?: 'chromium' | 'firefox' | 'webkit';
  engine?: 'playwright' | 'httrack';
  httrackOptions?: HTTrackOptions;
}

export interface HTTrackOptions {
  maxDepth?: number;
  maxFiles?: number;
  followExternalLinks?: boolean;
  downloadImages?: boolean;
  downloadCSS?: boolean;
  downloadJS?: boolean;
  userAgent?: string;
  delay?: number;
  respectRobots?: boolean;
  allowedDomains?: string[];
  excludePatterns?: string[];
  includePatterns?: string[];
}

export interface ProxySettings {
  provider?: string;
  region?: string;
  sticky?: boolean;
}

export interface ScraperResult {
  success: boolean;
  data?: ScrapedData;
  error?: string;
  metrics?: {
    pageLoadTime: number;
    dataPoints: number;
    timestamp: Date;
  };
  httrackResult?: HTTrackResult;
}

export interface HTTrackResult {
  success: boolean;
  filesDownloaded: number;
  totalSize: number;
  errors: string[];
  outputPath: string;
  sitemap: Array<{
    url: string;
    localPath: string;
    size: number;
    contentType: string;
    depth: number;
  }>;
}

export interface ScraperConfig {
  url: string;
  selectors: SelectorConfig;
  options?: ScrapingOptions;
}

// Export format types
export type ExportFormat = 'json' | 'csv' | 'tsv' | 'xlsx';

export interface ExportRequest {
  jobId: string;
  format: ExportFormat;
  options?: {
    includeMetadata?: boolean;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
}
