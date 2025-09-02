import { v4 as uuidv4 } from 'uuid';

// Core interfaces for the visual pipeline editor
export interface PipelineNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  status: 'idle' | 'running' | 'success' | 'error';
  error?: string;
  executionTime?: number;
  lastExecuted?: Date;
}

export interface NodeConnection {
  id: string;
  sourceNodeId: string;
  sourceOutputId: string;
  targetNodeId: string;
  targetInputId: string;
  dataType: DataType;
}

export interface PipelineDefinition {
  id: string;
  name: string;
  description: string;
  nodes: PipelineNode[];
  connections: NodeConnection[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
  metadata: PipelineMetadata;
}

export interface NodeData {
  [key: string]: any;
  config?: NodeConfiguration;
  preview?: DataPreview;
  validation?: ValidationResult;
}

export interface NodeInput {
  id: string;
  name: string;
  type: DataType;
  required: boolean;
  connected: boolean;
  value?: any;
}

export interface NodeOutput {
  id: string;
  name: string;
  type: DataType;
  value?: any;
  schema?: DataSchema;
}

export type NodeType =
  | 'input' | 'output' | 'extract' | 'transform' | 'filter' | 'validate'
  | 'enrich' | 'aggregate' | 'join' | 'split' | 'custom' | 'ai-transform';

export type DataType =
  | 'text' | 'number' | 'boolean' | 'date' | 'url' | 'email' | 'json'
  | 'array' | 'object' | 'image' | 'file' | 'html' | 'csv' | 'xml';

export interface DataSchema {
  type: DataType;
  properties?: { [key: string]: DataSchema };
  items?: DataSchema;
  format?: string;
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'pattern' | 'length' | 'range' | 'custom';
  value?: any;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface DataPreview {
  sample: any[];
  schema: DataSchema;
  rowCount: number;
  columns: ColumnInfo[];
  quality: DataQuality;
}

export interface ColumnInfo {
  name: string;
  type: DataType;
  nullable: boolean;
  uniqueValues: number;
  distribution?: any;
}

export interface DataQuality {
  completeness: number;
  validity: number;
  consistency: number;
  accuracy: number;
  overall: number;
}

export interface NodeConfiguration {
  [key: string]: any;
}

export interface PipelineMetadata {
  tags: string[];
  category: string;
  isTemplate: boolean;
  sharedWith: string[];
  performance: PipelinePerformance;
}

export interface PipelinePerformance {
  avgExecutionTime: number;
  successRate: number;
  totalExecutions: number;
  lastExecution: Date;
  dataProcessed: number;
}

export interface ExecutionContext {
  pipelineId: string;
  executionId: string;
  startTime: Date;
  parameters: { [key: string]: any };
  dataVolume: number;
  performance: ExecutionMetrics;
}

export interface ExecutionMetrics {
  nodesExecuted: number;
  totalTime: number;
  memoryUsed: number;
  rowsProcessed: number;
  errors: number;
  warnings: number;
}

export class VisualPipelineEngine {
  private pipelines: Map<string, PipelineDefinition> = new Map();
  private nodeTypes: Map<NodeType, NodeTypeDefinition> = new Map();
  private executionQueue: ExecutionContext[] = [];
  private isExecuting = false;

  constructor() {
    this.initializeNodeTypes();
  }

  // Pipeline management
  createPipeline(name: string, description: string): PipelineDefinition {
    const pipeline: PipelineDefinition = {
      id: uuidv4(),
      name,
      description,
      nodes: [],
      connections: [],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        tags: [],
        category: 'general',
        isTemplate: false,
        sharedWith: [],
        performance: {
          avgExecutionTime: 0,
          successRate: 0,
          totalExecutions: 0,
          lastExecution: new Date(),
          dataProcessed: 0
        }
      }
    };

    this.pipelines.set(pipeline.id, pipeline);
    return pipeline;
  }

  getPipeline(id: string): PipelineDefinition | null {
    return this.pipelines.get(id) || null;
  }

  updatePipeline(id: string, updates: Partial<PipelineDefinition>): boolean {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) return false;

    const updated = { ...pipeline, ...updates, updatedAt: new Date() };
    this.pipelines.set(id, updated);
    return true;
  }

  deletePipeline(id: string): boolean {
    return this.pipelines.delete(id);
  }

  // Node management
  addNode(pipelineId: string, type: NodeType, position: { x: number; y: number }): PipelineNode | null {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return null;

    const nodeTypeDef = this.nodeTypes.get(type);
    if (!nodeTypeDef) return null;

    const node: PipelineNode = {
      id: uuidv4(),
      type,
      position,
      data: { config: nodeTypeDef.defaultConfig },
      inputs: nodeTypeDef.inputs.map(input => ({ ...input, connected: false })),
      outputs: nodeTypeDef.outputs.map(output => ({ ...output })),
      status: 'idle'
    };

    pipeline.nodes.push(node);
    pipeline.updatedAt = new Date();
    return node;
  }

  updateNode(pipelineId: string, nodeId: string, updates: Partial<PipelineNode>): boolean {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return false;

    const nodeIndex = pipeline.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return false;

    pipeline.nodes[nodeIndex] = { ...pipeline.nodes[nodeIndex], ...updates };
    pipeline.updatedAt = new Date();
    return true;
  }

  removeNode(pipelineId: string, nodeId: string): boolean {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return false;

    // Remove node
    pipeline.nodes = pipeline.nodes.filter(n => n.id !== nodeId);

    // Remove related connections
    pipeline.connections = pipeline.connections.filter(
      c => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
    );

    pipeline.updatedAt = new Date();
    return true;
  }

  // Connection management
  addConnection(
    pipelineId: string,
    sourceNodeId: string,
    sourceOutputId: string,
    targetNodeId: string,
    targetInputId: string
  ): NodeConnection | null {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return null;

    const sourceNode = pipeline.nodes.find(n => n.id === sourceNodeId);
    const targetNode = pipeline.nodes.find(n => n.id === targetNodeId);

    if (!sourceNode || !targetNode) return null;

    const sourceOutput = sourceNode.outputs.find(o => o.id === sourceOutputId);
    const targetInput = targetNode.inputs.find(i => i.id === targetInputId);

    if (!sourceOutput || !targetInput) return null;

    // Check data type compatibility
    if (!this.areTypesCompatible(sourceOutput.type, targetInput.type)) {
      throw new Error(`Incompatible data types: ${sourceOutput.type} -> ${targetInput.type}`);
    }

    const connection: NodeConnection = {
      id: uuidv4(),
      sourceNodeId,
      sourceOutputId,
      targetNodeId,
      targetInputId,
      dataType: sourceOutput.type
    };

    pipeline.connections.push(connection);

    // Update input connection status
    targetInput.connected = true;

    pipeline.updatedAt = new Date();
    return connection;
  }

  removeConnection(pipelineId: string, connectionId: string): boolean {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return false;

    const connection = pipeline.connections.find(c => c.id === connectionId);
    if (!connection) return false;

    // Update input connection status
    const targetNode = pipeline.nodes.find(n => n.id === connection.targetNodeId);
    if (targetNode) {
      const targetInput = targetNode.inputs.find(i => i.id === connection.targetInputId);
      if (targetInput) {
        targetInput.connected = false;
      }
    }

    pipeline.connections = pipeline.connections.filter(c => c.id !== connectionId);
    pipeline.updatedAt = new Date();
    return true;
  }

  // Pipeline execution
  async executePipeline(pipelineId: string, parameters: { [key: string]: any } = {}): Promise<ExecutionContext> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) throw new Error('Pipeline not found');

    const executionContext: ExecutionContext = {
      pipelineId,
      executionId: uuidv4(),
      startTime: new Date(),
      parameters,
      dataVolume: 0,
      performance: {
        nodesExecuted: 0,
        totalTime: 0,
        memoryUsed: 0,
        rowsProcessed: 0,
        errors: 0,
        warnings: 0
      }
    };

    this.executionQueue.push(executionContext);

    if (!this.isExecuting) {
      this.processExecutionQueue();
    }

    return executionContext;
  }

  private async processExecutionQueue(): Promise<void> {
    this.isExecuting = true;

    while (this.executionQueue.length > 0) {
      const context = this.executionQueue.shift()!;
      await this.executeContext(context);
    }

    this.isExecuting = false;
  }

  private async executeContext(context: ExecutionContext): Promise<void> {
    const pipeline = this.pipelines.get(context.pipelineId);
    if (!pipeline) return;

    try {
      // Build execution graph
      const executionGraph = this.buildExecutionGraph(pipeline);

      // Execute nodes in topological order
      for (const nodeId of executionGraph.executionOrder) {
        const node = pipeline.nodes.find(n => n.id === nodeId);
        if (!node) continue;

        await this.executeNode(node, pipeline, context);
        context.performance.nodesExecuted++;
      }

      // Update pipeline performance metrics
      this.updatePipelinePerformance(pipeline, context);

    } catch (error) {
      console.error('Pipeline execution failed:', error);
      context.performance.errors++;
    }
  }

  private async executeNode(
    node: PipelineNode,
    pipeline: PipelineDefinition,
    context: ExecutionContext
  ): Promise<void> {
    const startTime = Date.now();
    node.status = 'running';

    try {
      const nodeExecutor = this.getNodeExecutor(node.type);
      if (!nodeExecutor) {
        throw new Error(`No executor found for node type: ${node.type}`);
      }

      // Prepare input data
      const inputData = this.prepareNodeInputData(node, pipeline);

      // Execute node
      if (!node.data.config) {
        throw new Error(`Node ${node.id} has no configuration`);
      }
      const result = await nodeExecutor.execute(node.data.config, inputData, context);

      // Update node outputs
      node.outputs.forEach((output, index) => {
        output.value = result.outputs[index];
        output.schema = result.schemas[index];
      });

      // Update node data with preview and validation
      node.data.preview = result.preview;
      node.data.validation = result.validation;

      node.status = 'success';
      node.executionTime = Date.now() - startTime;
      node.lastExecuted = new Date();

      context.performance.rowsProcessed += result.preview?.rowCount || 0;

    } catch (error) {
      node.status = 'error';
      node.error = error instanceof Error ? error.message : 'Unknown error';
      context.performance.errors++;
    }
  }

  private prepareNodeInputData(node: PipelineNode, pipeline: PipelineDefinition): any[] {
    const inputData: any[] = [];

    node.inputs.forEach(input => {
      if (input.connected) {
        const connection = pipeline.connections.find(
          c => c.targetNodeId === node.id && c.targetInputId === input.id
        );

        if (connection) {
          const sourceNode = pipeline.nodes.find(n => n.id === connection.sourceNodeId);
          const sourceOutput = sourceNode?.outputs.find(o => o.id === connection.sourceOutputId);

          if (sourceOutput?.value !== undefined) {
            inputData.push(sourceOutput.value);
          }
        }
      } else if (input.value !== undefined) {
        inputData.push(input.value);
      }
    });

    return inputData;
  }

  private buildExecutionGraph(pipeline: PipelineDefinition): ExecutionGraph {
    const graph: ExecutionGraph = {
      nodes: new Map(),
      executionOrder: []
    };

    // Build dependency graph
    pipeline.nodes.forEach(node => {
      graph.nodes.set(node.id, {
        id: node.id,
        dependencies: [],
        dependents: []
      });
    });

    pipeline.connections.forEach(connection => {
      const sourceNode = graph.nodes.get(connection.sourceNodeId);
      const targetNode = graph.nodes.get(connection.targetNodeId);

      if (sourceNode && targetNode) {
        targetNode.dependencies.push(sourceNode.id);
        sourceNode.dependents.push(targetNode.id);
      }
    });

    // Topological sort
    graph.executionOrder = this.topologicalSort(graph);

    return graph;
  }

  private topologicalSort(graph: ExecutionGraph): string[] {
    const visited = new Set<string>();
    const tempMark = new Set<string>();
    const result: string[] = [];

    const visit = (nodeId: string) => {
      if (tempMark.has(nodeId)) {
        throw new Error('Circular dependency detected in pipeline');
      }

      if (!visited.has(nodeId)) {
        tempMark.add(nodeId);

        const node = graph.nodes.get(nodeId);
        if (node) {
          node.dependencies.forEach(depId => visit(depId));
        }

        tempMark.delete(nodeId);
        visited.add(nodeId);
        result.unshift(nodeId);
      }
    };

    graph.nodes.forEach((_, nodeId) => {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    });

    return result;
  }

  private areTypesCompatible(sourceType: DataType, targetType: DataType): boolean {
    // Same type is always compatible
    if (sourceType === targetType) return true;

    // Define compatibility matrix
    const compatibilityMap: { [key: string]: DataType[] } = {
      text: ['text', 'html', 'url', 'email'],
      number: ['number', 'text'],
      boolean: ['boolean', 'text'],
      date: ['date', 'text'],
      url: ['url', 'text'],
      email: ['email', 'text'],
      json: ['json', 'object', 'text'],
      array: ['array', 'json', 'text'],
      object: ['object', 'json', 'text'],
      html: ['html', 'text'],
      csv: ['csv', 'text'],
      xml: ['xml', 'text']
    };

    const compatibleTypes = compatibilityMap[sourceType] || [];
    return compatibleTypes.includes(targetType);
  }

  private updatePipelinePerformance(pipeline: PipelineDefinition, context: ExecutionContext): void {
    const executionTime = Date.now() - context.startTime.getTime();
    const performance = pipeline.metadata.performance;

    performance.totalExecutions++;
    performance.avgExecutionTime =
      (performance.avgExecutionTime * (performance.totalExecutions - 1) + executionTime) /
      performance.totalExecutions;
    performance.successRate =
      ((performance.successRate * (performance.totalExecutions - 1)) +
      (context.performance.errors === 0 ? 1 : 0)) / performance.totalExecutions;
    performance.lastExecution = new Date();
    performance.dataProcessed += context.performance.rowsProcessed;
  }

  private getNodeExecutor(type: NodeType): NodeExecutor | null {
    // Return appropriate executor based on node type
    // This would be implemented with actual node execution logic
    return new GenericNodeExecutor();
  }

  private initializeNodeTypes(): void {
    // Initialize all available node types with their definitions
    this.registerDefaultNodeTypes();
  }

  private registerDefaultNodeTypes(): void {
    // Input nodes
    this.nodeTypes.set('input', {
      name: 'Data Input',
      category: 'input',
      description: 'Input data source',
      inputs: [],
      outputs: [{ id: 'data', name: 'Data', type: 'object' }],
      defaultConfig: { source: 'file', format: 'json' }
    });

    // Transform nodes
    this.nodeTypes.set('transform', {
      name: 'Transform',
      category: 'transform',
      description: 'Transform data',
      inputs: [{ id: 'input', name: 'Input', type: 'object', required: true, connected: false }],
      outputs: [{ id: 'output', name: 'Output', type: 'object' }],
      defaultConfig: { transformation: 'map' }
    });

    // Filter nodes
    this.nodeTypes.set('filter', {
      name: 'Filter',
      category: 'filter',
      description: 'Filter data based on conditions',
      inputs: [{ id: 'input', name: 'Input', type: 'array', required: true, connected: false }],
      outputs: [{ id: 'output', name: 'Output', type: 'array' }],
      defaultConfig: { condition: 'value > 0' }
    });

    // Output nodes
    this.nodeTypes.set('output', {
      name: 'Data Output',
      category: 'output',
      description: 'Output data destination',
      inputs: [{ id: 'input', name: 'Input', type: 'object', required: true, connected: false }],
      outputs: [],
      defaultConfig: { format: 'json', destination: 'file' }
    });
  }

  // Utility methods
  exportPipeline(pipelineId: string): string | null {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return null;

    return JSON.stringify(pipeline, null, 2);
  }

  importPipeline(pipelineData: string): PipelineDefinition | null {
    try {
      const pipeline = JSON.parse(pipelineData) as PipelineDefinition;
      pipeline.id = uuidv4(); // Generate new ID
      pipeline.createdAt = new Date();
      pipeline.updatedAt = new Date();

      this.pipelines.set(pipeline.id, pipeline);
      return pipeline;
    } catch (error) {
      console.error('Failed to import pipeline:', error);
      return null;
    }
  }

  validatePipeline(pipelineId: string): ValidationResult {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      return {
        isValid: false,
        errors: [{ field: 'pipeline', message: 'Pipeline not found', severity: 'error' }],
        warnings: [],
        score: 0
      };
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for disconnected nodes
    const connectedNodes = new Set<string>();
    pipeline.connections.forEach(conn => {
      connectedNodes.add(conn.sourceNodeId);
      connectedNodes.add(conn.targetNodeId);
    });

    pipeline.nodes.forEach(node => {
      if (!connectedNodes.has(node.id) && node.type !== 'input' && node.type !== 'output') {
        warnings.push({
          field: `node.${node.id}`,
          message: 'Node is not connected to any other nodes',
          suggestion: 'Connect this node to make it part of the pipeline flow'
        });
      }
    });

    // Check for required inputs
    pipeline.nodes.forEach(node => {
      node.inputs.forEach(input => {
        if (input.required && !input.connected && input.value === undefined) {
          errors.push({
            field: `node.${node.id}.input.${input.id}`,
            message: `Required input '${input.name}' is not connected or configured`,
            severity: 'error'
          });
        }
      });
    });

    const isValid = errors.length === 0;
    const score = Math.max(0, 100 - (errors.length * 20 + warnings.length * 5));

    return { isValid, errors, warnings, score };
  }
}

// Supporting interfaces and classes
interface NodeTypeDefinition {
  name: string;
  category: string;
  description: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  defaultConfig: NodeConfiguration;
}

interface ExecutionGraph {
  nodes: Map<string, GraphNode>;
  executionOrder: string[];
}

interface GraphNode {
  id: string;
  dependencies: string[];
  dependents: string[];
}

export interface NodeExecutor {
  execute(
    config: NodeConfiguration,
    inputs: any[],
    context: ExecutionContext
  ): Promise<NodeExecutionResult>;
}

export interface NodeExecutionResult {
  outputs: any[];
  schemas: DataSchema[];
  preview: DataPreview;
  validation: ValidationResult;
}

class GenericNodeExecutor implements NodeExecutor {
  async execute(
    config: NodeConfiguration,
    inputs: any[],
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    // Generic execution logic - would be specialized per node type
    return {
      outputs: inputs,
      schemas: [{ type: 'object' }],
      preview: {
        sample: inputs.slice(0, 10),
        schema: { type: 'object' },
        rowCount: inputs.length,
        columns: [],
        quality: {
          completeness: 100,
          validity: 100,
          consistency: 100,
          accuracy: 100,
          overall: 100
        }
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
        score: 100
      }
    };
  }
}

// Export the main engine instance
export const visualPipelineEngine = new VisualPipelineEngine();
