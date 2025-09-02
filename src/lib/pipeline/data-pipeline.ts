import { z } from 'zod';

// Core pipeline data structures
export interface PipelineNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
  inputs: NodeConnection[];
  outputs: NodeConnection[];
  config: NodeConfig;
  status: NodeStatus;
  metrics?: NodeMetrics;
}

export interface NodeConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourcePort: string;
  targetPort: string;
  dataType: DataType;
  sampleData?: any;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  nodes: PipelineNode[];
  connections: NodeConnection[];
  config: PipelineConfig;
  status: PipelineStatus;
  created: Date;
  updated: Date;
  version: number;
  tags: string[];
  schedule?: ScheduleConfig;
  templates?: PipelineTemplate[];
}

// Enhanced Node Types
export type NodeType =
  | 'input' | 'output' | 'filter' | 'transform' | 'validate'
  | 'enrich' | 'split' | 'merge' | 'aggregate' | 'sort'
  | 'dedup' | 'javascript' | 'ai-transform' | 'webhook'
  | 'format' | 'export' | 'api-call' | 'database'
  | 'email' | 'notification' | 'delay' | 'loop'
  | 'condition' | 'parallel' | 'cache';

export type DataType =
  | 'string' | 'number' | 'boolean' | 'array' | 'object'
  | 'date' | 'url' | 'email' | 'phone' | 'json'
  | 'csv' | 'xml' | 'html' | 'binary' | 'any';

export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'warning' | 'paused';
export type PipelineStatus = 'draft' | 'running' | 'completed' | 'failed' | 'paused' | 'scheduled';

// Enhanced Output Formats
export type OutputFormat =
  | 'csv' | 'json' | 'xml' | 'excel' | 'parquet' | 'sql'
  | 'api' | 'webhook' | 'database' | 'html' | 'pdf'
  | 'yaml' | 'tsv' | 'jsonl' | 'avro' | 'orc'
  | 'elasticsearch' | 'mongodb' | 'bigquery';

// Node Configuration Interfaces
export interface NodeConfig {
  [key: string]: any;
  // Common config
  name?: string;
  description?: string;
  enabled?: boolean;
  parallelExecution?: boolean;
  retryCount?: number;
  timeout?: number;

  // Type-specific configs
  outputFormat?: OutputFormat;
  transformations?: Transformation[];
  validationRules?: ValidationRule[];
  filterConditions?: FilterCondition[];
  customCode?: string;
  apiEndpoint?: string;
  databaseQuery?: string;
  cacheConfig?: CacheConfig;
  emailConfig?: EmailConfig;
  scheduleConfig?: ScheduleConfig;
}

export interface NodeData {
  preview?: any[];
  schema?: DataSchema;
  statistics?: DataStatistics;
  errors?: ValidationError[];
  cache?: CachedData;
}

export interface NodeMetrics {
  processedRecords: number;
  errorCount: number;
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  lastRun: Date;
  successRate: number;
  throughput: number;
  avgProcessingTime: number;
  peakMemoryUsage: number;
}

// Transformation System
export interface Transformation {
  id: string;
  type: TransformationType;
  field: string;
  operation: TransformationOperation;
  value?: any;
  code?: string;
  mapping?: FieldMapping;
  condition?: string;
  format?: string;
  options?: TransformationOptions;
}

export type TransformationType =
  | 'map' | 'filter' | 'reduce' | 'format' | 'extract'
  | 'clean' | 'normalize' | 'aggregate' | 'join'
  | 'split' | 'merge' | 'convert' | 'calculate';

export type TransformationOperation =
  | 'replace' | 'append' | 'prepend' | 'substring' | 'regex'
  | 'uppercase' | 'lowercase' | 'trim' | 'split' | 'join'
  | 'multiply' | 'add' | 'subtract' | 'divide' | 'round'
  | 'format_date' | 'parse_date' | 'extract_domain'
  | 'remove_duplicates' | 'sort' | 'group' | 'pivot'
  | 'extract' | 'format';

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: string;
}

export interface TransformationOptions {
  caseSensitive?: boolean;
  ignoreErrors?: boolean;
  preserveOriginal?: boolean;
  delimiter?: string;
  dateFormat?: string;
  precision?: number;
}

// Validation System
export interface ValidationRule {
  id: string;
  field: string;
  type: ValidationType;
  condition: any;
  message: string;
  severity: 'error' | 'warning' | 'info';
  stopOnFail?: boolean;
}

export type ValidationType =
  | 'required' | 'type' | 'range' | 'regex' | 'custom'
  | 'email' | 'url' | 'phone' | 'date' | 'length'
  | 'unique' | 'enum' | 'format' | 'relationship';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  row?: number;
  value?: any;
}

// Filter System
export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  logic?: 'and' | 'or';
  group?: string;
  caseSensitive?: boolean;
}

export type FilterOperator =
  | 'equals' | 'not_equals' | 'contains' | 'not_contains'
  | 'startsWith' | 'endsWith' | 'regex' | 'not_regex'
  | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'not_between'
  | 'in' | 'not_in' | 'is_null' | 'is_not_null'
  | 'is_empty' | 'is_not_empty';

// Advanced Features
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  key: string;
  strategy: 'memory' | 'redis' | 'file';
  compression?: boolean;
}

export interface EmailConfig {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  template: string;
  attachData?: boolean;
  format?: OutputFormat;
}

export interface ScheduleConfig {
  enabled: boolean;
  type: 'cron' | 'interval' | 'once';
  expression: string;
  timezone?: string;
  retryPolicy?: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  baseDelay: number;
  maxDelay: number;
}

export interface PipelineConfig {
  maxParallelNodes: number;
  timeout: number;
  retryPolicy: RetryPolicy;
  monitoring: MonitoringConfig;
  security: SecurityConfig;
  optimization: OptimizationConfig;
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: string[];
  alerts: AlertConfig[];
  logging: LoggingConfig;
}

export interface AlertConfig {
  id: string;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: ('email' | 'slack' | 'webhook')[];
  threshold: number;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  destinations: ('console' | 'file' | 'database')[];
  format: 'json' | 'text';
  retention: number; // days
}

export interface SecurityConfig {
  authentication: boolean;
  authorization: boolean;
  encryption: boolean;
  allowedIPs?: string[];
  rateLimiting?: RateLimitConfig;
}

export interface RateLimitConfig {
  enabled: boolean;
  requestsPerMinute: number;
  burstSize: number;
}

export interface OptimizationConfig {
  batchSize: number;
  parallelism: number;
  memoryLimit: number; // MB
  diskCacheSize: number; // MB
  compressionEnabled: boolean;
}

// Data Schema and Statistics
export interface DataSchema {
  fields: SchemaField[];
  primaryKey?: string;
  indexes?: string[];
  relationships?: Relationship[];
}

export interface SchemaField {
  name: string;
  type: DataType;
  required: boolean;
  unique?: boolean;
  defaultValue?: any;
  constraints?: FieldConstraint[];
  description?: string;
}

export interface FieldConstraint {
  type: 'min' | 'max' | 'length' | 'pattern' | 'enum';
  value: any;
}

export interface Relationship {
  type: 'one_to_one' | 'one_to_many' | 'many_to_many';
  sourceField: string;
  targetTable: string;
  targetField: string;
}

export interface DataStatistics {
  totalRows: number;
  totalColumns: number;
  dataTypes: Record<string, number>;
  nullValues: Record<string, number>;
  uniqueValues: Record<string, number>;
  memoryUsage: number;
  qualityScore: number;
  completeness: number;
  validity: number;
  consistency: number;
  accuracy: number;
}

export interface CachedData {
  key: string;
  data: any;
  timestamp: Date;
  ttl: number;
  hits: number;
  size: number;
}

// Pipeline Templates
export interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  nodes: PipelineNode[];
  connections: NodeConnection[];
  config: Partial<PipelineConfig>;
  tags: string[];
  author: string;
  version: string;
  popularity: number;
  thumbnail?: string;
}

export type TemplateCategory =
  | 'data_ingestion' | 'data_transformation' | 'data_validation'
  | 'data_export' | 'api_integration' | 'reporting'
  | 'monitoring' | 'ml_preprocessing' | 'etl' | 'custom';

// Data Processing Engine
export class DataPipelineEngine {
  private pipeline: Pipeline;
  private executionContext: ExecutionContext;
  private metrics: PipelineMetrics;

  constructor(pipeline: Pipeline) {
    this.pipeline = pipeline;
    this.executionContext = new ExecutionContext();
    this.metrics = new PipelineMetrics();
  }

  async execute(): Promise<PipelineResult> {
    try {
      this.metrics.startTime = new Date();

      // Validate pipeline
      const validation = this.validatePipeline();
      if (!validation.isValid) {
        throw new Error(`Pipeline validation failed: ${validation.errors.join(', ')}`);
      }

      // Execute nodes in topological order
      const executionOrder = this.getExecutionOrder();
      const results: NodeResult[] = [];

      for (const nodeId of executionOrder) {
        const result = await this.executeNode(nodeId);
        results.push(result);

        if (result.status === 'error' && !result.node.config.ignoreErrors) {
          throw new Error(`Node ${nodeId} failed: ${result.error}`);
        }
      }

      this.metrics.endTime = new Date();
      this.metrics.totalExecutionTime = this.metrics.endTime.getTime() - this.metrics.startTime.getTime();

      return {
        status: 'success',
        results,
        metrics: this.metrics,
        output: this.getOutputData(results)
      };

    } catch (error) {
      this.metrics.endTime = new Date();
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: this.metrics,
        results: []
      };
    }
  }

  private validatePipeline(): ValidationResult {
    const errors: string[] = [];

    // Check for disconnected nodes
    const connectedNodes = new Set();
    this.pipeline.connections.forEach(conn => {
      connectedNodes.add(conn.sourceNodeId);
      connectedNodes.add(conn.targetNodeId);
    });

    const inputNodes = this.pipeline.nodes.filter(n => n.type === 'input');
    if (inputNodes.length === 0) {
      errors.push('Pipeline must have at least one input node');
    }

    const outputNodes = this.pipeline.nodes.filter(n => n.type === 'output' || n.type === 'export');
    if (outputNodes.length === 0) {
      errors.push('Pipeline must have at least one output node');
    }

    // Check for cycles
    if (this.hasCycles()) {
      errors.push('Pipeline contains cycles');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private getExecutionOrder(): string[] {
    // Topological sort to determine execution order
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (nodeId: string) => {
      if (visiting.has(nodeId)) {
        throw new Error('Cycle detected in pipeline');
      }
      if (visited.has(nodeId)) {
        return;
      }

      visiting.add(nodeId);

      const dependencies = this.pipeline.connections
        .filter(conn => conn.targetNodeId === nodeId)
        .map(conn => conn.sourceNodeId);

      dependencies.forEach(visit);

      visiting.delete(nodeId);
      visited.add(nodeId);
      order.push(nodeId);
    };

    this.pipeline.nodes.forEach(node => visit(node.id));
    return order;
  }

  private async executeNode(nodeId: string): Promise<NodeResult> {
    const node = this.pipeline.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    const startTime = new Date();

    try {
      // Get input data
      const inputData = this.getNodeInputData(nodeId);

      // Execute node based on type
      let outputData: any;
      switch (node.type) {
        case 'filter':
          outputData = this.executeFilterNode(node, inputData);
          break;
        case 'transform':
          outputData = this.executeTransformNode(node, inputData);
          break;
        case 'validate':
          outputData = this.executeValidateNode(node, inputData);
          break;
        case 'aggregate':
          outputData = this.executeAggregateNode(node, inputData);
          break;
        case 'javascript':
          outputData = this.executeJavaScriptNode(node, inputData);
          break;
        default:
          outputData = inputData; // Pass through
      }

      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      // Update metrics
      this.updateNodeMetrics(node, outputData, executionTime);

      return {
        nodeId,
        node,
        status: 'success',
        data: outputData,
        executionTime,
        recordsProcessed: Array.isArray(outputData) ? outputData.length : 1
      };

    } catch (error) {
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      return {
        nodeId,
        node,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
        recordsProcessed: 0
      };
    }
  }

  private executeFilterNode(node: PipelineNode, data: any[]): any[] {
    const conditions = node.config.filterConditions as FilterCondition[] || [];

    return data.filter(record => {
      return conditions.every(condition => {
        const fieldValue = this.getFieldValue(record, condition.field);
        return this.evaluateFilterCondition(fieldValue, condition);
      });
    });
  }

  private executeTransformNode(node: PipelineNode, data: any[]): any[] {
    const transformations = node.config.transformations as Transformation[] || [];

    return data.map(record => {
      const transformedRecord = { ...record };

      transformations.forEach(transform => {
        const value = this.getFieldValue(transformedRecord, transform.field);
        const transformedValue = this.applyTransformation(value, transform);
        this.setFieldValue(transformedRecord, transform.field, transformedValue);
      });

      return transformedRecord;
    });
  }

  private executeValidateNode(node: PipelineNode, data: any[]): any[] {
    const rules = node.config.validationRules as ValidationRule[] || [];
    const errors: ValidationError[] = [];

    const validatedData = data.filter((record, index) => {
      let isValid = true;

      rules.forEach(rule => {
        const fieldValue = this.getFieldValue(record, rule.field);
        const isFieldValid = this.validateField(fieldValue, rule);

        if (!isFieldValid) {
          errors.push({
            field: rule.field,
            message: rule.message,
            severity: rule.severity,
            row: index,
            value: fieldValue
          });

          if (rule.severity === 'error') {
            isValid = false;
          }
        }
      });

      return isValid;
    });

    // Store validation errors in node data
    node.data.errors = errors;

    return validatedData;
  }

  private executeAggregateNode(node: PipelineNode, data: any[]): any[] {
    const groupBy = node.config.groupBy as string[];
    const aggregations = node.config.aggregations as AggregationRule[];

    if (!groupBy || groupBy.length === 0) {
      // Global aggregation
      return [this.performAggregations(data, aggregations)];
    }

    // Group by aggregation
    const groups = this.groupData(data, groupBy);
    return Object.entries(groups).map(([key, groupData]) => ({
      ...this.parseGroupKey(key, groupBy),
      ...this.performAggregations(groupData, aggregations)
    }));
  }

  private executeJavaScriptNode(node: PipelineNode, data: any[]): any[] {
    const code = node.config.customCode as string;
    if (!code) return data;

    try {
      // Create safe execution context
      const func = new Function('data', 'node', 'context', code);
      return func(data, node, this.executionContext);
    } catch (error) {
      throw new Error(`JavaScript execution failed: ${error}`);
    }
  }

  // Helper methods
  private getFieldValue(record: any, field: string): any {
    return field.split('.').reduce((obj, key) => obj?.[key], record);
  }

  private setFieldValue(record: any, field: string, value: any): void {
    const keys = field.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, record);
    target[lastKey] = value;
  }

  private evaluateFilterCondition(value: any, condition: FilterCondition): boolean {
    const { operator, value: conditionValue, caseSensitive = true } = condition;

    if (!caseSensitive && typeof value === 'string' && typeof conditionValue === 'string') {
      value = value.toLowerCase();
      condition.value = conditionValue.toLowerCase();
    }

    switch (operator) {
      case 'equals': return value === conditionValue;
      case 'not_equals': return value !== conditionValue;
      case 'contains': return String(value).includes(String(conditionValue));
      case 'not_contains': return !String(value).includes(String(conditionValue));
      case 'startsWith': return String(value).startsWith(String(conditionValue));
      case 'endsWith': return String(value).endsWith(String(conditionValue));
      case 'gt': return Number(value) > Number(conditionValue);
      case 'gte': return Number(value) >= Number(conditionValue);
      case 'lt': return Number(value) < Number(conditionValue);
      case 'lte': return Number(value) <= Number(conditionValue);
      case 'regex': return new RegExp(String(conditionValue)).test(String(value));
      case 'is_null': return value == null;
      case 'is_not_null': return value != null;
      case 'is_empty': return value === '' || value == null;
      case 'is_not_empty': return value !== '' && value != null;
      case 'in': return Array.isArray(conditionValue) && conditionValue.includes(value);
      case 'not_in': return Array.isArray(conditionValue) && !conditionValue.includes(value);
      default: return true;
    }
  }

  private applyTransformation(value: any, transform: Transformation): any {
    const { operation, value: transformValue, options = {} } = transform;

    switch (operation) {
      case 'replace':
        return String(value).replace(new RegExp(String(transformValue), 'g'), String(transform.mapping?.targetField || ''));
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'trim':
        return String(value).trim();
      case 'substring':
        const [start, end] = Array.isArray(transformValue) ? transformValue : [0, transformValue];
        return String(value).substring(start, end);
      case 'multiply':
        return Number(value) * Number(transformValue);
      case 'add':
        return Number(value) + Number(transformValue);
      case 'subtract':
        return Number(value) - Number(transformValue);
      case 'divide':
        return Number(value) / Number(transformValue);
      case 'round':
        return Math.round(Number(value) * Math.pow(10, options.precision || 0)) / Math.pow(10, options.precision || 0);
      case 'format_date':
        return new Date(value).toLocaleDateString(undefined, {
          year: 'numeric', month: '2-digit', day: '2-digit'
        });
      default:
        return value;
    }
  }

  private validateField(value: any, rule: ValidationRule): boolean {
    switch (rule.type) {
      case 'required':
        return value != null && value !== '';
      case 'type':
        return typeof value === rule.condition;
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
      case 'url':
        try { new URL(String(value)); return true; } catch { return false; }
      case 'regex':
        return new RegExp(rule.condition).test(String(value));
      case 'range':
        const num = Number(value);
        return num >= rule.condition.min && num <= rule.condition.max;
      case 'length':
        const len = String(value).length;
        return len >= (rule.condition.min || 0) && len <= (rule.condition.max || Number.POSITIVE_INFINITY);
      default:
        return true;
    }
  }

  private groupData(data: any[], groupBy: string[]): Record<string, any[]> {
    return data.reduce((groups, record) => {
      const key = groupBy.map(field => this.getFieldValue(record, field)).join('|');
      if (!groups[key]) groups[key] = [];
      groups[key].push(record);
      return groups;
    }, {} as Record<string, any[]>);
  }

  private parseGroupKey(key: string, groupBy: string[]): any {
    const values = key.split('|');
    return groupBy.reduce((obj, field, index) => {
      obj[field] = values[index];
      return obj;
    }, {} as any);
  }

  private performAggregations(data: any[], aggregations: AggregationRule[]): any {
    return aggregations.reduce((result, agg) => {
      const values = data.map(record => this.getFieldValue(record, agg.field)).filter(v => v != null);

      switch (agg.operation) {
        case 'count':
          result[agg.alias || `${agg.field}_count`] = values.length;
          break;
        case 'sum':
          result[agg.alias || `${agg.field}_sum`] = values.reduce((sum, val) => sum + Number(val), 0);
          break;
        case 'avg':
          result[agg.alias || `${agg.field}_avg`] = values.reduce((sum, val) => sum + Number(val), 0) / values.length;
          break;
        case 'min':
          result[agg.alias || `${agg.field}_min`] = Math.min(...values.map(Number));
          break;
        case 'max':
          result[agg.alias || `${agg.field}_max`] = Math.max(...values.map(Number));
          break;
        case 'first':
          result[agg.alias || `${agg.field}_first`] = values[0];
          break;
        case 'last':
          result[agg.alias || `${agg.field}_last`] = values[values.length - 1];
          break;
      }

      return result;
    }, {} as any);
  }

  private getNodeInputData(nodeId: string): any[] {
    const inputConnections = this.pipeline.connections.filter(conn => conn.targetNodeId === nodeId);

    if (inputConnections.length === 0) {
      // Input node - return sample data or empty array
      return [];
    }

    // Merge data from all input connections
    const inputData: any[] = [];
    inputConnections.forEach(conn => {
      const sourceNode = this.pipeline.nodes.find(n => n.id === conn.sourceNodeId);
      if (sourceNode?.data.preview) {
        inputData.push(...sourceNode.data.preview);
      }
    });

    return inputData;
  }

  private getOutputData(results: NodeResult[]): any {
    const outputNodes = results.filter(r =>
      r.node.type === 'output' || r.node.type === 'export'
    );

    if (outputNodes.length === 1) {
      return outputNodes[0].data;
    }

    return outputNodes.reduce((output, result) => {
      output[result.nodeId] = result.data;
      return output;
    }, {} as any);
  }

  private updateNodeMetrics(node: PipelineNode, data: any, executionTime: number): void {
    if (!node.metrics) {
      node.metrics = {
        processedRecords: 0,
        errorCount: 0,
        executionTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        lastRun: new Date(),
        successRate: 0,
        throughput: 0,
        avgProcessingTime: 0,
        peakMemoryUsage: 0
      };
    }

    const recordCount = Array.isArray(data) ? data.length : 1;
    node.metrics.processedRecords += recordCount;
    node.metrics.executionTime = executionTime;
    node.metrics.lastRun = new Date();
    node.metrics.throughput = recordCount / (executionTime / 1000); // records per second
    node.metrics.avgProcessingTime = (node.metrics.avgProcessingTime + executionTime) / 2;

    // Update success rate
    const totalRuns = this.executionContext.getNodeRunCount(node.id) || 1;
    const successRuns = totalRuns - node.metrics.errorCount;
    node.metrics.successRate = successRuns / totalRuns;
  }

  private hasCycles(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycleDFS = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = this.pipeline.connections
        .filter(conn => conn.sourceNodeId === nodeId)
        .map(conn => conn.targetNodeId);

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycleDFS(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of this.pipeline.nodes) {
      if (!visited.has(node.id)) {
        if (hasCycleDFS(node.id)) return true;
      }
    }

    return false;
  }
}

// Supporting interfaces and classes
export interface AggregationRule {
  field: string;
  operation: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'first' | 'last';
  alias?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PipelineResult {
  status: 'success' | 'error';
  results?: NodeResult[];
  error?: string;
  metrics: PipelineMetrics;
  output?: any;
}

export interface NodeResult {
  nodeId: string;
  node: PipelineNode;
  status: 'success' | 'error';
  data?: any;
  error?: string;
  executionTime: number;
  recordsProcessed: number;
}

export class PipelineMetrics {
  startTime!: Date;
  endTime!: Date;
  totalExecutionTime!: number;
  nodesExecuted = 0;
  recordsProcessed = 0;
  errorsCount = 0;
  memoryUsage = 0;
  cpuUsage = 0;
}

export class ExecutionContext {
  private nodeRunCounts: Map<string, number> = new Map();
  private variables: Map<string, any> = new Map();

  getNodeRunCount(nodeId: string): number {
    return this.nodeRunCounts.get(nodeId) || 0;
  }

  incrementNodeRunCount(nodeId: string): void {
    const current = this.nodeRunCounts.get(nodeId) || 0;
    this.nodeRunCounts.set(nodeId, current + 1);
  }

  setVariable(key: string, value: any): void {
    this.variables.set(key, value);
  }

  getVariable(key: string): any {
    return this.variables.get(key);
  }
}

// Export utilities
export const PipelineUtils = {
  // Generate sample data for testing
  generateSampleData: (count = 100): any[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `Sample Record ${i + 1}`,
      email: `user${i + 1}@example.com`,
      status: Math.random() > 0.5 ? 'active' : 'inactive',
      value: Math.round(Math.random() * 1000),
      created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      tags: ['tag1', 'tag2', 'tag3'].slice(0, Math.floor(Math.random() * 3) + 1)
    }));
  },

  // Export data to various formats
  exportData: (data: any[], format: OutputFormat): string => {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        if (data.length === 0) return '';
        const headers = Object.keys(data[0]);
        const csvRows = [
          headers.join(','),
          ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
        ];
        return csvRows.join('\n');
      case 'xml':
        const xmlRows = data.map(row => {
          const fields = Object.entries(row)
            .map(([key, value]) => `<${key}>${value}</${key}>`)
            .join('');
          return `<record>${fields}</record>`;
        });
        return `<?xml version="1.0" encoding="UTF-8"?><data>${xmlRows.join('')}</data>`;
      default:
        return JSON.stringify(data, null, 2);
    }
  },

  // Validate pipeline schema
  validatePipelineSchema: (pipeline: Pipeline): ValidationResult => {
    const errors: string[] = [];

    if (!pipeline.name || pipeline.name.trim().length === 0) {
      errors.push('Pipeline name is required');
    }

    if (pipeline.nodes.length === 0) {
      errors.push('Pipeline must contain at least one node');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Zod schemas for validation
export const NodeConfigSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  parallelExecution: z.boolean().default(false),
  retryCount: z.number().min(0).max(10).default(0),
  timeout: z.number().min(0).default(30000)
});

export const PipelineSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  nodes: z.array(z.any()),
  connections: z.array(z.any()),
  config: z.any(),
  status: z.enum(['draft', 'running', 'completed', 'failed', 'paused', 'scheduled']),
  created: z.date(),
  updated: z.date(),
  version: z.number().min(1),
  tags: z.array(z.string())
});
