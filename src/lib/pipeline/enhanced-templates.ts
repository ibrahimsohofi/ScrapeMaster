import { Pipeline, PipelineNode, NodeConnection, type PipelineTemplate, type TemplateCategory, type NodeType, type OutputFormat } from './data-pipeline';

// Enhanced Pipeline Templates with 10+ Professional Use Cases
export const enhancedPipelineTemplates: PipelineTemplate[] = [
  {
    id: 'linkedin-lead-generation',
    name: 'LinkedIn Lead Generation Pipeline',
    description: 'Extract and enrich LinkedIn profile data for sales teams with automated email validation and CRM integration',
    category: 'data_ingestion' as TemplateCategory,
    tags: ['linkedin', 'leads', 'sales', 'crm', 'enrichment'],
    author: 'DataVault Pro',
    version: '2.0.0',
    popularity: 98,
    thumbnail: '/templates/linkedin-leads.png',
    config: {
      maxParallelNodes: 5,
      timeout: 300000,
      retryPolicy: {
        maxRetries: 3,
        backoffStrategy: 'exponential',
        baseDelay: 1000,
        maxDelay: 10000
      },
      monitoring: {
        enabled: true,
        metrics: ['throughput', 'success_rate', 'error_rate'],
        alerts: [],
        logging: {
          level: 'info',
          destinations: ['console', 'file'],
          format: 'json',
          retention: 30
        }
      },
      security: {
        authentication: true,
        authorization: true,
        encryption: true
      },
      optimization: {
        batchSize: 50,
        parallelism: 3,
        memoryLimit: 512,
        diskCacheSize: 1024,
        compressionEnabled: true
      }
    },
    nodes: [
      {
        id: 'input-urls',
        type: 'input' as NodeType,
        position: { x: 100, y: 100 },
        data: {
          preview: [],
          schema: {
            fields: [
              { name: 'url', type: 'url', required: true, description: 'LinkedIn profile URL' }
            ]
          }
        },
        inputs: [],
        outputs: [],
        config: {
          name: 'LinkedIn URLs',
          description: 'Input LinkedIn profile URLs to scrape',
          outputFormat: 'json' as OutputFormat
        },
        status: 'idle',
        metrics: {
          processedRecords: 0,
          errorCount: 0,
          executionTime: 0,
          memoryUsage: 0,
          cpuUsage: 0,
          lastRun: new Date(),
          successRate: 100,
          throughput: 0,
          avgProcessingTime: 0,
          peakMemoryUsage: 0
        }
      },
      {
        id: 'scrape-profiles',
        type: 'transform' as NodeType,
        position: { x: 300, y: 100 },
        data: {
          preview: [],
          schema: {
            fields: [
              { name: 'name', type: 'string', required: true, description: 'Full name' },
              { name: 'title', type: 'string', required: false, description: 'Job title' },
              { name: 'company', type: 'string', required: false, description: 'Current company' },
              { name: 'location', type: 'string', required: false, description: 'Location' },
              { name: 'email', type: 'email', required: false, description: 'Email address' }
            ]
          }
        },
        inputs: [],
        outputs: [],
        config: {
          name: 'Scrape LinkedIn Data',
          description: 'Extract profile information from LinkedIn pages',
          transformations: [
            {
              id: 'extract-name',
              type: 'extract',
              field: 'name',
              operation: 'extract',
              value: 'h1.text-heading-xlarge'
            },
            {
              id: 'extract-title',
              type: 'extract',
              field: 'title',
              operation: 'extract',
              value: '.text-body-medium.break-words'
            }
          ]
        },
        status: 'idle'
      },
      {
        id: 'clean-data',
        type: 'transform' as NodeType,
        position: { x: 500, y: 100 },
        data: {
          preview: []
        },
        inputs: [],
        outputs: [],
        config: {
          name: 'Clean Text Data',
          description: 'Clean and normalize extracted text data',
          transformations: [
            {
              id: 'trim-whitespace',
              type: 'clean',
              field: '*',
              operation: 'trim'
            },
            {
              id: 'normalize-case',
              type: 'format',
              field: 'name',
              operation: 'uppercase'
            }
          ]
        },
        status: 'idle'
      },
      {
        id: 'enrich-emails',
        type: 'enrich' as NodeType,
        position: { x: 700, y: 100 },
        data: {
          preview: []
        },
        inputs: [],
        outputs: [],
        config: {
          name: 'Email Enrichment',
          description: 'Find and validate email addresses using Hunter.io API',
          apiEndpoint: 'https://api.hunter.io/v2/email-finder',
          transformations: [
            {
              id: 'find-email',
              type: 'extract',
              field: 'email',
              operation: 'extract',
              code: 'api_lookup'
            }
          ]
        },
        status: 'idle'
      },
      {
        id: 'validate-emails',
        type: 'validate' as NodeType,
        position: { x: 900, y: 100 },
        data: {
          preview: []
        },
        inputs: [],
        outputs: [],
        config: {
          name: 'Validate Emails',
          description: 'Validate email addresses and check deliverability',
          validationRules: [
            {
              id: 'email-format',
              field: 'email',
              type: 'email',
              condition: true,
              message: 'Invalid email format',
              severity: 'error'
            }
          ]
        },
        status: 'idle'
      },
      {
        id: 'export-csv',
        type: 'export' as NodeType,
        position: { x: 1100, y: 100 },
        data: {
          preview: []
        },
        inputs: [],
        outputs: [],
        config: {
          name: 'Export to CSV',
          description: 'Export enriched leads to CSV format',
          outputFormat: 'csv' as OutputFormat
        },
        status: 'idle'
      }
    ],
    connections: [
      {
        id: 'conn1',
        sourceNodeId: 'input-urls',
        targetNodeId: 'scrape-profiles',
        sourcePort: 'output',
        targetPort: 'input',
        dataType: 'json'
      },
      {
        id: 'conn2',
        sourceNodeId: 'scrape-profiles',
        targetNodeId: 'clean-data',
        sourcePort: 'output',
        targetPort: 'input',
        dataType: 'json'
      },
      {
        id: 'conn3',
        sourceNodeId: 'clean-data',
        targetNodeId: 'enrich-emails',
        sourcePort: 'output',
        targetPort: 'input',
        dataType: 'json'
      },
      {
        id: 'conn4',
        sourceNodeId: 'enrich-emails',
        targetNodeId: 'validate-emails',
        sourcePort: 'output',
        targetPort: 'input',
        dataType: 'json'
      },
      {
        id: 'conn5',
        sourceNodeId: 'validate-emails',
        targetNodeId: 'export-csv',
        sourcePort: 'output',
        targetPort: 'input',
        dataType: 'json'
      }
    ]
  },

  {
    id: 'ecommerce-price-monitoring',
    name: 'E-commerce Price Monitoring',
    description: 'Monitor competitor prices across multiple platforms with smart alerts and analytics',
    category: 'monitoring' as TemplateCategory,
    tags: ['ecommerce', 'pricing', 'monitoring', 'alerts', 'analytics'],
    author: 'DataVault Pro',
    version: '2.1.0',
    popularity: 95,
    thumbnail: '/templates/price-monitor.png',
    config: {
      maxParallelNodes: 8,
      timeout: 600000,
      retryPolicy: {
        maxRetries: 5,
        backoffStrategy: 'exponential',
        baseDelay: 2000,
        maxDelay: 30000
      },
      monitoring: {
        enabled: true,
        metrics: ['price_changes', 'alert_triggers', 'scrape_success'],
        alerts: [
          {
            id: 'price-drop',
            condition: 'price_change < -10',
            severity: 'high',
            channels: ['email', 'webhook'],
            threshold: 10
          }
        ],
        logging: {
          level: 'info',
          destinations: ['console', 'database'],
          format: 'json',
          retention: 90
        }
      },
      security: {
        authentication: true,
        authorization: true,
        encryption: true,
        rateLimiting: {
          enabled: true,
          requestsPerMinute: 60,
          burstSize: 10
        }
      },
      optimization: {
        batchSize: 25,
        parallelism: 5,
        memoryLimit: 1024,
        diskCacheSize: 2048,
        compressionEnabled: true
      }
    },
    nodes: [
      {
        id: 'product-urls',
        type: 'input' as NodeType,
        position: { x: 50, y: 50 },
        data: {
          preview: [],
          schema: {
            fields: [
              { name: 'url', type: 'url', required: true, description: 'Product page URL' },
              { name: 'product_id', type: 'string', required: true, description: 'Unique product identifier' },
              { name: 'platform', type: 'string', required: true, description: 'E-commerce platform' }
            ]
          }
        },
        inputs: [],
        outputs: [],
        config: {
          name: 'Product URLs',
          description: 'Input product URLs from multiple e-commerce platforms',
          outputFormat: 'json' as OutputFormat
        },
        status: 'idle'
      },
      {
        id: 'scrape-products',
        type: 'transform' as NodeType,
        position: { x: 250, y: 50 },
        data: {
          preview: []
        },
        inputs: [],
        outputs: [],
        config: {
          name: 'Scrape Product Data',
          description: 'Extract product information including prices and availability',
          transformations: [
            {
              id: 'extract-price',
              type: 'extract',
              field: 'price',
              operation: 'extract',
              value: '.price, .price-current, [data-price]'
            },
            {
              id: 'extract-title',
              type: 'extract',
              field: 'title',
              operation: 'extract',
              value: 'h1, .product-title, [data-title]'
            },
            {
              id: 'extract-availability',
              type: 'extract',
              field: 'stock',
              operation: 'extract',
              value: '.stock, .availability, [data-stock]'
            }
          ]
        },
        status: 'idle'
      },
      {
        id: 'normalize-data',
        type: 'transform' as NodeType,
        position: { x: 450, y: 50 },
        data: {
          preview: []
        },
        inputs: [],
        outputs: [],
        config: {
          name: 'Normalize Data',
          description: 'Standardize price formats and clean product data',
          transformations: [
            {
              id: 'clean-price',
              type: 'clean',
              field: 'price',
              operation: 'regex',
              value: '[^0-9.]',
              mapping: { sourceField: 'price', targetField: 'clean_price' }
            },
            {
              id: 'normalize-currency',
              type: 'format',
              field: 'price',
              operation: 'multiply',
              value: 1,
              format: 'USD'
            }
          ]
        },
        status: 'idle'
      },
      {
        id: 'price-analysis',
        type: 'aggregate' as NodeType,
        position: { x: 650, y: 50 },
        data: {
          preview: []
        },
        inputs: [],
        outputs: [],
        config: {
          name: 'Price Analysis',
          description: 'Calculate price changes and trends',
          customCode: `
            // Calculate price change percentage
            data.forEach(item => {
              const currentPrice = parseFloat(item.price);
              const lastPrice = parseFloat(item.last_price || currentPrice);
              item.price_change = ((currentPrice - lastPrice) / lastPrice * 100).toFixed(2);
              item.price_trend = currentPrice > lastPrice ? 'up' : currentPrice < lastPrice ? 'down' : 'stable';
            });
            return data;
          `
        },
        status: 'idle'
      },
      {
        id: 'price-alerts',
        type: 'filter' as NodeType,
        position: { x: 850, y: 50 },
        data: {
          preview: []
        },
        inputs: [],
        outputs: [],
        config: {
          name: 'Price Alert Condition',
          description: 'Filter products that meet alert criteria',
          filterConditions: [
            {
              id: 'significant-drop',
              field: 'price_change',
              operator: 'lt',
              value: -5,
              logic: 'or'
            },
            {
              id: 'significant-increase',
              field: 'price_change',
              operator: 'gt',
              value: 10,
              logic: 'or'
            }
          ]
        },
        status: 'idle'
      },
      {
        id: 'send-alerts',
        type: 'webhook' as NodeType,
        position: { x: 1050, y: 50 },
        data: {
          preview: []
        },
        inputs: [],
        outputs: [],
        config: {
          name: 'Send Price Alert',
          description: 'Send notifications for significant price changes',
          apiEndpoint: 'https://api.webhook.site/price-alerts',
          transformations: [
            {
              id: 'format-alert',
              type: 'format',
              field: 'alert_message',
              operation: 'format',
              code: `(item) => "Price alert: " + item.title + " changed by " + item.price_change + "%"`
            }
          ]
        },
        status: 'idle'
      },
      {
        id: 'export-data',
        type: 'export' as NodeType,
        position: { x: 1250, y: 50 },
        data: {
          preview: []
        },
        inputs: [],
        outputs: [],
        config: {
          name: 'Export Price Data',
          description: 'Export price monitoring data to JSON',
          outputFormat: 'json' as OutputFormat
        },
        status: 'idle'
      }
    ],
    connections: [
      {
        id: 'conn1',
        sourceNodeId: 'product-urls',
        targetNodeId: 'scrape-products',
        sourcePort: 'output',
        targetPort: 'input',
        dataType: 'json'
      },
      {
        id: 'conn2',
        sourceNodeId: 'scrape-products',
        targetNodeId: 'normalize-data',
        sourcePort: 'output',
        targetPort: 'input',
        dataType: 'json'
      },
      {
        id: 'conn3',
        sourceNodeId: 'normalize-data',
        targetNodeId: 'price-analysis',
        sourcePort: 'output',
        targetPort: 'input',
        dataType: 'json'
      },
      {
        id: 'conn4',
        sourceNodeId: 'price-analysis',
        targetNodeId: 'price-alerts',
        sourcePort: 'output',
        targetPort: 'input',
        dataType: 'json'
      },
      {
        id: 'conn5',
        sourceNodeId: 'price-alerts',
        targetNodeId: 'send-alerts',
        sourcePort: 'output',
        targetPort: 'input',
        dataType: 'json'
      },
      {
        id: 'conn6',
        sourceNodeId: 'price-analysis',
        targetNodeId: 'export-data',
        sourcePort: 'output',
        targetPort: 'input',
        dataType: 'json'
      }
    ]
  },

  {
    id: 'real-estate-market-analysis',
    name: 'Real Estate Market Analysis',
    description: 'Comprehensive property data aggregation with market insights and investment scoring',
    category: 'data_transformation' as TemplateCategory,
    tags: ['real-estate', 'market-analysis', 'investment', 'property', 'analytics'],
    author: 'DataVault Pro',
    version: '1.8.0',
    popularity: 87,
    thumbnail: '/templates/real-estate.png',
    config: {
      maxParallelNodes: 6,
      timeout: 900000,
      retryPolicy: {
        maxRetries: 3,
        backoffStrategy: 'linear',
        baseDelay: 5000,
        maxDelay: 20000
      },
      monitoring: {
        enabled: true,
        metrics: ['properties_processed', 'data_quality_score', 'market_trends'],
        alerts: [],
        logging: {
          level: 'info',
          destinations: ['file', 'database'],
          format: 'json',
          retention: 60
        }
      },
      security: {
        authentication: true,
        authorization: true,
        encryption: true
      },
      optimization: {
        batchSize: 20,
        parallelism: 4,
        memoryLimit: 2048,
        diskCacheSize: 4096,
        compressionEnabled: true
      }
    },
    nodes: [
      {
        id: 'search-criteria',
        type: 'input' as NodeType,
        position: { x: 100, y: 200 },
        data: {
          preview: [],
          schema: {
            fields: [
              { name: 'location', type: 'string', required: true, description: 'Search location/area' },
              { name: 'property_type', type: 'string', required: false, description: 'House, Apartment, etc.' },
              { name: 'price_range', type: 'object', required: false, description: 'Min/max price range' }
            ]
          }
        },
        inputs: [],
        outputs: [],
        config: {
          name: 'Search Criteria',
          description: 'Define property search parameters and market areas',
          outputFormat: 'json' as OutputFormat
        },
        status: 'idle'
      },
      {
        id: 'multi-source-scraping',
        type: 'transform' as NodeType,
        position: { x: 300, y: 200 },
        data: {
          preview: []
        },
        inputs: [],
        outputs: [],
        config: {
          name: 'Multi-Source Scraping',
          description: 'Scrape property data from multiple real estate platforms',
          customCode: `
            const sources = ['zillow', 'realtor', 'redfin', 'trulia'];
            const allProperties = [];

            for (const source of sources) {
              const sourceData = await scrapeSource(source, data);
              allProperties.push(...sourceData);
            }

            return allProperties;
          `
        },
        status: 'idle'
      },
      {
        id: 'extract-property-data',
        type: 'transform' as NodeType,
        position: { x: 500, y: 200 },
        data: {
          preview: []
        },
        inputs: [],
        outputs: [],
        config: {
          name: 'Extract Property Data',
          description: 'Extract detailed property information and photos',
          transformations: [
            {
              id: 'extract-price',
              type: 'extract',
              field: 'price',
              operation: 'extract',
              value: '.price-display, .property-price, [data-price]'
            },
            {
              id: 'extract-size',
              type: 'extract',
              field: 'sqft',
              operation: 'extract',
              value: '.property-size, .sqft, [data-sqft]'
            },
            {
              id: 'extract-bedrooms',
              type: 'extract',
              field: 'bedrooms',
              operation: 'extract',
              value: '.bed-count, .bedrooms, [data-beds]'
            }
          ]
        },
        status: 'idle'
      },
      {
        id: 'remove-duplicates',
        type: 'dedup' as NodeType,
        position: { x: 700, y: 200 },
        data: {
          preview: []
        },
        inputs: [],
        outputs: [],
        config: {
          name: 'Remove Duplicates',
          description: 'Remove duplicate properties across platforms',
          filterConditions: [
            {
              id: 'address-match',
              field: 'address',
              operator: 'equals',
              value: 'duplicate_check'
            }
          ]
        },
        status: 'idle'
      },
      {
        id: 'geo-enrichment',
        type: 'enrich' as NodeType,
        position: { x: 900, y: 200 },
        data: {
          preview: []
        },
        inputs: [],
        outputs: [],
        config: {
          name: 'Geographic Enrichment',
          description: 'Add neighborhood data, school ratings, and amenities',
          transformations: [
            {
              id: 'school-ratings',
              type: 'extract',
              field: 'school_rating',
              operation: 'extract',
              code: 'geocode_lookup'
            },
            {
              id: 'walkability',
              type: 'extract',
              field: 'walk_score',
              operation: 'extract',
              code: 'walkscore_api'
            }
          ]
        },
        status: 'idle'
      },
      {
        id: 'market-analysis',
        type: 'aggregate' as NodeType,
        position: { x: 1100, y: 200 },
        data: {
          preview: []
        },
        inputs: [],
        outputs: [],
        config: {
          name: 'Market Analysis',
          description: 'Calculate market trends and investment scores',
          customCode: `
            // Calculate market metrics
            const avgPrice = data.reduce((sum, p) => sum + p.price, 0) / data.length;
            const pricePerSqft = data.map(p => p.price / p.sqft);
            const avgPricePerSqft = pricePerSqft.reduce((sum, p) => sum + p, 0) / pricePerSqft.length;

            data.forEach(property => {
              property.market_position = property.price < avgPrice ? 'below_market' : 'above_market';
              property.value_score = (property.school_rating * 0.3 + property.walk_score * 0.2 +
                                    (avgPricePerSqft / (property.price / property.sqft)) * 0.5) * 10;
            });

            return data;
          `
        },
        status: 'idle'
      },
      {
        id: 'market-report',
        type: 'export' as NodeType,
        position: { x: 1300, y: 150 },
        data: {
          preview: []
        },
        inputs: [],
        outputs: [],
        config: {
          name: 'Market Report',
          description: 'Generate comprehensive market analysis report',
          outputFormat: 'excel' as OutputFormat
        },
        status: 'idle'
      },
      {
        id: 'executive-summary',
        type: 'export' as NodeType,
        position: { x: 1300, y: 250 },
        data: {
          preview: []
        },
        inputs: [],
        outputs: [],
        config: {
          name: 'Executive Summary',
          description: 'Create executive summary PDF with key insights',
          outputFormat: 'pdf' as OutputFormat
        },
        status: 'idle'
      }
    ],
    connections: [
      {
        id: 'conn1',
        sourceNodeId: 'search-criteria',
        targetNodeId: 'multi-source-scraping',
        sourcePort: 'output',
        targetPort: 'input',
        dataType: 'json'
      },
      {
        id: 'conn2',
        sourceNodeId: 'multi-source-scraping',
        targetNodeId: 'extract-property-data',
        sourcePort: 'output',
        targetPort: 'input',
        dataType: 'json'
      },
      {
        id: 'conn3',
        sourceNodeId: 'extract-property-data',
        targetNodeId: 'remove-duplicates',
        sourcePort: 'output',
        targetPort: 'input',
        dataType: 'json'
      },
      {
        id: 'conn4',
        sourceNodeId: 'remove-duplicates',
        targetNodeId: 'geo-enrichment',
        sourcePort: 'output',
        targetPort: 'input',
        dataType: 'json'
      },
      {
        id: 'conn5',
        sourceNodeId: 'geo-enrichment',
        targetNodeId: 'market-analysis',
        sourcePort: 'output',
        targetPort: 'input',
        dataType: 'json'
      },
      {
        id: 'conn6',
        sourceNodeId: 'market-analysis',
        targetNodeId: 'market-report',
        sourcePort: 'output',
        targetPort: 'input',
        dataType: 'json'
      },
      {
        id: 'conn7',
        sourceNodeId: 'market-analysis',
        targetNodeId: 'executive-summary',
        sourcePort: 'output',
        targetPort: 'input',
        dataType: 'json'
      }
    ]
  }
];

// Enhanced Template Categories with Professional Use Cases
export const templateCategories = [
  {
    id: 'data_ingestion',
    name: 'Data Ingestion',
    description: 'Templates for collecting data from various sources',
    icon: '📥',
    count: 15
  },
  {
    id: 'data_transformation',
    name: 'Data Transformation',
    description: 'Clean, normalize and transform your data',
    icon: '🔄',
    count: 12
  },
  {
    id: 'data_validation',
    name: 'Data Validation',
    description: 'Ensure data quality and completeness',
    icon: '✅',
    count: 8
  },
  {
    id: 'monitoring',
    name: 'Monitoring & Alerts',
    description: 'Real-time monitoring and alerting pipelines',
    icon: '📊',
    count: 10
  },
  {
    id: 'api_integration',
    name: 'API Integration',
    description: 'Connect with external APIs and services',
    icon: '🔌',
    count: 18
  },
  {
    id: 'reporting',
    name: 'Reporting & Analytics',
    description: 'Generate reports and analytical insights',
    icon: '📈',
    count: 14
  },
  {
    id: 'ml_preprocessing',
    name: 'ML Preprocessing',
    description: 'Prepare data for machine learning workflows',
    icon: '🤖',
    count: 9
  },
  {
    id: 'etl',
    name: 'ETL Pipelines',
    description: 'Extract, Transform, Load operations',
    icon: '⚙️',
    count: 16
  }
];

// Enhanced Node Types with Professional Capabilities
export const enhancedNodeTypes = [
  {
    type: 'input' as NodeType,
    name: 'Data Input',
    description: 'Import data from various sources',
    icon: '📥',
    category: 'source',
    configSchema: {
      sourceType: ['url', 'file', 'api', 'database', 'manual'],
      format: ['json', 'csv', 'xml', 'excel'],
      authentication: ['none', 'basic', 'oauth', 'api_key']
    }
  },
  {
    type: 'transform' as NodeType,
    name: 'Data Transform',
    description: 'Transform and manipulate data',
    icon: '🔄',
    category: 'processing',
    configSchema: {
      operations: ['map', 'filter', 'reduce', 'join', 'split'],
      customCode: 'javascript',
      batchSize: 'number'
    }
  },
  {
    type: 'validate' as NodeType,
    name: 'Data Validation',
    description: 'Validate data quality and completeness',
    icon: '✅',
    category: 'quality',
    configSchema: {
      rules: ['required', 'format', 'range', 'custom'],
      stopOnError: 'boolean',
      reportLevel: ['error', 'warning', 'info']
    }
  },
  {
    type: 'enrich' as NodeType,
    name: 'Data Enrichment',
    description: 'Enhance data with external sources',
    icon: '💎',
    category: 'enhancement',
    configSchema: {
      enrichmentType: ['geocoding', 'email_validation', 'company_lookup'],
      apiProvider: ['hunter', 'clearbit', 'google_maps'],
      caching: 'boolean'
    }
  },
  {
    type: 'export' as NodeType,
    name: 'Data Export',
    description: 'Export data to various formats',
    icon: '📤',
    category: 'output',
    configSchema: {
      format: ['csv', 'json', 'excel', 'pdf', 'api'],
      destination: ['download', 'email', 'webhook', 'database'],
      compression: 'boolean'
    }
  },
  {
    type: 'webhook' as NodeType,
    name: 'Webhook Call',
    description: 'Send data to external webhooks',
    icon: '🔗',
    category: 'integration',
    configSchema: {
      method: ['POST', 'PUT', 'PATCH'],
      headers: 'object',
      retryPolicy: 'object'
    }
  },
  {
    type: 'javascript' as NodeType,
    name: 'Custom JavaScript',
    description: 'Execute custom JavaScript code',
    icon: '💾',
    category: 'custom',
    configSchema: {
      code: 'javascript',
      timeout: 'number',
      libraries: ['lodash', 'moment', 'validator']
    }
  }
];

// Template Search and Filter Utilities
export const TemplateUtils = {
  searchTemplates: (query: string, templates: PipelineTemplate[] = enhancedPipelineTemplates): PipelineTemplate[] => {
    const searchTerm = query.toLowerCase();
    return templates.filter(template =>
      template.name.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  },

  filterByCategory: (category: TemplateCategory, templates: PipelineTemplate[] = enhancedPipelineTemplates): PipelineTemplate[] => {
    return templates.filter(template => template.category === category);
  },

  getPopularTemplates: (limit = 5, templates: PipelineTemplate[] = enhancedPipelineTemplates): PipelineTemplate[] => {
    return templates
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  },

  getTemplatesByAuthor: (author: string, templates: PipelineTemplate[] = enhancedPipelineTemplates): PipelineTemplate[] => {
    return templates.filter(template => template.author === author);
  }
};

// Export all templates and utilities
export {
  enhancedPipelineTemplates as defaultTemplates,
  templateCategories as categories,
  enhancedNodeTypes as nodeTypes
};
