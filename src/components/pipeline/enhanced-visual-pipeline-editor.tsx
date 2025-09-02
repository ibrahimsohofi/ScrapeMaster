'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
  Handle,
  type NodeProps,
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
  Sparkles,
  Search,
  MapPin,
  Mail,
  Phone,
  Globe,
  Image,
  FileSpreadsheet,
  FileJson,
  FileX as FileXml,
  SplitSquareHorizontal,
  Merge as MergeIcon,
  SortAsc,
  Hash,
  Repeat,
  ChevronRight,
  ChevronDown,
  Monitor,
  Cpu,
  MemoryStick,
  Timer,
  Gauge,
  ZoomIn,
  ZoomOut,
  RotateCw as RotateClockwise,
  Building,
  Users,
  User,
  Heart,
  DollarSign,
  Key,
  Languages,
  Calculator,
  Minus,
  Dot as CircleDot,
  Share,
} from 'lucide-react';

// Enhanced Node Types with 40+ transformation options
export type EnhancedNodeType =
  // Input/Output
  | 'data-input' | 'web-scraper' | 'file-input' | 'api-input' | 'database-input'
  | 'csv-output' | 'excel-output' | 'json-output' | 'xml-output' | 'parquet-output'
  | 'avro-output' | 'orc-output' | 'sql-output' | 'api-output' | 'webhook-output'

  // Data Cleaning
  | 'clean-text' | 'remove-duplicates' | 'fill-missing' | 'normalize-data'
  | 'extract-urls' | 'extract-emails' | 'extract-phones' | 'clean-html'
  | 'remove-outliers' | 'standardize-formats' | 'trim-whitespace'

  // Data Transformation
  | 'map-fields' | 'split-column' | 'merge-columns' | 'pivot-data'
  | 'unpivot-data' | 'group-by' | 'sort-data' | 'filter-rows'
  | 'sample-data' | 'transpose' | 'calculate-field' | 'join-data'
  | 'union-data' | 'conditional-transform' | 'regex-replace'

  // Data Enrichment
  | 'geo-lookup' | 'domain-lookup' | 'company-lookup' | 'social-lookup'
  | 'email-verification' | 'phone-validation' | 'name-parsing'
  | 'address-parsing' | 'sentiment-analysis' | 'language-detection'
  | 'currency-conversion' | 'timezone-conversion' | 'hash-generate'

  // AI-Powered
  | 'ai-extraction' | 'text-classification' | 'entity-extraction'
  | 'keyword-extraction' | 'summarization' | 'translation'
  | 'image-ocr' | 'pdf-extraction' | 'content-generation'

  // Data Validation
  | 'validate-email' | 'validate-phone' | 'validate-url' | 'validate-json'
  | 'validate-schema' | 'validate-format' | 'data-quality-check'
  | 'check-duplicates' | 'validate-range' | 'validate-pattern'

  // External Services
  | 'webhook-call' | 'api-request' | 'database-lookup' | 'redis-cache'
  | 'elasticsearch-search' | 'google-search' | 'social-media-api'

  // Conditional Logic
  | 'if-then' | 'switch-case' | 'loop-over' | 'retry-logic'
  | 'error-handling' | 'parallel-processing' | 'rate-limiting'

  // Custom Processing
  | 'javascript-code' | 'python-code' | 'sql-query' | 'custom-function';

export interface EnhancedNodeData extends Record<string, unknown> {
  id: string;
  type: EnhancedNodeType;
  label: string;
  description?: string;
  category: NodeCategory;
  icon: string;
  color: string;
  config: any;
  status: 'idle' | 'running' | 'success' | 'error' | 'warning';
  metrics?: {
    processed: number;
    errors: number;
    duration: number;
    throughput: number;
    qualityScore: number;
  };
  preview?: {
    input: any[];
    output: any[];
    sample: any[];
    schema: any;
    stats: any;
  };
  isCollapsed?: boolean;
  validationErrors?: string[];
  performance?: {
    cpuUsage: number;
    memoryUsage: number;
    executionTime: number;
  };
}

export type NodeCategory =
  | 'input' | 'output' | 'cleaning' | 'transformation' | 'enrichment'
  | 'validation' | 'ai' | 'external' | 'logic' | 'custom';

// Node Categories Configuration
const NODE_CATEGORIES = {
  input: {
    label: 'Data Input',
    color: '#10b981',
    icon: Database,
    description: 'Data source connectors'
  },
  output: {
    label: 'Data Output',
    color: '#3b82f6',
    icon: Download,
    description: 'Export data to various formats'
  },
  cleaning: {
    label: 'Data Cleaning',
    color: '#f59e0b',
    icon: Sparkles,
    description: 'Clean and normalize data'
  },
  transformation: {
    label: 'Transformation',
    color: '#8b5cf6',
    icon: RotateClockwise,
    description: 'Transform and manipulate data'
  },
  enrichment: {
    label: 'Data Enrichment',
    color: '#06b6d4',
    icon: Target,
    description: 'Enhance data with external sources'
  },
  validation: {
    label: 'Data Validation',
    color: '#ef4444',
    icon: CheckCircle,
    description: 'Validate data quality and integrity'
  },
  ai: {
    label: 'AI Processing',
    color: '#ec4899',
    icon: Brain,
    description: 'AI-powered data processing'
  },
  external: {
    label: 'External Services',
    color: '#84cc16',
    icon: Webhook,
    description: 'External API and service integrations'
  },
  logic: {
    label: 'Control Flow',
    color: '#6366f1',
    icon: GitBranch,
    description: 'Conditional logic and flow control'
  },
  custom: {
    label: 'Custom Code',
    color: '#64748b',
    icon: Code,
    description: 'Custom scripts and functions'
  }
};

// Enhanced Node Definitions with detailed configurations
const ENHANCED_NODE_DEFINITIONS: Record<EnhancedNodeType, Partial<EnhancedNodeData>> = {
  // Input Nodes
  'data-input': {
    label: 'Data Input',
    description: 'Generic data input source',
    category: 'input',
    icon: 'Database',
    color: '#10b981'
  },
  'web-scraper': {
    label: 'Web Scraper',
    description: 'Scrape data from websites',
    category: 'input',
    icon: 'Globe',
    color: '#10b981'
  },
  'file-input': {
    label: 'File Input',
    description: 'Read data from files',
    category: 'input',
    icon: 'FileText',
    color: '#10b981'
  },
  'api-input': {
    label: 'API Input',
    description: 'Fetch data from REST APIs',
    category: 'input',
    icon: 'Webhook',
    color: '#10b981'
  },
  'database-input': {
    label: 'Database Input',
    description: 'Query data from databases',
    category: 'input',
    icon: 'Database',
    color: '#10b981'
  },

  // Output Nodes - Support 10+ formats
  'csv-output': {
    label: 'CSV Export',
    description: 'Export data as CSV file',
    category: 'output',
    icon: 'FileSpreadsheet',
    color: '#3b82f6'
  },
  'excel-output': {
    label: 'Excel Export',
    description: 'Export data as Excel workbook',
    category: 'output',
    icon: 'FileSpreadsheet',
    color: '#3b82f6'
  },
  'json-output': {
    label: 'JSON Export',
    description: 'Export data as JSON file',
    category: 'output',
    icon: 'FileJson',
    color: '#3b82f6'
  },
  'xml-output': {
    label: 'XML Export',
    description: 'Export data as XML file',
    category: 'output',
    icon: 'FileXml',
    color: '#3b82f6'
  },
  'parquet-output': {
    label: 'Parquet Export',
    description: 'Export data as Parquet file',
    category: 'output',
    icon: 'Database',
    color: '#3b82f6'
  },
  'avro-output': {
    label: 'Avro Export',
    description: 'Export data as Avro file',
    category: 'output',
    icon: 'Database',
    color: '#3b82f6'
  },
  'orc-output': {
    label: 'ORC Export',
    description: 'Export data as ORC file',
    category: 'output',
    icon: 'Database',
    color: '#3b82f6'
  },
  'sql-output': {
    label: 'SQL Insert',
    description: 'Insert data into database',
    category: 'output',
    icon: 'Database',
    color: '#3b82f6'
  },
  'api-output': {
    label: 'API Output',
    description: 'Send data to REST API',
    category: 'output',
    icon: 'Webhook',
    color: '#3b82f6'
  },
  'webhook-output': {
    label: 'Webhook',
    description: 'Send data via webhook',
    category: 'output',
    icon: 'Webhook',
    color: '#3b82f6'
  },

  // Data Cleaning Nodes
  'clean-text': {
    label: 'Clean Text',
    description: 'Clean and normalize text data',
    category: 'cleaning',
    icon: 'Sparkles',
    color: '#f59e0b'
  },
  'remove-duplicates': {
    label: 'Remove Duplicates',
    description: 'Remove duplicate records',
    category: 'cleaning',
    icon: 'Copy',
    color: '#f59e0b'
  },
  'fill-missing': {
    label: 'Fill Missing Values',
    description: 'Handle missing data',
    category: 'cleaning',
    icon: 'CircleDot',
    color: '#f59e0b'
  },
  'normalize-data': {
    label: 'Normalize Data',
    description: 'Standardize data formats',
    category: 'cleaning',
    icon: 'RotateClockwise',
    color: '#f59e0b'
  },
  'extract-urls': {
    label: 'Extract URLs',
    description: 'Extract URLs from text',
    category: 'cleaning',
    icon: 'Globe',
    color: '#f59e0b'
  },
  'extract-emails': {
    label: 'Extract Emails',
    description: 'Extract email addresses',
    category: 'cleaning',
    icon: 'Mail',
    color: '#f59e0b'
  },
  'extract-phones': {
    label: 'Extract Phones',
    description: 'Extract phone numbers',
    category: 'cleaning',
    icon: 'Phone',
    color: '#f59e0b'
  },
  'clean-html': {
    label: 'Clean HTML',
    description: 'Strip HTML tags and decode entities',
    category: 'cleaning',
    icon: 'Code',
    color: '#f59e0b'
  },
  'remove-outliers': {
    label: 'Remove Outliers',
    description: 'Detect and remove statistical outliers',
    category: 'cleaning',
    icon: 'Target',
    color: '#f59e0b'
  },
  'standardize-formats': {
    label: 'Standardize Formats',
    description: 'Standardize date, number, and text formats',
    category: 'cleaning',
    icon: 'RotateClockwise',
    color: '#f59e0b'
  },
  'trim-whitespace': {
    label: 'Trim Whitespace',
    description: 'Remove leading/trailing whitespace',
    category: 'cleaning',
    icon: 'Minus',
    color: '#f59e0b'
  },

  // Data Transformation Nodes
  'map-fields': {
    label: 'Map Fields',
    description: 'Map and rename fields',
    category: 'transformation',
    icon: 'ArrowRight',
    color: '#8b5cf6'
  },
  'split-column': {
    label: 'Split Column',
    description: 'Split column into multiple columns',
    category: 'transformation',
    icon: 'SplitSquareHorizontal',
    color: '#8b5cf6'
  },
  'merge-columns': {
    label: 'Merge Columns',
    description: 'Combine multiple columns',
    category: 'transformation',
    icon: 'Merge',
    color: '#8b5cf6'
  },
  'pivot-data': {
    label: 'Pivot Data',
    description: 'Pivot table transformation',
    category: 'transformation',
    icon: 'RotateClockwise',
    color: '#8b5cf6'
  },
  'unpivot-data': {
    label: 'Unpivot Data',
    description: 'Unpivot table transformation',
    category: 'transformation',
    icon: 'RotateCcw',
    color: '#8b5cf6'
  },
  'group-by': {
    label: 'Group By',
    description: 'Group and aggregate data',
    category: 'transformation',
    icon: 'Layers',
    color: '#8b5cf6'
  },
  'sort-data': {
    label: 'Sort Data',
    description: 'Sort data by columns',
    category: 'transformation',
    icon: 'SortAsc',
    color: '#8b5cf6'
  },
  'filter-rows': {
    label: 'Filter Rows',
    description: 'Filter data based on conditions',
    category: 'transformation',
    icon: 'Filter',
    color: '#8b5cf6'
  },
  'sample-data': {
    label: 'Sample Data',
    description: 'Take a sample of the data',
    category: 'transformation',
    icon: 'Zap',
    color: '#8b5cf6'
  },
  'transpose': {
    label: 'Transpose',
    description: 'Transpose rows and columns',
    category: 'transformation',
    icon: 'RotateClockwise',
    color: '#8b5cf6'
  },
  'calculate-field': {
    label: 'Calculate Field',
    description: 'Create calculated fields',
    category: 'transformation',
    icon: 'Calculator',
    color: '#8b5cf6'
  },
  'join-data': {
    label: 'Join Data',
    description: 'Join with external data',
    category: 'transformation',
    icon: 'GitBranch',
    color: '#8b5cf6'
  },
  'union-data': {
    label: 'Union Data',
    description: 'Combine multiple datasets',
    category: 'transformation',
    icon: 'Layers',
    color: '#8b5cf6'
  },
  'conditional-transform': {
    label: 'Conditional Transform',
    description: 'Apply conditional transformations',
    category: 'transformation',
    icon: 'GitBranch',
    color: '#8b5cf6'
  },
  'regex-replace': {
    label: 'Regex Replace',
    description: 'Find and replace using regex',
    category: 'transformation',
    icon: 'Search',
    color: '#8b5cf6'
  },

  // Data Enrichment Nodes
  'geo-lookup': {
    label: 'Geo Lookup',
    description: 'Enrich with geographic data',
    category: 'enrichment',
    icon: 'MapPin',
    color: '#06b6d4'
  },
  'domain-lookup': {
    label: 'Domain Lookup',
    description: 'Lookup domain information',
    category: 'enrichment',
    icon: 'Globe',
    color: '#06b6d4'
  },
  'company-lookup': {
    label: 'Company Lookup',
    description: 'Enrich with company data',
    category: 'enrichment',
    icon: 'Building',
    color: '#06b6d4'
  },
  'social-lookup': {
    label: 'Social Lookup',
    description: 'Find social media profiles',
    category: 'enrichment',
    icon: 'Users',
    color: '#06b6d4'
  },
  'email-verification': {
    label: 'Email Verification',
    description: 'Verify email addresses',
    category: 'enrichment',
    icon: 'Mail',
    color: '#06b6d4'
  },
  'phone-validation': {
    label: 'Phone Validation',
    description: 'Validate phone numbers',
    category: 'enrichment',
    icon: 'Phone',
    color: '#06b6d4'
  },
  'name-parsing': {
    label: 'Name Parsing',
    description: 'Parse full names into components',
    category: 'enrichment',
    icon: 'User',
    color: '#06b6d4'
  },
  'address-parsing': {
    label: 'Address Parsing',
    description: 'Parse addresses into components',
    category: 'enrichment',
    icon: 'MapPin',
    color: '#06b6d4'
  },
  'sentiment-analysis': {
    label: 'Sentiment Analysis',
    description: 'Analyze text sentiment',
    category: 'enrichment',
    icon: 'Heart',
    color: '#06b6d4'
  },
  'language-detection': {
    label: 'Language Detection',
    description: 'Detect text language',
    category: 'enrichment',
    icon: 'Globe',
    color: '#06b6d4'
  },
  'currency-conversion': {
    label: 'Currency Conversion',
    description: 'Convert between currencies',
    category: 'enrichment',
    icon: 'DollarSign',
    color: '#06b6d4'
  },
  'timezone-conversion': {
    label: 'Timezone Conversion',
    description: 'Convert between timezones',
    category: 'enrichment',
    icon: 'Clock',
    color: '#06b6d4'
  },
  'hash-generate': {
    label: 'Generate Hash',
    description: 'Generate hash values',
    category: 'enrichment',
    icon: 'Hash',
    color: '#06b6d4'
  },

  // AI-Powered Nodes
  'ai-extraction': {
    label: 'AI Extraction',
    description: 'Extract data using AI',
    category: 'ai',
    icon: 'Brain',
    color: '#ec4899'
  },
  'text-classification': {
    label: 'Text Classification',
    description: 'Classify text using AI',
    category: 'ai',
    icon: 'BookOpen',
    color: '#ec4899'
  },
  'entity-extraction': {
    label: 'Entity Extraction',
    description: 'Extract named entities',
    category: 'ai',
    icon: 'Target',
    color: '#ec4899'
  },
  'keyword-extraction': {
    label: 'Keyword Extraction',
    description: 'Extract keywords from text',
    category: 'ai',
    icon: 'Key',
    color: '#ec4899'
  },
  'summarization': {
    label: 'Text Summarization',
    description: 'Generate text summaries',
    category: 'ai',
    icon: 'FileText',
    color: '#ec4899'
  },
  'translation': {
    label: 'Translation',
    description: 'Translate text between languages',
    category: 'ai',
    icon: 'Languages',
    color: '#ec4899'
  },
  'image-ocr': {
    label: 'Image OCR',
    description: 'Extract text from images',
    category: 'ai',
    icon: 'Image',
    color: '#ec4899'
  },
  'pdf-extraction': {
    label: 'PDF Extraction',
    description: 'Extract data from PDF files',
    category: 'ai',
    icon: 'FileText',
    color: '#ec4899'
  },
  'content-generation': {
    label: 'Content Generation',
    description: 'Generate content using AI',
    category: 'ai',
    icon: 'Sparkles',
    color: '#ec4899'
  },

  // Data Validation Nodes
  'validate-email': {
    label: 'Validate Email',
    description: 'Validate email format',
    category: 'validation',
    icon: 'Mail',
    color: '#ef4444'
  },
  'validate-phone': {
    label: 'Validate Phone',
    description: 'Validate phone number format',
    category: 'validation',
    icon: 'Phone',
    color: '#ef4444'
  },
  'validate-url': {
    label: 'Validate URL',
    description: 'Validate URL format',
    category: 'validation',
    icon: 'Globe',
    color: '#ef4444'
  },
  'validate-json': {
    label: 'Validate JSON',
    description: 'Validate JSON structure',
    category: 'validation',
    icon: 'FileJson',
    color: '#ef4444'
  },
  'validate-schema': {
    label: 'Validate Schema',
    description: 'Validate against data schema',
    category: 'validation',
    icon: 'CheckCircle',
    color: '#ef4444'
  },
  'validate-format': {
    label: 'Validate Format',
    description: 'Validate data format',
    category: 'validation',
    icon: 'CheckCircle',
    color: '#ef4444'
  },
  'data-quality-check': {
    label: 'Data Quality Check',
    description: 'Comprehensive data quality analysis',
    category: 'validation',
    icon: 'BarChart3',
    color: '#ef4444'
  },
  'check-duplicates': {
    label: 'Check Duplicates',
    description: 'Detect duplicate records',
    category: 'validation',
    icon: 'Copy',
    color: '#ef4444'
  },
  'validate-range': {
    label: 'Validate Range',
    description: 'Validate numeric ranges',
    category: 'validation',
    icon: 'BarChart3',
    color: '#ef4444'
  },
  'validate-pattern': {
    label: 'Validate Pattern',
    description: 'Validate against regex patterns',
    category: 'validation',
    icon: 'Search',
    color: '#ef4444'
  },

  // External Service Nodes
  'webhook-call': {
    label: 'Webhook Call',
    description: 'Call external webhook',
    category: 'external',
    icon: 'Webhook',
    color: '#84cc16'
  },
  'api-request': {
    label: 'API Request',
    description: 'Make REST API request',
    category: 'external',
    icon: 'Globe',
    color: '#84cc16'
  },
  'database-lookup': {
    label: 'Database Lookup',
    description: 'Lookup data in database',
    category: 'external',
    icon: 'Database',
    color: '#84cc16'
  },
  'redis-cache': {
    label: 'Redis Cache',
    description: 'Cache/retrieve from Redis',
    category: 'external',
    icon: 'Database',
    color: '#84cc16'
  },
  'elasticsearch-search': {
    label: 'Elasticsearch Search',
    description: 'Search in Elasticsearch',
    category: 'external',
    icon: 'Search',
    color: '#84cc16'
  },
  'google-search': {
    label: 'Google Search',
    description: 'Search using Google API',
    category: 'external',
    icon: 'Search',
    color: '#84cc16'
  },
  'social-media-api': {
    label: 'Social Media API',
    description: 'Access social media APIs',
    category: 'external',
    icon: 'Share',
    color: '#84cc16'
  },

  // Conditional Logic Nodes
  'if-then': {
    label: 'If-Then',
    description: 'Conditional branching logic',
    category: 'logic',
    icon: 'GitBranch',
    color: '#6366f1'
  },
  'switch-case': {
    label: 'Switch Case',
    description: 'Multi-way conditional logic',
    category: 'logic',
    icon: 'GitBranch',
    color: '#6366f1'
  },
  'loop-over': {
    label: 'Loop Over',
    description: 'Iterate over data',
    category: 'logic',
    icon: 'Repeat',
    color: '#6366f1'
  },
  'retry-logic': {
    label: 'Retry Logic',
    description: 'Retry failed operations',
    category: 'logic',
    icon: 'RotateCcw',
    color: '#6366f1'
  },
  'error-handling': {
    label: 'Error Handling',
    description: 'Handle errors and exceptions',
    category: 'logic',
    icon: 'AlertTriangle',
    color: '#6366f1'
  },
  'parallel-processing': {
    label: 'Parallel Processing',
    description: 'Process data in parallel',
    category: 'logic',
    icon: 'Layers',
    color: '#6366f1'
  },
  'rate-limiting': {
    label: 'Rate Limiting',
    description: 'Control processing rate',
    category: 'logic',
    icon: 'Timer',
    color: '#6366f1'
  },

  // Custom Code Nodes
  'javascript-code': {
    label: 'JavaScript Code',
    description: 'Execute custom JavaScript',
    category: 'custom',
    icon: 'Code',
    color: '#64748b'
  },
  'python-code': {
    label: 'Python Code',
    description: 'Execute custom Python code',
    category: 'custom',
    icon: 'Code',
    color: '#64748b'
  },
  'sql-query': {
    label: 'SQL Query',
    description: 'Execute SQL queries',
    category: 'custom',
    icon: 'Database',
    color: '#64748b'
  },
  'custom-function': {
    label: 'Custom Function',
    description: 'Define custom functions',
    category: 'custom',
    icon: 'Zap',
    color: '#64748b'
  }
};

// Icon mapping for dynamic icon rendering
const Icons: Record<string, any> = {
  Database, Globe, FileText, Webhook, FileSpreadsheet, FileJson, FileXml,
  Sparkles, Copy, RotateClockwise, Mail, Phone, ArrowRight, SplitSquareHorizontal,
  MergeIcon, Layers, SortAsc, Filter, Zap, MapPin, Building, Users, User, Heart,
  DollarSign, Clock, Hash, Brain, BookOpen, Target, Key, Languages, Image,
  CheckCircle, BarChart3, Search, GitBranch, Repeat, RotateCcw, AlertTriangle,
  Code, Calculator, Minus, CircleDot, Share
};

// Custom Node Component with enhanced UI
const CustomNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as EnhancedNodeData;
  const [isExpanded, setIsExpanded] = useState(!nodeData.isCollapsed);
  const definition = ENHANCED_NODE_DEFINITIONS[nodeData.type];
  const category = NODE_CATEGORIES[nodeData.category];

  return (
    <div className={`relative bg-white border-2 rounded-lg shadow-lg min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-gray-200'
    } ${nodeData.status === 'error' ? 'border-red-500' : nodeData.status === 'success' ? 'border-green-500' : ''}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />

      {/* Node Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        style={{ backgroundColor: `${nodeData.color}20` }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-white text-sm"
            style={{ backgroundColor: nodeData.color }}
          >
            {React.createElement(
              Icons[nodeData.icon] || FileText,
              { size: 16 }
            )}
          </div>
          <div>
            <div className="font-medium text-sm">{nodeData.label}</div>
            <div className="text-xs text-gray-500">{category.label}</div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {/* Status Indicator */}
          <div className={`w-2 h-2 rounded-full ${
            nodeData.status === 'running' ? 'bg-blue-500 animate-pulse' :
            nodeData.status === 'success' ? 'bg-green-500' :
            nodeData.status === 'error' ? 'bg-red-500' :
            nodeData.status === 'warning' ? 'bg-yellow-500' :
            'bg-gray-300'
          }`} />

          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3 border-t">
          <div className="text-xs text-gray-600 mb-2">{definition.description}</div>

          {/* Metrics */}
          {nodeData.metrics && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="text-xs">
                <div className="text-gray-500">Processed</div>
                <div className="font-medium">{nodeData.metrics.processed.toLocaleString()}</div>
              </div>
              <div className="text-xs">
                <div className="text-gray-500">Errors</div>
                <div className="font-medium text-red-600">{nodeData.metrics.errors}</div>
              </div>
              {nodeData.metrics.qualityScore !== undefined && (
                <div className="text-xs col-span-2">
                  <div className="text-gray-500">Quality Score</div>
                  <div className="flex items-center space-x-2">
                    <Progress value={nodeData.metrics.qualityScore} className="h-2 flex-1" />
                    <span className="font-medium text-sm">{nodeData.metrics.qualityScore}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Performance Metrics */}
          {nodeData.performance && (
            <div className="space-y-1 mb-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-1">
                  <Cpu size={12} />
                  <span>CPU</span>
                </span>
                <span>{nodeData.performance.cpuUsage}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-1">
                  <MemoryStick size={12} />
                  <span>Memory</span>
                </span>
                <span>{(nodeData.performance.memoryUsage / 1024 / 1024).toFixed(1)}MB</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-1">
                  <Timer size={12} />
                  <span>Time</span>
                </span>
                <span>{nodeData.performance.executionTime}ms</span>
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {nodeData.validationErrors && nodeData.validationErrors.length > 0 && (
            <div className="text-xs text-red-600 space-y-1">
              {nodeData.validationErrors.map((error: string, index: number) => (
                <div key={index} className="flex items-center space-x-1">
                  <AlertTriangle size={12} />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex space-x-1 mt-2">
            <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
              <Settings size={12} />
            </Button>
            <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
              <Eye size={12} />
            </Button>
            <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
              <Copy size={12} />
            </Button>
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// Node Palette Component
const NodePalette: React.FC<{
  onAddNode: (type: EnhancedNodeType) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: NodeCategory | 'all';
  onCategoryChange: (category: NodeCategory | 'all') => void;
}> = ({ onAddNode, searchTerm, onSearchChange, selectedCategory, onCategoryChange }) => {
  const filteredNodes = useMemo(() => {
    return Object.entries(ENHANCED_NODE_DEFINITIONS).filter(([type, def]) => {
      const matchesSearch = !searchTerm ||
        def.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        def.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || def.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const groupedNodes = useMemo(() => {
    const groups: Record<NodeCategory, [string, Partial<EnhancedNodeData>][]> = {
      input: [], output: [], cleaning: [], transformation: [],
      enrichment: [], validation: [], ai: [], external: [], logic: [], custom: []
    };

    filteredNodes.forEach(([type, def]) => {
      if (def.category && groups[def.category]) {
        groups[def.category].push([type, def]);
      }
    });

    return groups;
  }, [filteredNodes]);

  return (
    <Card className="w-80 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Node Library</CardTitle>
        <div className="space-y-2">
          <Input
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8"
          />
          <Select value={selectedCategory} onValueChange={(value) => onCategoryChange(value as NodeCategory | 'all')}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(NODE_CATEGORIES).map(([key, category]) => (
                <SelectItem key={key} value={key}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
        {Object.entries(groupedNodes).map(([categoryKey, nodes]) => {
          if (nodes.length === 0) return null;

          const category = NODE_CATEGORIES[categoryKey as NodeCategory];

          return (
            <div key={categoryKey}>
              <div className="flex items-center space-x-2 mb-2">
                {React.createElement(category.icon, { size: 16, color: category.color })}
                <h3 className="font-medium text-sm">{category.label}</h3>
                <Badge variant="secondary" className="text-xs">{nodes.length}</Badge>
              </div>
              <div className="grid gap-2">
                {nodes.map(([type, def]) => (
                  <Button
                    key={type}
                    variant="outline"
                    className="h-auto p-2 justify-start text-left"
                    onClick={() => onAddNode(type as EnhancedNodeType)}
                  >
                    <div className="flex items-start space-x-2 w-full">
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: def.color }}
                      >
                        {React.createElement(
                          Icons[def.icon || 'FileText'] || FileText,
                          { size: 12 }
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{def.label}</div>
                        <div className="text-xs text-gray-500 truncate">{def.description}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

// Real-time Preview Panel
const PreviewPanel: React.FC<{
  selectedNode: Node<EnhancedNodeData> | null;
  pipelineData: any;
  isVisible: boolean;
  onToggle: () => void;
}> = ({ selectedNode, pipelineData, isVisible, onToggle }) => {
  const [previewTab, setPreviewTab] = useState('input');

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="fixed right-4 top-20 z-10"
      >
        <Eye size={16} />
        Preview
      </Button>
    );
  }

  return (
    <Card className="w-96 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Data Preview</CardTitle>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <Eye size={16} />
          </Button>
        </div>
        {selectedNode && (
          <div className="text-sm text-gray-600">
            {selectedNode.data.label}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedNode?.data.preview ? (
          <Tabs value={previewTab} onValueChange={setPreviewTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="input" className="text-xs">Input</TabsTrigger>
              <TabsTrigger value="output" className="text-xs">Output</TabsTrigger>
              <TabsTrigger value="schema" className="text-xs">Schema</TabsTrigger>
              <TabsTrigger value="stats" className="text-xs">Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="space-y-2">
              <div className="text-sm font-medium">Input Data Sample</div>
              <div className="max-h-64 overflow-auto border rounded p-2">
                <pre className="text-xs">
                  {JSON.stringify(selectedNode.data.preview.input?.slice(0, 5), null, 2)}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="output" className="space-y-2">
              <div className="text-sm font-medium">Output Data Sample</div>
              <div className="max-h-64 overflow-auto border rounded p-2">
                <pre className="text-xs">
                  {JSON.stringify(selectedNode.data.preview.output?.slice(0, 5), null, 2)}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="schema" className="space-y-2">
              <div className="text-sm font-medium">Data Schema</div>
              <div className="max-h-64 overflow-auto border rounded p-2">
                <pre className="text-xs">
                  {JSON.stringify(selectedNode.data.preview.schema, null, 2)}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-2">
              <div className="text-sm font-medium">Statistics</div>
              {selectedNode.data.preview.stats && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-gray-500">Rows</div>
                      <div className="font-medium">{selectedNode.data.preview.stats.rows?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Columns</div>
                      <div className="font-medium">{selectedNode.data.preview.stats.columns}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Size</div>
                      <div className="font-medium">{selectedNode.data.preview.stats.size}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Quality</div>
                      <div className="font-medium">{selectedNode.data.preview.stats.quality}%</div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Eye size={24} className="mx-auto mb-2 opacity-50" />
            <div className="text-sm">Select a node to preview data</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Performance Monitor Component
const PerformanceMonitor: React.FC<{
  pipelineMetrics: any;
  isVisible: boolean;
  onToggle: () => void;
}> = ({ pipelineMetrics, isVisible, onToggle }) => {
  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="fixed right-4 top-32 z-10"
      >
        <Activity size={16} />
        Monitor
      </Button>
    );
  }

  return (
    <Card className="w-80 h-64">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Performance</CardTitle>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <Activity size={16} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Gauge size={16} className="text-blue-600" />
              <span className="text-xs font-medium">Throughput</span>
            </div>
            <div className="text-lg font-bold text-blue-600">
              {pipelineMetrics?.throughput || 0}/sec
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Clock size={16} className="text-green-600" />
              <span className="text-xs font-medium">Latency</span>
            </div>
            <div className="text-lg font-bold text-green-600">
              {pipelineMetrics?.latency || 0}ms
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <AlertTriangle size={16} className="text-red-600" />
              <span className="text-xs font-medium">Errors</span>
            </div>
            <div className="text-lg font-bold text-red-600">
              {pipelineMetrics?.errors || 0}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-xs font-medium">Success</span>
            </div>
            <div className="text-lg font-bold text-green-600">
              {pipelineMetrics?.successRate || 0}%
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>CPU Usage</span>
            <span>{pipelineMetrics?.cpu || 0}%</span>
          </div>
          <Progress value={pipelineMetrics?.cpu || 0} className="h-2" />

          <div className="flex justify-between text-xs">
            <span>Memory Usage</span>
            <span>{pipelineMetrics?.memory || 0}%</span>
          </div>
          <Progress value={pipelineMetrics?.memory || 0} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

// Main Enhanced Pipeline Editor Component
const EnhancedVisualPipelineEditor: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<EnhancedNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node<EnhancedNodeData> | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NodeCategory | 'all'>('all');
  const [showPreview, setShowPreview] = useState(true);
  const [showMonitor, setShowMonitor] = useState(true);
  const [pipelineMetrics, setPipelineMetrics] = useState({
    throughput: 1250,
    latency: 45,
    errors: 3,
    successRate: 97.2,
    cpu: 35,
    memory: 68
  });

  // Generate unique node ID
  const generateNodeId = useCallback(() => {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add new node to the pipeline
  const addNode = useCallback((type: EnhancedNodeType) => {
    const nodeId = generateNodeId();
    const definition = ENHANCED_NODE_DEFINITIONS[type];

    const newNode: Node<EnhancedNodeData> = {
      id: nodeId,
      type: 'customNode',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100
      },
      data: {
        id: nodeId,
        type,
        label: definition.label || type,
        description: definition.description,
        category: definition.category || 'custom',
        icon: definition.icon || 'FileText',
        color: definition.color || '#64748b',
        config: {},
        status: 'idle',
        metrics: {
          processed: Math.floor(Math.random() * 10000),
          errors: Math.floor(Math.random() * 10),
          duration: Math.floor(Math.random() * 5000),
          throughput: Math.floor(Math.random() * 1000),
          qualityScore: Math.floor(Math.random() * 40) + 60
        },
        preview: {
          input: [
            { id: 1, name: 'Sample Data', value: 'Example' },
            { id: 2, name: 'Test Record', value: 'Demo' }
          ],
          output: [
            { id: 1, name: 'Processed Data', value: 'Transformed' },
            { id: 2, name: 'Clean Record', value: 'Result' }
          ],
          sample: [],
          schema: {
            fields: [
              { name: 'id', type: 'number' },
              { name: 'name', type: 'string' },
              { name: 'value', type: 'string' }
            ]
          },
          stats: {
            rows: Math.floor(Math.random() * 100000) + 1000,
            columns: Math.floor(Math.random() * 20) + 3,
            size: `${(Math.random() * 100).toFixed(1)}MB`,
            quality: Math.floor(Math.random() * 40) + 60
          }
        },
        performance: {
          cpuUsage: Math.floor(Math.random() * 50) + 10,
          memoryUsage: Math.floor(Math.random() * 100 * 1024 * 1024),
          executionTime: Math.floor(Math.random() * 1000) + 100
        }
      }
    };

    setNodes((nds) => [...nds, newNode]);
  }, [generateNodeId, setNodes]);

  // Handle node connection
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node as Node<EnhancedNodeData>);
  }, []);

  // Run pipeline simulation
  const runPipeline = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);

    // Simulate pipeline execution
    for (const node of nodes) {
      // Update node status to running
      setNodes((nds) =>
        nds.map((n) =>
          n.id === node.id
            ? { ...n, data: { ...n.data, status: 'running' } }
            : n
        )
      );

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update node status to success (simulate success)
      setNodes((nds) =>
        nds.map((n) =>
          n.id === node.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  status: Math.random() > 0.1 ? 'success' : 'error',
                  metrics: {
                    processed: n.data.metrics?.processed ? n.data.metrics.processed + Math.floor(Math.random() * 1000) : 1000,
                    errors: n.data.metrics?.errors || 0,
                    duration: n.data.metrics?.duration || 0,
                    throughput: n.data.metrics?.throughput || 0,
                    qualityScore: n.data.metrics?.qualityScore || 0
                  }
                }
              }
            : n
        )
      );
    }

    setIsRunning(false);
  }, [isRunning, nodes, setNodes]);

  // Export pipeline configuration
  const exportPipeline = useCallback(() => {
    const pipelineConfig = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.data.type,
        position: node.position,
        config: node.data.config
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target
      }))
    };

    const blob = new Blob([JSON.stringify(pipelineConfig, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pipeline-config.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  // Import pipeline configuration
  const importPipeline = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);

        // Rebuild nodes with full data
        const importedNodes: Node<EnhancedNodeData>[] = config.nodes.map((nodeConfig: any) => {
          const definition = ENHANCED_NODE_DEFINITIONS[nodeConfig.type as EnhancedNodeType] || ENHANCED_NODE_DEFINITIONS['data-input'];
          return {
            id: nodeConfig.id,
            type: 'customNode',
            position: nodeConfig.position,
            data: {
              id: nodeConfig.id,
              type: nodeConfig.type,
              label: definition.label || nodeConfig.type,
              description: definition.description,
              category: definition.category || 'custom',
              icon: definition.icon || 'FileText',
              color: definition.color || '#64748b',
              config: nodeConfig.config,
              status: 'idle'
            }
          };
        });

        setNodes(importedNodes);
        setEdges(config.edges);
      } catch (error) {
        console.error('Failed to import pipeline:', error);
      }
    };
    reader.readAsText(file);
  }, [setNodes, setEdges]);

  const nodeTypes = useMemo(() => ({
    customNode: CustomNode
  }), []);



  return (
    <div className="h-screen flex">
      {/* Node Palette */}
      <NodePalette
        onAddNode={addNode}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Main Pipeline Canvas */}
      <div className="flex-1 relative">
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
          <MiniMap className="bg-white" />

          {/* Pipeline Controls */}
          <Panel position="top-left" className="space-x-2">
            <Button
              onClick={runPipeline}
              disabled={isRunning}
              className="bg-green-600 hover:bg-green-700"
            >
              {isRunning ? (
                <>
                  <Pause size={16} className="mr-2" />
                  Running...
                </>
              ) : (
                <>
                  <Play size={16} className="mr-2" />
                  Run Pipeline
                </>
              )}
            </Button>

            <Button variant="outline" onClick={exportPipeline}>
              <Download size={16} className="mr-2" />
              Export
            </Button>

            <Button variant="outline" asChild>
              <label htmlFor="import-pipeline" className="cursor-pointer flex items-center">
                <Upload size={16} className="mr-2" />
                Import
                <input
                  id="import-pipeline"
                  type="file"
                  accept=".json"
                  onChange={importPipeline}
                  className="hidden"
                />
              </label>
            </Button>

            <Button variant="outline">
              <Save size={16} className="mr-2" />
              Save
            </Button>
          </Panel>

          {/* Pipeline Info */}
          <Panel position="top-right" className="bg-white p-3 rounded-lg shadow-lg">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Nodes:</span>
                <span className="font-medium">{nodes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Connections:</span>
                <span className="font-medium">{edges.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge variant={isRunning ? "default" : "secondary"}>
                  {isRunning ? "Running" : "Idle"}
                </Badge>
              </div>
            </div>
          </Panel>
        </ReactFlow>

        {/* Floating Panels */}
        <div className="absolute right-4 top-16 space-y-4 z-10">
          <PerformanceMonitor
            pipelineMetrics={pipelineMetrics}
            isVisible={showMonitor}
            onToggle={() => setShowMonitor(!showMonitor)}
          />
        </div>
      </div>

      {/* Preview Panel */}
      {showPreview && (
        <PreviewPanel
          selectedNode={selectedNode}
          pipelineData={null}
          isVisible={showPreview}
          onToggle={() => setShowPreview(!showPreview)}
        />
      )}
    </div>
  );
};

export default EnhancedVisualPipelineEditor;
