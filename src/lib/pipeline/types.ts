export type NodeType =
  | 'input' | 'output' | 'filter' | 'transform' | 'validate'
  | 'enrich' | 'split' | 'merge' | 'aggregate' | 'sort'
  | 'dedup' | 'javascript' | 'ai-transform' | 'webhook'
  | 'format' | 'export' | 'api-call' | 'database';

export interface NodeConfig {
  [key: string]: any;
  outputFormat?: OutputFormat;
  transformations?: Transformation[];
  validationRules?: ValidationRule[];
  filterConditions?: FilterCondition[];
  customCode?: string;
  apiEndpoint?: string;
  databaseQuery?: string;
}

export interface NodeMetrics {
  processedRecords: number;
  errorCount: number;
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  lastRun: Date;
  successRate: number;
}

export type OutputFormat =
  | 'csv' | 'json' | 'xml' | 'excel' | 'parquet' | 'sql'
  | 'api' | 'webhook' | 'database' | 'html' | 'pdf';

export interface Transformation {
  id: string;
  type: 'map' | 'filter' | 'reduce' | 'format' | 'extract' | 'clean';
  field: string;
  operation: string;
  value?: any;
  code?: string;
}

export interface ValidationRule {
  id: string;
  field: string;
  type: 'required' | 'type' | 'range' | 'regex' | 'custom';
  condition: any;
  message: string;
}

export interface FilterCondition {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'gt' | 'lt' | 'between';
  value: any;
  logic?: 'and' | 'or';
}

export interface PipelineNodeData extends Record<string, unknown> {
  id: string;
  type: NodeType;
  label: string;
  config: NodeConfig;
  status: 'idle' | 'running' | 'success' | 'error' | 'warning';
  metrics?: NodeMetrics;
  preview?: any[];
  isCollapsed?: boolean;
}
