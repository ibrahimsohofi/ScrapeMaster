import { z } from 'zod';

// Enhanced transformation node types
export interface TransformationNode {
  id: string;
  type: TransformationNodeType;
  name: string;
  description: string;
  category: NodeCategory;
  icon: string;
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  config: TransformationConfig;
  preview?: PreviewData;
  validation?: ValidationResult;
}

export type TransformationNodeType =
  // Data Cleaning
  | 'clean-text' | 'remove-duplicates' | 'fill-missing' | 'normalize-data'
  | 'extract-urls' | 'extract-emails' | 'extract-phones' | 'clean-html'

  // Data Transformation
  | 'map-fields' | 'split-column' | 'merge-columns' | 'pivot-data'
  | 'unpivot-data' | 'group-by' | 'sort-data' | 'filter-rows'
  | 'sample-data' | 'transpose' | 'calculate-field'

  // Data Enrichment
  | 'geo-lookup' | 'domain-lookup' | 'company-lookup' | 'social-lookup'
  | 'email-verification' | 'phone-validation' | 'name-parsing'
  | 'address-parsing' | 'sentiment-analysis' | 'language-detection'

  // Data Validation
  | 'validate-email' | 'validate-phone' | 'validate-url' | 'validate-json'
  | 'validate-schema' | 'validate-format' | 'data-quality-check'

  // Advanced Processing
  | 'ai-extraction' | 'text-classification' | 'entity-extraction'
  | 'keyword-extraction' | 'summarization' | 'translation'
  | 'image-ocr' | 'pdf-extraction' | 'regex-extraction'

  // External Services
  | 'webhook-call' | 'api-request' | 'database-lookup' | 'redis-cache'
  | 'elasticsearch-search' | 'google-search' | 'social-media-api'

  // Conditional Logic
  | 'if-then' | 'switch-case' | 'loop-over' | 'retry-logic'
  | 'error-handling' | 'parallel-processing' | 'rate-limiting'

  // Output Formatting
  | 'format-csv' | 'format-json' | 'format-xml' | 'format-parquet'
  | 'format-excel' | 'format-pdf' | 'format-html' | 'format-markdown'
  | 'format-sql' | 'format-yaml' | 'generate-report';

export type NodeCategory =
  | 'input' | 'cleaning' | 'transformation' | 'enrichment'
  | 'validation' | 'ai' | 'external' | 'logic' | 'output';

export interface PortDefinition {
  id: string;
  name: string;
  type: 'input' | 'output';
  dataType: DataType;
  required: boolean;
  multiple?: boolean;
  description?: string;
}

export type DataType =
  | 'any' | 'string' | 'number' | 'boolean' | 'array' | 'object'
  | 'csv' | 'json' | 'xml' | 'html' | 'text' | 'binary'
  | 'email' | 'phone' | 'url' | 'image' | 'pdf';

export interface TransformationConfig {
  [key: string]: any;
  javascript?: string;
  mapping?: FieldMapping[];
  filters?: FilterRule[];
  validation?: ValidationRule[];
  enrichment?: EnrichmentConfig;
  ai?: AIConfig;
  external?: ExternalServiceConfig;
}

export interface FieldMapping {
  source: string;
  target: string;
  transform?: string;
  condition?: string;
}

export interface FilterRule {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'gt' | 'lt' | 'between';
  value: any;
  caseSensitive?: boolean;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'email' | 'phone' | 'url' | 'regex' | 'range' | 'custom';
  value?: any;
  message?: string;
}

export interface EnrichmentConfig {
  service: 'clearbit' | 'hunter' | 'fullcontact' | 'ipstack' | 'opencage';
  apiKey?: string;
  fields: string[];
  cache?: boolean;
  timeout?: number;
}

export interface AIConfig {
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude' | 'llama';
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  fields?: string[];
}

export interface ExternalServiceConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: { [key: string]: string };
  body?: any;
  timeout?: number;
  retries?: number;
}

export interface PreviewData {
  input: any[];
  output: any[];
  stats: {
    inputRows: number;
    outputRows: number;
    processingTime: number;
    errorCount: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// Enhanced Output Formats
export interface OutputFormat {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  description: string;
  category: OutputCategory;
  supports: OutputFeature[];
  config?: OutputConfig;
}

export type OutputCategory = 'structured' | 'document' | 'database' | 'api' | 'cloud';

export type OutputFeature =
  | 'compression' | 'encryption' | 'partitioning' | 'streaming'
  | 'schema-validation' | 'custom-formatting' | 'batch-export';

export interface OutputConfig {
  compression?: 'gzip' | 'zip' | 'brotli';
  encryption?: 'aes-256' | 'rsa';
  batchSize?: number;
  customFormat?: string;
  destination?: OutputDestination;
}

export interface OutputDestination {
  type: 'local' | 's3' | 'gcs' | 'azure' | 'ftp' | 'webhook' | 'database';
  config: any;
}

// Predefined transformation nodes
export const TRANSFORMATION_NODES: TransformationNode[] = [
  // Data Cleaning Nodes
  {
    id: 'clean-text',
    type: 'clean-text',
    name: 'Clean Text',
    description: 'Remove extra whitespace, special characters, and normalize text',
    category: 'cleaning',
    icon: 'Eraser',
    inputs: [
      { id: 'input', name: 'Input Data', type: 'input', dataType: 'any', required: true }
    ],
    outputs: [
      { id: 'output', name: 'Cleaned Data', type: 'output', dataType: 'any', required: true }
    ],
    config: {
      removeWhitespace: true,
      removeSpecialChars: false,
      toLowerCase: false,
      removeNumbers: false,
      customRegex: ''
    }
  },

  {
    id: 'remove-duplicates',
    type: 'remove-duplicates',
    name: 'Remove Duplicates',
    description: 'Remove duplicate records based on specified fields',
    category: 'cleaning',
    icon: 'Copy',
    inputs: [
      { id: 'input', name: 'Input Data', type: 'input', dataType: 'array', required: true }
    ],
    outputs: [
      { id: 'output', name: 'Unique Data', type: 'output', dataType: 'array', required: true },
      { id: 'duplicates', name: 'Duplicates', type: 'output', dataType: 'array', required: false }
    ],
    config: {
      fields: [],
      keepFirst: true,
      caseSensitive: true
    }
  },

  // Data Transformation Nodes
  {
    id: 'map-fields',
    type: 'map-fields',
    name: 'Map Fields',
    description: 'Map and transform fields from input to output schema',
    category: 'transformation',
    icon: 'ArrowRightLeft',
    inputs: [
      { id: 'input', name: 'Input Data', type: 'input', dataType: 'any', required: true }
    ],
    outputs: [
      { id: 'output', name: 'Mapped Data', type: 'output', dataType: 'any', required: true }
    ],
    config: {
      mapping: []
    }
  },

  {
    id: 'filter-rows',
    type: 'filter-rows',
    name: 'Filter Rows',
    description: 'Filter data rows based on specified conditions',
    category: 'transformation',
    icon: 'Filter',
    inputs: [
      { id: 'input', name: 'Input Data', type: 'input', dataType: 'array', required: true }
    ],
    outputs: [
      { id: 'matched', name: 'Matched Rows', type: 'output', dataType: 'array', required: true },
      { id: 'unmatched', name: 'Unmatched Rows', type: 'output', dataType: 'array', required: false }
    ],
    config: {
      filters: []
    }
  },

  // AI-Powered Nodes
  {
    id: 'ai-extraction',
    type: 'ai-extraction',
    name: 'AI Data Extraction',
    description: 'Extract structured data using AI models',
    category: 'ai',
    icon: 'Brain',
    inputs: [
      { id: 'input', name: 'Text/HTML Data', type: 'input', dataType: 'text', required: true }
    ],
    outputs: [
      { id: 'extracted', name: 'Extracted Data', type: 'output', dataType: 'object', required: true }
    ],
    config: {
      ai: {
        model: 'gpt-4',
        prompt: 'Extract the following fields from the text: name, email, phone, company',
        temperature: 0.1,
        maxTokens: 1000
      }
    }
  },

  {
    id: 'sentiment-analysis',
    type: 'sentiment-analysis',
    name: 'Sentiment Analysis',
    description: 'Analyze sentiment of text content',
    category: 'ai',
    icon: 'Heart',
    inputs: [
      { id: 'input', name: 'Text Data', type: 'input', dataType: 'text', required: true }
    ],
    outputs: [
      { id: 'output', name: 'Sentiment Data', type: 'output', dataType: 'object', required: true }
    ],
    config: {
      fields: ['content', 'description', 'review'],
      includeScore: true,
      includeEntities: false
    }
  },

  // External Service Nodes
  {
    id: 'webhook-call',
    type: 'webhook-call',
    name: 'Webhook',
    description: 'Send data to external webhook endpoint',
    category: 'external',
    icon: 'Webhook',
    inputs: [
      { id: 'input', name: 'Input Data', type: 'input', dataType: 'any', required: true }
    ],
    outputs: [
      { id: 'response', name: 'Webhook Response', type: 'output', dataType: 'object', required: false }
    ],
    config: {
      external: {
        url: '',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    }
  },

  // Validation Nodes
  {
    id: 'validate-schema',
    type: 'validate-schema',
    name: 'Schema Validation',
    description: 'Validate data against a JSON schema',
    category: 'validation',
    icon: 'CheckCircle',
    inputs: [
      { id: 'input', name: 'Input Data', type: 'input', dataType: 'any', required: true }
    ],
    outputs: [
      { id: 'valid', name: 'Valid Data', type: 'output', dataType: 'any', required: true },
      { id: 'invalid', name: 'Invalid Data', type: 'output', dataType: 'any', required: false }
    ],
    config: {
      validation: [],
      stopOnError: false
    }
  }
];

// Enhanced output formats
export const OUTPUT_FORMATS: OutputFormat[] = [
  // Structured Data Formats
  {
    id: 'csv',
    name: 'CSV',
    extension: 'csv',
    mimeType: 'text/csv',
    description: 'Comma-separated values format',
    category: 'structured',
    supports: ['compression', 'custom-formatting', 'batch-export']
  },

  {
    id: 'json',
    name: 'JSON',
    extension: 'json',
    mimeType: 'application/json',
    description: 'JavaScript Object Notation',
    category: 'structured',
    supports: ['compression', 'schema-validation', 'streaming']
  },

  {
    id: 'parquet',
    name: 'Parquet',
    extension: 'parquet',
    mimeType: 'application/octet-stream',
    description: 'Apache Parquet columnar storage format',
    category: 'structured',
    supports: ['compression', 'partitioning', 'schema-validation']
  },

  {
    id: 'excel',
    name: 'Excel',
    extension: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    description: 'Microsoft Excel format',
    category: 'structured',
    supports: ['custom-formatting', 'batch-export']
  },

  // Document Formats
  {
    id: 'pdf',
    name: 'PDF Report',
    extension: 'pdf',
    mimeType: 'application/pdf',
    description: 'PDF document with formatted data',
    category: 'document',
    supports: ['custom-formatting', 'encryption']
  },

  {
    id: 'html',
    name: 'HTML Report',
    extension: 'html',
    mimeType: 'text/html',
    description: 'HTML formatted report',
    category: 'document',
    supports: ['custom-formatting']
  },

  // Database Formats
  {
    id: 'sql-insert',
    name: 'SQL Inserts',
    extension: 'sql',
    mimeType: 'application/sql',
    description: 'SQL INSERT statements',
    category: 'database',
    supports: ['batch-export', 'custom-formatting']
  },

  {
    id: 'postgresql',
    name: 'PostgreSQL',
    extension: '',
    mimeType: '',
    description: 'Direct PostgreSQL database insert',
    category: 'database',
    supports: ['batch-export', 'streaming']
  },

  // API Formats
  {
    id: 'webhook',
    name: 'Webhook',
    extension: '',
    mimeType: 'application/json',
    description: 'Send data to webhook endpoint',
    category: 'api',
    supports: ['batch-export', 'streaming']
  },

  {
    id: 'rest-api',
    name: 'REST API',
    extension: '',
    mimeType: 'application/json',
    description: 'RESTful API endpoint',
    category: 'api',
    supports: ['batch-export', 'streaming']
  },

  // Cloud Storage
  {
    id: 's3',
    name: 'Amazon S3',
    extension: '',
    mimeType: '',
    description: 'Amazon S3 bucket storage',
    category: 'cloud',
    supports: ['compression', 'encryption', 'partitioning', 'batch-export']
  },

  {
    id: 'gcs',
    name: 'Google Cloud Storage',
    extension: '',
    mimeType: '',
    description: 'Google Cloud Storage bucket',
    category: 'cloud',
    supports: ['compression', 'encryption', 'partitioning', 'batch-export']
  }
];
