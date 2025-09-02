'use client';

import type React from 'react';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  Panel,
  NodeToolbar,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Play,
  Pause,
  Save,
  Settings,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Filter,
  Layers3,
  Database,
  FileText,
  Code,
  Layers,
  ArrowRight,
  Circle,
  Square,
  GitBranch,
  Merge,
  RotateCcw,
  Brain,
  Webhook,
  Target,
  PieChart,
  BarChart3,
  TrendingUp,
  Activity,
  BookOpen,
  Sparkles
} from 'lucide-react';
import TemplateBrowser from './template-browser';
import type { PipelineTemplate } from '@/lib/pipeline/templates';

// Enhanced Pipeline Node Types
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

// Custom Node Components
const CustomNode = ({ data, selected }: { data: PipelineNodeData; selected: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(!data.isCollapsed);

  const getNodeIcon = (type: NodeType) => {
    const iconMap = {
      input: Database,
      output: Target,
      filter: Filter,
      transform: Zap,
      validate: CheckCircle,
      enrich: Plus,
      split: GitBranch,
      merge: Merge,
      aggregate: PieChart,
      sort: BarChart3,
      dedup: RotateCcw,
      javascript: Code,
      'ai-transform': Brain,
      webhook: Webhook,
      format: FileText,
      export: Download,
      'api-call': Activity,
      database: Database
    };
    return iconMap[type] || Circle;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      idle: 'bg-gray-100 border-gray-300',
      running: 'bg-blue-100 border-blue-300',
      success: 'bg-green-100 border-green-300',
      error: 'bg-red-100 border-red-300',
      warning: 'bg-yellow-100 border-yellow-300'
    };
    return colorMap[status as keyof typeof colorMap] || colorMap.idle;
  };

  const Icon = getNodeIcon(data.type);

  return (
    <div className={`
      min-w-48 rounded-lg border-2 shadow-lg bg-white transition-all duration-200
      ${getStatusColor(data.status)}
      ${selected ? 'ring-2 ring-blue-400' : ''}
      ${isExpanded ? 'min-h-32' : 'h-16'}
    `}>
      {/* Node Header */}
      <div className="flex items-center justify-between p-3 cursor-pointer"
           onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="font-medium text-sm">{data.label}</span>
        </div>
        <div className="flex items-center gap-1">
          {data.status === 'running' && (
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          )}
          {data.status === 'success' && (
            <CheckCircle className="w-3 h-3 text-green-500" />
          )}
          {data.status === 'error' && (
            <AlertTriangle className="w-3 h-3 text-red-500" />
          )}
        </div>
      </div>

      {/* Node Content (Expanded) */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            {data.type.replace('-', ' ')}
          </div>

          {data.metrics && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Records:</span>
                <span className="font-mono">{data.metrics.processedRecords.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Success:</span>
                <span className="font-mono">{(data.metrics.successRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span className="font-mono">{data.metrics.executionTime}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Errors:</span>
                <span className="font-mono text-red-500">{data.metrics.errorCount}</span>
              </div>
            </div>
          )}

          {data.preview && data.preview.length > 0 && (
            <div className="text-xs">
              <div className="text-gray-500 mb-1">Preview ({data.preview.length} records):</div>
              <div className="bg-gray-50 p-1 rounded text-xs font-mono max-h-20 overflow-y-auto">
                {JSON.stringify(data.preview[0], null, 1).substring(0, 100)}...
              </div>
            </div>
          )}
        </div>
      )}

      {/* Connection Handles */}
      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md" />
      <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md" />
    </div>
  );
};

// Node Palette Component
const NodePalette = ({ onAddNode }: { onAddNode: (type: NodeType) => void }) => {
  const nodeCategories = {
    'Data Sources': [
      { type: 'input' as NodeType, label: 'Data Input', icon: Database, description: 'Import data from various sources' },
      { type: 'api-call' as NodeType, label: 'API Call', icon: Activity, description: 'Fetch data from APIs' },
      { type: 'database' as NodeType, label: 'Database', icon: Database, description: 'Query database tables' }
    ],
    'Transformations': [
      { type: 'filter' as NodeType, label: 'Filter', icon: Filter, description: 'Filter data based on conditions' },
      { type: 'transform' as NodeType, label: 'Transform', icon: Zap, description: 'Transform data fields' },
      { type: 'enrich' as NodeType, label: 'Enrich', icon: Plus, description: 'Add additional data' },
      { type: 'javascript' as NodeType, label: 'JavaScript', icon: Code, description: 'Custom JavaScript code' },
      { type: 'ai-transform' as NodeType, label: 'AI Transform', icon: Brain, description: 'AI-powered transformations' }
    ],
    'Data Processing': [
      { type: 'validate' as NodeType, label: 'Validate', icon: CheckCircle, description: 'Validate data quality' },
      { type: 'split' as NodeType, label: 'Split', icon: GitBranch, description: 'Split data streams' },
      { type: 'merge' as NodeType, label: 'Merge', icon: Merge, description: 'Merge data streams' },
      { type: 'aggregate' as NodeType, label: 'Aggregate', icon: PieChart, description: 'Aggregate data' },
      { type: 'sort' as NodeType, label: 'Sort', icon: BarChart3, description: 'Sort data records' },
      { type: 'dedup' as NodeType, label: 'Deduplicate', icon: RotateCcw, description: 'Remove duplicates' }
    ],
    'Outputs': [
      { type: 'format' as NodeType, label: 'Format', icon: FileText, description: 'Format output data' },
      { type: 'export' as NodeType, label: 'Export', icon: Download, description: 'Export to files' },
      { type: 'webhook' as NodeType, label: 'Webhook', icon: Webhook, description: 'Send to webhook' },
      { type: 'output' as NodeType, label: 'Output', icon: Target, description: 'Final output destination' }
    ]
  };

  return (
    <Card className="w-80 h-full overflow-y-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Pipeline Nodes</CardTitle>
        <CardDescription>Drag nodes to the canvas to build your pipeline</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(nodeCategories).map(([category, nodes]) => (
          <div key={category}>
            <h4 className="font-medium text-sm text-gray-700 mb-2">{category}</h4>
            <div className="grid grid-cols-1 gap-2">
              {nodes.map((node) => {
                const Icon = node.icon;
                return (
                  <Button
                    key={node.type}
                    variant="outline"
                    className="flex items-start justify-start p-3 h-auto text-left hover:bg-blue-50"
                    onClick={() => onAddNode(node.type)}
                  >
                    <Icon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-sm">{node.label}</div>
                      <div className="text-xs text-gray-500">{node.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// Pipeline Configuration Panel
const PipelineConfigPanel = ({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
  pipelineData,
  onRunPipeline,
  onSavePipeline
}: {
  selectedNode: Node<PipelineNodeData> | null;
  onUpdateNode: (nodeId: string, data: Partial<PipelineNodeData>) => void;
  onDeleteNode: (nodeId: string) => void;
  pipelineData: any;
  onRunPipeline: () => void;
  onSavePipeline: () => void;
}) => {
  const [config, setConfig] = useState<NodeConfig>({});

  useEffect(() => {
    if (selectedNode) {
      setConfig(selectedNode.data.config || {});
    }
  }, [selectedNode]);

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    if (selectedNode) {
      onUpdateNode(selectedNode.id, { config: newConfig });
    }
  };

  if (!selectedNode) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-lg">Pipeline Controls</CardTitle>
          <CardDescription>Select a node to configure its properties</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={onRunPipeline} className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Run Pipeline
            </Button>
            <Button onClick={onSavePipeline} variant="outline" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save
            </Button>
          </div>

          {/* Pipeline Statistics */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Pipeline Statistics</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Total Nodes:</span>
                <span className="font-mono">{pipelineData.nodes?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Connections:</span>
                <span className="font-mono">{pipelineData.edges?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Export Pipeline</h4>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="w-3 h-3" />
                Export JSON
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Code className="w-3 h-3" />
                Generate Code
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80 h-full overflow-y-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{selectedNode.data.label}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteNode(selectedNode.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription>{selectedNode.data.type} node configuration</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="config" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="config">Config</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            {/* Node Label */}
            <div className="space-y-2">
              <Label htmlFor="label">Node Label</Label>
              <Input
                id="label"
                value={selectedNode.data.label}
                onChange={(e) => onUpdateNode(selectedNode.id, { label: e.target.value })}
              />
            </div>

            {/* Type-specific Configuration */}
            {selectedNode.data.type === 'filter' && (
              <div className="space-y-4">
                <Label>Filter Conditions</Label>
                <div className="space-y-2">
                  <Select value={config.filterField || ''} onValueChange={(value) => handleConfigChange('filterField', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={config.filterOperator || ''} onValueChange={(value) => handleConfigChange('filterOperator', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="startsWith">Starts With</SelectItem>
                      <SelectItem value="gt">Greater Than</SelectItem>
                      <SelectItem value="lt">Less Than</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Filter value"
                    value={config.filterValue || ''}
                    onChange={(e) => handleConfigChange('filterValue', e.target.value)}
                  />
                </div>
              </div>
            )}

            {selectedNode.data.type === 'transform' && (
              <div className="space-y-4">
                <Label>Transformations</Label>
                <Textarea
                  placeholder="Enter transformation rules (JSON format)"
                  value={config.transformRules || ''}
                  onChange={(e) => handleConfigChange('transformRules', e.target.value)}
                  rows={4}
                />
              </div>
            )}

            {selectedNode.data.type === 'javascript' && (
              <div className="space-y-4">
                <Label>JavaScript Code</Label>
                <Textarea
                  placeholder="// Custom JavaScript transformation
function transform(data) {
  // Transform your data here
  return data.map(item => ({
    ...item,
    // Add your transformations
  }));
}"
                  value={config.customCode || ''}
                  onChange={(e) => handleConfigChange('customCode', e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {selectedNode.data.type === 'export' && (
              <div className="space-y-4">
                <Label>Output Format</Label>
                <Select value={config.outputFormat || ''} onValueChange={(value) => handleConfigChange('outputFormat', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="parquet">Parquet</SelectItem>
                    <SelectItem value="sql">SQL</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                  </SelectContent>
                </Select>

                <div className="space-y-2">
                  <Label>File Name</Label>
                  <Input
                    placeholder="output"
                    value={config.fileName || ''}
                    onChange={(e) => handleConfigChange('fileName', e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.includeHeaders || false}
                    onCheckedChange={(checked) => handleConfigChange('includeHeaders', checked)}
                  />
                  <Label>Include Headers</Label>
                </div>
              </div>
            )}

            {selectedNode.data.type === 'validate' && (
              <div className="space-y-4">
                <Label>Validation Rules</Label>
                <div className="space-y-2">
                  <Select value={config.validationType || ''} onValueChange={(value) => handleConfigChange('validationType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Validation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="required">Required Field</SelectItem>
                      <SelectItem value="email">Email Format</SelectItem>
                      <SelectItem value="phone">Phone Number</SelectItem>
                      <SelectItem value="url">URL Format</SelectItem>
                      <SelectItem value="regex">Custom Regex</SelectItem>
                    </SelectContent>
                  </Select>

                  {config.validationType === 'regex' && (
                    <Input
                      placeholder="Regular expression pattern"
                      value={config.regexPattern || ''}
                      onChange={(e) => handleConfigChange('regexPattern', e.target.value)}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Common Configuration Options */}
            <Separator />

            <div className="flex items-center space-x-2">
              <Switch
                checked={config.enabled !== false}
                onCheckedChange={(checked) => handleConfigChange('enabled', checked)}
              />
              <Label>Node Enabled</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={config.parallelExecution || false}
                onCheckedChange={(checked) => handleConfigChange('parallelExecution', checked)}
              />
              <Label>Parallel Execution</Label>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-2">
              <Label>Data Preview</Label>
              {selectedNode.data.preview && selectedNode.data.preview.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">
                    Showing {Math.min(selectedNode.data.preview.length, 3)} of {selectedNode.data.preview.length} records
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(selectedNode.data.preview[0] || {}).map((key) => (
                            <TableHead key={key} className="text-xs">{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedNode.data.preview.slice(0, 3).map((record, index) => (
                          <TableRow key={index}>
                            {Object.values(record).map((value, valueIndex) => (
                              <TableCell key={valueIndex} className="text-xs font-mono">
                                {String(value).substring(0, 50)}{String(value).length > 50 ? '...' : ''}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 p-4 text-center border rounded-lg">
                  No preview data available. Run the pipeline to see results.
                </div>
              )}
            </div>

            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => {/* Refresh preview logic */}}
            >
              <Eye className="w-4 h-4 mr-2" />
              Refresh Preview
            </Button>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            {selectedNode.data.metrics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Records Processed</Label>
                    <div className="text-lg font-mono">{selectedNode.data.metrics.processedRecords.toLocaleString()}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Success Rate</Label>
                    <div className="text-lg font-mono">{(selectedNode.data.metrics.successRate * 100).toFixed(1)}%</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Execution Time</Label>
                    <div className="text-lg font-mono">{selectedNode.data.metrics.executionTime}ms</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Error Count</Label>
                    <div className="text-lg font-mono text-red-500">{selectedNode.data.metrics.errorCount}</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Performance</Label>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CPU Usage</span>
                      <span>{selectedNode.data.metrics.cpuUsage.toFixed(1)}%</span>
                    </div>
                    <Progress value={selectedNode.data.metrics.cpuUsage} className="h-2" />

                    <div className="flex justify-between text-sm">
                      <span>Memory Usage</span>
                      <span>{(selectedNode.data.metrics.memoryUsage / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                    <Progress value={(selectedNode.data.metrics.memoryUsage / 1024 / 1024 / 100) * 100} className="h-2" />
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Last run: {selectedNode.data.metrics.lastRun.toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 p-4 text-center border rounded-lg">
                No metrics available. Run this node to see performance data.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Main Visual Pipeline Editor Component
export default function VisualPipelineEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<PipelineNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node<PipelineNodeData> | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showNodePalette, setShowNodePalette] = useState(true);
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
  const [pipelineName, setPipelineName] = useState('Untitled Pipeline');

  const nodeTypes = useMemo(() => ({
    custom: CustomNode,
  }), []);

  // Add a new node to the pipeline
  const addNode = useCallback((type: NodeType) => {
    const newNode: Node<PipelineNodeData> = {
      id: `${type}-${Date.now()}`,
      type: 'custom',
      position: { x: Math.random() * 400, y: Math.random() * 300 },
      data: {
        id: `${type}-${Date.now()}`,
        type,
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        config: {},
        status: 'idle',
        isCollapsed: false
      }
    };

    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  // Load template into pipeline
  const loadTemplate = useCallback((template: PipelineTemplate) => {
    // Clear existing pipeline
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);

    // Load template nodes and edges
    setNodes(template.nodes as Node<PipelineNodeData>[]);
    setEdges(template.edges);
    setPipelineName(template.name);

    // Show success message (you could use a toast here)
    console.log(`Template "${template.name}" loaded successfully!`);
  }, [setNodes, setEdges]);

  // Create template from current pipeline
  const createTemplate = useCallback(() => {
    if (nodes.length === 0) {
      alert('Cannot create template from empty pipeline');
      return;
    }

    const templateData = {
      name: pipelineName,
      description: `Custom template created from ${pipelineName}`,
      category: 'general' as const,
      tags: ['custom', 'user-created'],
      difficulty: 'intermediate' as const,
      estimatedTime: '30 minutes',
      useCase: 'Custom data processing pipeline',
      nodes,
      edges,
      configuration: {
        schedule: 'manual',
        retryAttempts: 3,
        timeout: 30000
      },
      author: 'Custom User',
      version: '1.0.0',
      isPublic: false
    };

    // In a real app, this would save to the backend
    console.log('Template created:', templateData);
    alert('Template saved successfully!');
  }, [nodes, edges, pipelineName]);

  // Update node data
  const updateNode = useCallback((nodeId: string, data: Partial<PipelineNodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      )
    );
  }, [setNodes]);

  // Delete node
  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  // Handle edge connection
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle node selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<PipelineNodeData>) => {
    setSelectedNode(node);
  }, []);

  // Run pipeline simulation
  const runPipeline = useCallback(async () => {
    setIsRunning(true);

    // Simulate pipeline execution
    for (const node of nodes) {
      updateNode(node.id, {
        status: 'running',
        metrics: {
          processedRecords: Math.floor(Math.random() * 10000),
          errorCount: Math.floor(Math.random() * 10),
          executionTime: Math.floor(Math.random() * 1000),
          memoryUsage: Math.floor(Math.random() * 100 * 1024 * 1024),
          cpuUsage: Math.random() * 100,
          lastRun: new Date(),
          successRate: 0.85 + Math.random() * 0.15
        },
        preview: [
          { id: 1, name: 'Sample Data', email: 'test@example.com', status: 'active' },
          { id: 2, name: 'Test Record', email: 'test2@example.com', status: 'inactive' }
        ]
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      updateNode(node.id, {
        status: Math.random() > 0.1 ? 'success' : 'error'
      });
    }

    setIsRunning(false);
  }, [nodes, updateNode]);

  // Save pipeline
  const savePipeline = useCallback(() => {
    const pipelineData = {
      name: pipelineName,
      nodes,
      edges,
      created: new Date(),
      version: 1
    };

    // Save to localStorage for demo
    localStorage.setItem('pipeline', JSON.stringify(pipelineData));

    // In a real app, this would save to the backend
    console.log('Pipeline saved:', pipelineData);
  }, [pipelineName, nodes, edges]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Node Palette */}
      {showNodePalette && (
        <div className="border-r bg-white">
          <NodePalette onAddNode={addNode} />
        </div>
      )}

      {/* Main Pipeline Canvas */}
      <div className="flex-1 relative">
        <div className="absolute top-4 left-4 z-10 flex items-center gap-4">
          <Card className="px-4 py-2">
            <Input
              value={pipelineName}
              onChange={(e) => setPipelineName(e.target.value)}
              className="border-none bg-transparent text-lg font-semibold p-0 h-auto"
            />
          </Card>

          <div className="flex gap-2">
            <Button
              variant={showNodePalette ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowNodePalette(!showNodePalette)}
            >
              <Layers className="w-4 h-4 mr-2" />
              Nodes
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateBrowser(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Templates
            </Button>

            <Button
              onClick={runPipeline}
              disabled={isRunning}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Pipeline
                </>
              )}
            </Button>

            <Button onClick={savePipeline} size="sm" variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>

            <Button onClick={createTemplate} size="sm" variant="outline">
              <BookOpen className="w-4 h-4 mr-2" />
              Save as Template
            </Button>
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
        >
          <Background />
          <Controls />
          <MiniMap
            nodeColor="#e2e8f0"
            nodeStrokeWidth={2}
            className="bg-white border border-gray-200 rounded-lg"
          />
        </ReactFlow>
      </div>

      {/* Configuration Panel */}
      <div className="border-l bg-white">
        <PipelineConfigPanel
          selectedNode={selectedNode}
          onUpdateNode={updateNode}
          onDeleteNode={deleteNode}
          pipelineData={{ nodes, edges }}
          onRunPipeline={runPipeline}
          onSavePipeline={savePipeline}
        />
      </div>

      {/* Template Browser */}
      <TemplateBrowser
        isOpen={showTemplateBrowser}
        onClose={() => setShowTemplateBrowser(false)}
        onTemplateSelect={loadTemplate}
      />
    </div>
  );
}
