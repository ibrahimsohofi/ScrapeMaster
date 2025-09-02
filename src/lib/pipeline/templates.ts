import type { Node, Edge } from '@xyflow/react';

// Import PipelineNodeData from the editor
interface PipelineNodeData extends Record<string, unknown> {
  id: string;
  type: string;
  label: string;
  config: any;
  status: 'idle' | 'running' | 'success' | 'error' | 'warning';
  metrics?: any;
  preview?: any[];
  isCollapsed?: boolean;
}

export interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  useCase: string;
  nodes: Node<PipelineNodeData>[];
  edges: Edge[];
  configuration: any;
  author?: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  downloadCount?: number;
  rating?: number;
  screenshots?: string[];
}

export type TemplateCategory =
  | 'e-commerce'
  | 'news-media'
  | 'social-media'
  | 'real-estate'
  | 'job-listings'
  | 'financial'
  | 'lead-generation'
  | 'product-monitoring'
  | 'content-aggregation'
  | 'data-transformation'
  | 'api-integration'
  | 'general';

export class PipelineTemplateService {
  private templates: PipelineTemplate[] = [];

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates() {
    this.templates = [
      // E-commerce Templates
      {
        id: 'ecommerce-product-scraper',
        name: 'E-commerce Product Scraper',
        description: 'Extract product information including prices, descriptions, and reviews from e-commerce websites',
        category: 'e-commerce',
        tags: ['products', 'prices', 'reviews', 'inventory'],
        difficulty: 'beginner',
        estimatedTime: '15 minutes',
        useCase: 'Monitor competitor prices and product availability',
        nodes: [
          {
            id: 'input-1',
            type: 'custom',
            position: { x: 50, y: 100 },
            data: {
              id: 'input-1',
              type: 'input',
              label: 'Website Input',
              config: {
                inputType: 'url',
                url: 'https://example-store.com/products',
                pagination: true,
                maxPages: 10
              },
              status: 'idle'
            }
          },
          {
            id: 'extract-1',
            type: 'custom',
            position: { x: 300, y: 100 },
            data: {
              id: 'extract-1',
              type: 'extract',
              label: 'Extract Product Data',
              config: {
                extractType: 'css',
                selectors: {
                  name: '.product-title',
                  price: '.price',
                  description: '.product-description',
                  rating: '.rating-value',
                  availability: '.stock-status',
                  image: '.product-image img@src'
                }
              },
              status: 'idle'
            }
          },
          {
            id: 'transform-1',
            type: 'custom',
            position: { x: 550, y: 100 },
            data: {
              id: 'transform-1',
              type: 'transform',
              label: 'Clean & Format',
              config: {
                transformType: 'normalize',
                normalizations: {
                  price: { type: 'number', extract_currency: true },
                  rating: { type: 'number' },
                  name: { type: 'trim' },
                  availability: { type: 'lowercase' }
                }
              },
              status: 'idle'
            }
          },
          {
            id: 'validate-1',
            type: 'custom',
            position: { x: 800, y: 100 },
            data: {
              id: 'validate-1',
              type: 'validate',
              label: 'Validate Data',
              config: {
                validationRules: [
                  { field: 'name', validationType: 'required' },
                  { field: 'price', validationType: 'type', value: 'number' },
                  { field: 'rating', validationType: 'range', value: { min: 0, max: 5 } }
                ],
                strictMode: false
              },
              status: 'idle'
            }
          },
          {
            id: 'export-1',
            type: 'custom',
            position: { x: 1050, y: 100 },
            data: {
              id: 'export-1',
              type: 'export',
              label: 'Export Results',
              config: {
                outputFormat: 'csv',
                fileName: 'products',
                includeHeaders: true,
                schedule: 'daily'
              },
              status: 'idle'
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'input-1', target: 'extract-1' },
          { id: 'e2', source: 'extract-1', target: 'transform-1' },
          { id: 'e3', source: 'transform-1', target: 'validate-1' },
          { id: 'e4', source: 'validate-1', target: 'export-1' }
        ],
        configuration: {
          schedule: 'daily',
          retryAttempts: 3,
          timeout: 30000,
          respectRobots: true
        },
        author: 'DataVault Pro',
        version: '1.0.0',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        isPublic: true,
        downloadCount: 1250,
        rating: 4.8
      },

      // News & Media Template
      {
        id: 'news-aggregator',
        name: 'News Headlines Aggregator',
        description: 'Collect and aggregate news headlines from multiple sources with sentiment analysis',
        category: 'news-media',
        tags: ['news', 'headlines', 'sentiment', 'aggregation'],
        difficulty: 'intermediate',
        estimatedTime: '25 minutes',
        useCase: 'Monitor news coverage and sentiment around specific topics',
        nodes: [
          {
            id: 'input-multi',
            type: 'custom',
            position: { x: 50, y: 100 },
            data: {
              id: 'input-multi',
              type: 'input',
              label: 'News Sources',
              config: {
                inputType: 'multiple_urls',
                urls: [
                  'https://news.ycombinator.com',
                  'https://techcrunch.com',
                  'https://www.reuters.com/technology'
                ],
                concurrent: true
              },
              status: 'idle'
            }
          },
          {
            id: 'extract-news',
            type: 'custom',
            position: { x: 300, y: 100 },
            data: {
              id: 'extract-news',
              type: 'extract',
              label: 'Extract Headlines',
              config: {
                extractType: 'css',
                selectors: {
                  headline: 'h1, h2, h3, .headline, .title',
                  summary: '.summary, .excerpt, .description',
                  url: 'a@href',
                  publishDate: '.date, .published, time@datetime',
                  author: '.author, .byline'
                }
              },
              status: 'idle'
            }
          },
          {
            id: 'ai-sentiment',
            type: 'custom',
            position: { x: 550, y: 100 },
            data: {
              id: 'ai-sentiment',
              type: 'ai-transform',
              label: 'Sentiment Analysis',
              config: {
                aiType: 'sentiment',
                fields: ['headline', 'summary'],
                outputFields: ['sentiment_score', 'sentiment_label', 'keywords']
              },
              status: 'idle'
            }
          },
          {
            id: 'filter-relevant',
            type: 'custom',
            position: { x: 800, y: 100 },
            data: {
              id: 'filter-relevant',
              type: 'filter',
              label: 'Filter Relevant',
              config: {
                conditions: [
                  { field: 'headline', operator: 'not_contains', value: 'advertisement' },
                  { field: 'sentiment_score', operator: 'greater_than', value: -0.5 }
                ],
                logic: 'AND'
              },
              status: 'idle'
            }
          },
          {
            id: 'aggregate-topics',
            type: 'custom',
            position: { x: 1050, y: 100 },
            data: {
              id: 'aggregate-topics',
              type: 'aggregate',
              label: 'Topic Aggregation',
              config: {
                aggregations: [
                  { field: 'sentiment_score', operation: 'avg', groupBy: 'keywords' },
                  { field: 'headline', operation: 'count', groupBy: 'publishDate' }
                ]
              },
              status: 'idle'
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'input-multi', target: 'extract-news' },
          { id: 'e2', source: 'extract-news', target: 'ai-sentiment' },
          { id: 'e3', source: 'ai-sentiment', target: 'filter-relevant' },
          { id: 'e4', source: 'filter-relevant', target: 'aggregate-topics' }
        ],
        configuration: {
          schedule: 'hourly',
          retryAttempts: 2,
          timeout: 45000,
          respectRobots: true,
          useProxy: true
        },
        author: 'DataVault Pro',
        version: '1.1.0',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-02-01'),
        isPublic: true,
        downloadCount: 890,
        rating: 4.6
      },

      // Lead Generation Template
      {
        id: 'lead-generation-linkedin',
        name: 'LinkedIn Lead Generator',
        description: 'Extract professional contact information and company details for lead generation',
        category: 'lead-generation',
        tags: ['linkedin', 'contacts', 'leads', 'b2b'],
        difficulty: 'advanced',
        estimatedTime: '40 minutes',
        useCase: 'Build targeted prospect lists for sales and marketing teams',
        nodes: [
          {
            id: 'search-input',
            type: 'custom',
            position: { x: 50, y: 50 },
            data: {
              id: 'search-input',
              type: 'input',
              label: 'LinkedIn Search',
              config: {
                inputType: 'search',
                platform: 'linkedin',
                searchQuery: 'CTO OR "Chief Technology Officer" AND startups',
                location: 'San Francisco Bay Area',
                maxResults: 100
              },
              status: 'idle'
            }
          },
          {
            id: 'extract-profiles',
            type: 'custom',
            position: { x: 300, y: 50 },
            data: {
              id: 'extract-profiles',
              type: 'extract',
              label: 'Extract Profile Data',
              config: {
                extractType: 'css',
                selectors: {
                  name: '.pv-text-details__left-panel h1',
                  title: '.text-body-medium',
                  company: '.pv-text-details__right-panel .text-body-small',
                  location: '.pv-text-details__left-panel .text-body-small',
                  profileUrl: 'link[rel="canonical"]@href',
                  avatar: '.pv-top-card-profile-picture__image@src'
                }
              },
              status: 'idle'
            }
          },
          {
            id: 'enrich-company',
            type: 'custom',
            position: { x: 550, y: 50 },
            data: {
              id: 'enrich-company',
              type: 'enrich',
              label: 'Enrich Company Data',
              config: {
                enrichmentType: 'company_lookup',
                inputField: 'company',
                outputFields: ['domain', 'industry', 'size', 'funding', 'technologies']
              },
              status: 'idle'
            }
          },
          {
            id: 'validate-leads',
            type: 'custom',
            position: { x: 800, y: 50 },
            data: {
              id: 'validate-leads',
              type: 'validate',
              label: 'Validate Leads',
              config: {
                validationRules: [
                  { field: 'name', validationType: 'required' },
                  { field: 'company', validationType: 'required' },
                  { field: 'domain', validationType: 'type', value: 'url' }
                ],
                strictMode: true
              },
              status: 'idle'
            }
          },
          {
            id: 'score-leads',
            type: 'custom',
            position: { x: 1050, y: 50 },
            data: {
              id: 'score-leads',
              type: 'javascript',
              label: 'Lead Scoring',
              config: {
                customCode: `
function transform(data, context) {
  return data.map(lead => {
    let score = 0;

    // Title scoring
    if (lead.title.includes('CTO') || lead.title.includes('Chief')) score += 30;
    if (lead.title.includes('Director') || lead.title.includes('VP')) score += 20;
    if (lead.title.includes('Manager')) score += 10;

    // Company size scoring
    if (lead.size === 'startup' || lead.size === 'small') score += 25;
    if (lead.size === 'medium') score += 15;

    // Industry scoring
    if (lead.industry.includes('technology') || lead.industry.includes('software')) score += 20;

    // Funding scoring
    if (lead.funding && lead.funding.includes('Series')) score += 15;

    return {
      ...lead,
      leadScore: Math.min(score, 100),
      tier: score >= 70 ? 'A' : score >= 50 ? 'B' : 'C'
    };
  });
}`
              },
              status: 'idle'
            }
          },
          {
            id: 'export-leads',
            type: 'custom',
            position: { x: 1300, y: 50 },
            data: {
              id: 'export-leads',
              type: 'export',
              label: 'Export to CRM',
              config: {
                outputFormat: 'api',
                apiEndpoint: 'https://api.salesforce.com/leads',
                authentication: 'oauth',
                batchSize: 50
              },
              status: 'idle'
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'search-input', target: 'extract-profiles' },
          { id: 'e2', source: 'extract-profiles', target: 'enrich-company' },
          { id: 'e3', source: 'enrich-company', target: 'validate-leads' },
          { id: 'e4', source: 'validate-leads', target: 'score-leads' },
          { id: 'e5', source: 'score-leads', target: 'export-leads' }
        ],
        configuration: {
          schedule: 'weekly',
          retryAttempts: 5,
          timeout: 60000,
          respectRobots: true,
          useProxy: true,
          rateLimiting: true
        },
        author: 'DataVault Pro',
        version: '1.2.0',
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-15'),
        isPublic: true,
        downloadCount: 567,
        rating: 4.9
      },

      // Data Transformation Template
      {
        id: 'csv-data-cleaner',
        name: 'CSV Data Cleaner & Validator',
        description: 'Clean, validate, and standardize CSV data with quality reporting',
        category: 'data-transformation',
        tags: ['csv', 'cleaning', 'validation', 'standardization'],
        difficulty: 'beginner',
        estimatedTime: '10 minutes',
        useCase: 'Prepare and clean raw CSV data for analysis or import',
        nodes: [
          {
            id: 'csv-input',
            type: 'custom',
            position: { x: 50, y: 100 },
            data: {
              id: 'csv-input',
              type: 'input',
              label: 'CSV File Input',
              config: {
                inputType: 'file',
                fileType: 'csv',
                delimiter: ',',
                hasHeaders: true,
                encoding: 'utf-8'
              },
              status: 'idle'
            }
          },
          {
            id: 'clean-data',
            type: 'custom',
            position: { x: 300, y: 100 },
            data: {
              id: 'clean-data',
              type: 'transform',
              label: 'Clean Data',
              config: {
                transformType: 'normalize',
                normalizations: {
                  '*': { type: 'trim' },
                  email: { type: 'lowercase' },
                  phone: { type: 'normalize_phone' },
                  name: { type: 'title_case' }
                }
              },
              status: 'idle'
            }
          },
          {
            id: 'validate-quality',
            type: 'custom',
            position: { x: 550, y: 100 },
            data: {
              id: 'validate-quality',
              type: 'validate',
              label: 'Quality Check',
              config: {
                validationRules: [
                  { field: 'email', validationType: 'email' },
                  { field: 'phone', validationType: 'phone' },
                  { field: 'name', validationType: 'required' }
                ],
                strictMode: false,
                generateReport: true
              },
              status: 'idle'
            }
          },
          {
            id: 'dedup',
            type: 'custom',
            position: { x: 800, y: 100 },
            data: {
              id: 'dedup',
              type: 'dedup',
              label: 'Remove Duplicates',
              config: {
                deduplicationStrategy: 'email',
                keepStrategy: 'first',
                similarityThreshold: 0.9
              },
              status: 'idle'
            }
          },
          {
            id: 'final-export',
            type: 'custom',
            position: { x: 1050, y: 100 },
            data: {
              id: 'final-export',
              type: 'export',
              label: 'Export Clean Data',
              config: {
                outputFormat: 'csv',
                fileName: 'cleaned_data',
                includeHeaders: true,
                qualityReport: true
              },
              status: 'idle'
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'csv-input', target: 'clean-data' },
          { id: 'e2', source: 'clean-data', target: 'validate-quality' },
          { id: 'e3', source: 'validate-quality', target: 'dedup' },
          { id: 'e4', source: 'dedup', target: 'final-export' }
        ],
        configuration: {
          onDemand: true,
          timeout: 120000,
          memoryLimit: '2GB'
        },
        author: 'DataVault Pro',
        version: '1.0.0',
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-02-20'),
        isPublic: true,
        downloadCount: 2100,
        rating: 4.7
      }
    ];
  }

  // Template Management Methods
  getAllTemplates(): PipelineTemplate[] {
    return [...this.templates];
  }

  getTemplatesByCategory(category: TemplateCategory): PipelineTemplate[] {
    return this.templates.filter(template => template.category === category);
  }

  getTemplatesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): PipelineTemplate[] {
    return this.templates.filter(template => template.difficulty === difficulty);
  }

  searchTemplates(query: string): PipelineTemplate[] {
    const searchTerms = query.toLowerCase().split(' ');
    return this.templates.filter(template => {
      const searchText = `${template.name} ${template.description} ${template.tags.join(' ')} ${template.useCase}`.toLowerCase();
      return searchTerms.every(term => searchText.includes(term));
    });
  }

  getTemplateById(id: string): PipelineTemplate | undefined {
    return this.templates.find(template => template.id === id);
  }

  getPopularTemplates(limit = 10): PipelineTemplate[] {
    return [...this.templates]
      .sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0))
      .slice(0, limit);
  }

  getRecentTemplates(limit = 5): PipelineTemplate[] {
    return [...this.templates]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }

  // Template Operations
  saveTemplate(template: Omit<PipelineTemplate, 'id' | 'createdAt' | 'updatedAt'>): PipelineTemplate {
    const newTemplate: PipelineTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.push(newTemplate);
    this.saveToLocalStorage();
    return newTemplate;
  }

  updateTemplate(id: string, updates: Partial<PipelineTemplate>): PipelineTemplate | null {
    const index = this.templates.findIndex(template => template.id === id);
    if (index === -1) return null;

    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      updatedAt: new Date()
    };

    this.saveToLocalStorage();
    return this.templates[index];
  }

  deleteTemplate(id: string): boolean {
    const index = this.templates.findIndex(template => template.id === id);
    if (index === -1) return false;

    this.templates.splice(index, 1);
    this.saveToLocalStorage();
    return true;
  }

  duplicateTemplate(id: string, name?: string): PipelineTemplate | null {
    const template = this.getTemplateById(id);
    if (!template) return null;

    const duplicatedTemplate: PipelineTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
      name: name || `${template.name} (Copy)`,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      downloadCount: 0,
      rating: undefined
    };

    this.templates.push(duplicatedTemplate);
    this.saveToLocalStorage();
    return duplicatedTemplate;
  }

  // Template Categories
  getCategories(): { category: TemplateCategory; count: number; description: string }[] {
    const categoryDescriptions: Record<TemplateCategory, string> = {
      'e-commerce': 'Online store and marketplace scraping',
      'news-media': 'News websites and media monitoring',
      'social-media': 'Social platform data extraction',
      'real-estate': 'Property listings and market data',
      'job-listings': 'Employment and career platforms',
      'financial': 'Stock prices and financial data',
      'lead-generation': 'Business contact and prospect data',
      'product-monitoring': 'Price and availability tracking',
      'content-aggregation': 'Content collection and curation',
      'data-transformation': 'Data processing and cleaning',
      'api-integration': 'API data sources and webhooks',
      'general': 'General purpose templates'
    };

    const categoryCounts: Record<TemplateCategory, number> = {
      'e-commerce': 0,
      'news-media': 0,
      'social-media': 0,
      'real-estate': 0,
      'job-listings': 0,
      'financial': 0,
      'lead-generation': 0,
      'product-monitoring': 0,
      'content-aggregation': 0,
      'data-transformation': 0,
      'api-integration': 0,
      'general': 0
    };

    this.templates.forEach(template => {
      categoryCounts[template.category] = (categoryCounts[template.category] || 0) + 1;
    });

    return Object.entries(categoryDescriptions).map(([category, description]) => ({
      category: category as TemplateCategory,
      count: categoryCounts[category as TemplateCategory] || 0,
      description
    }));
  }

  // Storage
  private saveToLocalStorage(): void {
    try {
      const customTemplates = this.templates.filter(template => template.id.startsWith('custom-'));
      localStorage.setItem('pipelineTemplates', JSON.stringify(customTemplates));
    } catch (error) {
      console.error('Failed to save templates to localStorage:', error);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('pipelineTemplates');
      if (stored) {
        const customTemplates: PipelineTemplate[] = JSON.parse(stored);
        this.templates.push(...customTemplates);
      }
    } catch (error) {
      console.error('Failed to load templates from localStorage:', error);
    }
  }

  // Template Validation
  validateTemplate(template: PipelineTemplate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (!template.description || template.description.trim().length === 0) {
      errors.push('Template description is required');
    }

    if (!template.nodes || template.nodes.length === 0) {
      errors.push('Template must have at least one node');
    }

    // Validate node connections
    const nodeIds = new Set(template.nodes.map(node => node.id));
    template.edges.forEach(edge => {
      if (!nodeIds.has(edge.source)) {
        errors.push(`Edge references unknown source node: ${edge.source}`);
      }
      if (!nodeIds.has(edge.target)) {
        errors.push(`Edge references unknown target node: ${edge.target}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const pipelineTemplateService = new PipelineTemplateService();
