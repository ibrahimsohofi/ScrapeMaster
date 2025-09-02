// Enums
export enum PlanType {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  VIEWER = 'VIEWER',
}

export enum OrganizationStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}

// Organization model
export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: PlanType;
  status: OrganizationStatus;
  subscriptionId: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  monthlyRequestLimit: number;
  monthlyRequestsUsed: number;
  maxConcurrentJobs: number;
  dataRetentionDays: number;
  createdAt: Date;
  updatedAt: Date;
}

// User model
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  organizationId: string;
  lastLoginAt: Date | null;
  isActive: boolean;
  apiKey?: string; // API key for authenticating API requests
  createdAt: Date;
  updatedAt: Date;
}

// Job status enum
export enum JobStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
}

// Job model - represents a scraping job
export interface Job {
  id: string;
  organizationId: string;
  createdById: string;
  name: string;
  description?: string;
  url: string;
  selectors: Record<string, string>; // CSS selectors for different fields to extract
  status: JobStatus;
  schedule: string | null; // null for one-time jobs, cron string for scheduled jobs
  lastRun: Date | null;
  nextRun: Date | null;
  resultsUrl: string | null; // URL to the stored results
  createdAt: Date;
  updatedAt: Date;
}

// Plan model - represents a subscription plan
export interface Plan {
  id: string;
  name: string;
  price: number | null; // null for custom pricing (enterprise)
  maxRequests: number | null; // null for unlimited
  maxConcurrentScrapers: number | null; // null for unlimited
  dataRetentionDays: number;
  features: string[];
}

// Subscription status
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid';

// Subscription model - represents a user's subscription
export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Job result model - represents the structured data extracted from a website
export interface JobResult {
  jobId: string;
  data: Record<string, unknown>[]; // Array of extracted records
  timestamp: Date;
  format: 'json' | 'csv' | 'excel';
  url: string; // URL to download the result
  metadata: {
    requestCount: number;
    duration: number; // in milliseconds
    success: boolean;
    errors?: string[];
  };
}

// Proxy configuration
export interface ProxyConfig {
  type: 'http' | 'https' | 'socks4' | 'socks5';
  host: string;
  port: number;
  username?: string;
  password?: string;
}

// Scraper configuration
export interface ScraperConfig {
  url: string;
  selectors: Record<string, string>;
  waitFor?: string; // CSS selector to wait for before scraping
  javascript?: string; // Custom JavaScript to execute before scraping
  proxy?: ProxyConfig;
  timeout?: number; // in milliseconds
  retries?: number;
  userAgent?: string;
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
}

// API Key
export interface ApiKey {
  id: string;
  userId: string;
  key: string;
  name: string;
  lastUsed: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
}

// Usage statistics
export interface UsageStats {
  userId: string;
  period: string; // e.g., '2023-04' for April 2023
  requestsUsed: number;
  storageUsed: number; // in bytes
  lastUpdated: Date;
}
