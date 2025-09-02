import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_POOL_SIZE: z.string().optional().default('10'),
  DATABASE_POOL_TIMEOUT: z.string().optional().default('20000'),

  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRY: z.string().optional().default('7d'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),

  // Redis (optional)
  REDIS_URL: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().optional().default('0'),

  // Email (optional for basic functionality)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().default('587'),
  SMTP_SECURE: z.string().optional().default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),

  // AI Services (optional)
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional().default('gpt-4'),
  OPENAI_MAX_TOKENS: z.string().optional().default('1000'),

  // File Storage (optional)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional(),

  // Monitoring (optional)
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional().default('development'),
  NEW_RELIC_LICENSE_KEY: z.string().optional(),
  NEW_RELIC_APP_NAME: z.string().optional(),

  // Security & Rate Limiting
  RATE_LIMIT_REQUESTS_PER_MINUTE: z.string().optional().default('100'),
  RATE_LIMIT_REQUESTS_PER_HOUR: z.string().optional().default('1000'),
  CORS_ORIGIN: z.string().optional().default('http://localhost:3000'),
  CORS_CREDENTIALS: z.string().optional().default('true'),

  // Feature Flags
  FEATURE_AI_SELECTORS: z.string().optional().default('true'),
  FEATURE_BROWSER_FARM: z.string().optional().default('true'),
  FEATURE_REAL_TIME_MONITORING: z.string().optional().default('true'),
  FEATURE_PROXY_MANAGEMENT: z.string().optional().default('true'),
  FEATURE_VISUAL_PIPELINES: z.string().optional().default('true'),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ENVIRONMENT: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_FORMAT: z.enum(['json', 'text']).default('text'),

  // Health Checks
  HEALTH_CHECK_ENABLED: z.string().optional().default('true'),
  HEALTH_CHECK_INTERVAL: z.string().optional().default('30000'),

  // Browser Configuration
  BROWSER_HEADLESS: z.string().optional().default('true'),
  BROWSER_TIMEOUT: z.string().optional().default('30000'),
  BROWSER_POOL_SIZE: z.string().optional().default('5'),

  // Anti-Detection
  ENABLE_STEALTH_MODE: z.string().optional().default('true'),
  USER_AGENT_ROTATION: z.string().optional().default('true'),
  PROXY_ROTATION: z.string().optional().default('true'),

  // Data & Privacy
  DATA_RETENTION_DAYS: z.string().optional().default('90'),
  AUTOMATIC_DATA_CLEANUP: z.string().optional().default('true'),
  ENABLE_GDPR_COMPLIANCE: z.string().optional().default('true'),
});

// Type inference
export type Environment = z.infer<typeof envSchema>;

// Validation function
export function validateEnv(): Environment {
  try {
    const env = envSchema.parse(process.env);

    // Additional validation logic
    validateRequiredForProduction(env);
    validateSecuritySettings(env);

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      console.error('❌ Environment validation failed:');
      missingVars.forEach(err => console.error(`  - ${err}`));
      process.exit(1);
    }
    throw error;
  }
}

// Production-specific validation
function validateRequiredForProduction(env: Environment) {
  if (env.NODE_ENV === 'production') {
    const requiredProdVars = [
      'JWT_SECRET',
      'NEXTAUTH_SECRET',
      'DATABASE_URL',
    ];

    const missing = requiredProdVars.filter(varName => {
      const value = env[varName as keyof Environment];
      return !value || (typeof value === 'string' && value.includes('REPLACE-WITH'));
    });

    if (missing.length > 0) {
      console.error('❌ Missing required production environment variables:');
      missing.forEach(varName => console.error(`  - ${varName}`));
      process.exit(1);
    }

    // Check for development secrets in production
    if (env.JWT_SECRET?.includes('your-super-secret') ||
        env.NEXTAUTH_SECRET?.includes('your-nextauth-secret')) {
      console.error('❌ Development secrets detected in production environment!');
      console.error('Generate production secrets using: openssl rand -base64 32');
      process.exit(1);
    }
  }
}

// Security settings validation
function validateSecuritySettings(env: Environment) {
  if (env.NODE_ENV === 'production') {
    // Validate CORS settings
    if (env.CORS_ORIGIN === 'http://localhost:3000') {
      console.warn('⚠️  Warning: CORS_ORIGIN is set to localhost in production');
    }

    // Validate NEXTAUTH_URL
    if (env.NEXTAUTH_URL?.includes('localhost')) {
      console.warn('⚠️  Warning: NEXTAUTH_URL contains localhost in production');
    }
  }
}

// Helper function to check if feature is enabled
export function isFeatureEnabled(feature: string, env?: Environment): boolean {
  const envToUse = env || validateEnv();
  const featureKey = `FEATURE_${feature.toUpperCase()}` as keyof Environment;
  const value = envToUse[featureKey];
  return value === 'true' || value === true;
}

// Helper function to get numeric environment variables
export function getEnvNumber(key: string, defaultValue: number, env?: Environment): number {
  const envToUse = env || validateEnv();
  const value = envToUse[key as keyof Environment];
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

// Helper function to get boolean environment variables
export function getEnvBoolean(key: string, defaultValue: boolean, env?: Environment): boolean {
  const envToUse = env || validateEnv();
  const value = envToUse[key as keyof Environment];
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return defaultValue;
}

// Environment summary for debugging
export function getEnvironmentSummary(): object {
  const env = validateEnv();

  return {
    environment: env.NODE_ENV,
    deployment: env.ENVIRONMENT,
    database: env.DATABASE_URL?.includes('postgresql') ? 'PostgreSQL' : 'SQLite',
    redis: env.REDIS_URL ? 'Configured' : 'Not configured',
    email: env.SMTP_HOST ? 'Configured' : 'Not configured',
    ai: env.OPENAI_API_KEY ? 'Configured' : 'Not configured',
    monitoring: {
      sentry: env.SENTRY_DSN ? 'Configured' : 'Not configured',
      newRelic: env.NEW_RELIC_LICENSE_KEY ? 'Configured' : 'Not configured',
    },
    features: {
      aiSelectors: isFeatureEnabled('AI_SELECTORS', env),
      browserFarm: isFeatureEnabled('BROWSER_FARM', env),
      realTimeMonitoring: isFeatureEnabled('REAL_TIME_MONITORING', env),
      proxyManagement: isFeatureEnabled('PROXY_MANAGEMENT', env),
      visualPipelines: isFeatureEnabled('VISUAL_PIPELINES', env),
    },
    security: {
      rateLimiting: `${env.RATE_LIMIT_REQUESTS_PER_MINUTE}/min, ${env.RATE_LIMIT_REQUESTS_PER_HOUR}/hour`,
      cors: env.CORS_ORIGIN,
      healthChecks: getEnvBoolean('HEALTH_CHECK_ENABLED', true, env),
    }
  };
}

// Initialize and export validated environment
export const env = validateEnv();
