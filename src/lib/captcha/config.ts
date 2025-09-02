import type { CaptchaSolverConfig } from './captcha-solver';

// Default configuration for CAPTCHA solving
export const DEFAULT_CAPTCHA_CONFIG: CaptchaSolverConfig = {
  providers: [
    {
      name: '2captcha',
      apiKey: process.env.TWOCAPTCHA_API_KEY || '',
      baseUrl: 'http://2captcha.com',
      enabled: !!process.env.TWOCAPTCHA_API_KEY,
      priority: 1, // Highest priority
      rateLimits: {
        requestsPerMinute: 120,
        requestsPerHour: 7200
      },
      pricing: {
        recaptcha: 0.002, // $0.002 per solve
        hcaptcha: 0.002,
        funcaptcha: 0.002,
        textCaptcha: 0.001
      }
    },
    {
      name: 'anticaptcha',
      apiKey: process.env.ANTICAPTCHA_API_KEY || '',
      baseUrl: 'https://api.anti-captcha.com',
      enabled: !!process.env.ANTICAPTCHA_API_KEY,
      priority: 2,
      rateLimits: {
        requestsPerMinute: 100,
        requestsPerHour: 6000
      },
      pricing: {
        recaptcha: 0.002,
        hcaptcha: 0.002,
        funcaptcha: 0.002,
        textCaptcha: 0.0005
      }
    },
    {
      name: 'capmonster',
      apiKey: process.env.CAPMONSTER_API_KEY || '',
      baseUrl: 'https://api.capmonster.cloud',
      enabled: !!process.env.CAPMONSTER_API_KEY,
      priority: 3,
      rateLimits: {
        requestsPerMinute: 200,
        requestsPerHour: 12000
      },
      pricing: {
        recaptcha: 0.0015,
        hcaptcha: 0.0015,
        funcaptcha: 0.0015,
        textCaptcha: 0.0005
      }
    },
    {
      name: 'deathbycaptcha',
      apiKey: process.env.DEATHBYCAPTCHA_API_KEY || '',
      baseUrl: 'http://api.dbcapi.me',
      enabled: !!process.env.DEATHBYCAPTCHA_API_KEY,
      priority: 4,
      rateLimits: {
        requestsPerMinute: 60,
        requestsPerHour: 3600
      },
      pricing: {
        recaptcha: 0.0039,
        hcaptcha: 0.0039,
        funcaptcha: 0.0039,
        textCaptcha: 0.00139
      }
    }
  ],
  fallbackStrategy: 'next_provider',
  maxRetries: 3,
  timeout: 120, // 2 minutes
  budget: {
    dailyLimit: 50, // $50 per day
    monthlyLimit: 1000, // $1000 per month
    currency: 'USD'
  }
};

export const CAPTCHA_TYPES = {
  RECAPTCHA_V2: 'recaptcha_v2',
  RECAPTCHA_V3: 'recaptcha_v3',
  HCAPTCHA: 'hcaptcha',
  FUNCAPTCHA: 'funcaptcha',
  TEXT_CAPTCHA: 'text_captcha',
  GEETEST: 'geetest'
} as const;

export const CAPTCHA_SELECTORS = {
  // Common reCAPTCHA v2 selectors
  RECAPTCHA_V2: [
    '.g-recaptcha',
    '[data-sitekey]',
    'iframe[src*="recaptcha"]',
    '#recaptcha',
    '.recaptcha'
  ],

  // Common hCaptcha selectors
  HCAPTCHA: [
    '.h-captcha',
    '[data-sitekey][data-theme]',
    'iframe[src*="hcaptcha"]',
    '#hcaptcha',
    '.hcaptcha'
  ],

  // Common FunCaptcha selectors
  FUNCAPTCHA: [
    '.funcaptcha',
    '#funcaptcha',
    '[data-pkey]',
    'iframe[src*="funcaptcha"]',
    '.arkoselabs-challenge'
  ],

  // Text-based captchas
  TEXT_CAPTCHA: [
    'img[src*="captcha"]',
    '.captcha-image',
    '#captcha',
    '.verification-image',
    '[alt*="captcha" i]'
  ]
};

// Environment variable helpers
export const getCaptchaConfig = (): CaptchaSolverConfig => {
  const config = { ...DEFAULT_CAPTCHA_CONFIG };

  // Override with environment-specific settings
  if (process.env.CAPTCHA_TIMEOUT) {
    config.timeout = Number.parseInt(process.env.CAPTCHA_TIMEOUT);
  }

  if (process.env.CAPTCHA_MAX_RETRIES) {
    config.maxRetries = Number.parseInt(process.env.CAPTCHA_MAX_RETRIES);
  }

  if (process.env.CAPTCHA_DAILY_LIMIT) {
    config.budget!.dailyLimit = Number.parseFloat(process.env.CAPTCHA_DAILY_LIMIT);
  }

  if (process.env.CAPTCHA_MONTHLY_LIMIT) {
    config.budget!.monthlyLimit = Number.parseFloat(process.env.CAPTCHA_MONTHLY_LIMIT);
  }

  // Filter out disabled providers
  config.providers = config.providers.filter(p => p.enabled);

  return config;
};

export const validateCaptchaConfig = (config: CaptchaSolverConfig): string[] => {
  const errors: string[] = [];

  if (config.providers.length === 0) {
    errors.push('No CAPTCHA providers configured. Add API keys to enable CAPTCHA solving.');
  }

  if (config.timeout <= 0) {
    errors.push('CAPTCHA timeout must be greater than 0');
  }

  if (config.maxRetries <= 0) {
    errors.push('Max retries must be greater than 0');
  }

  // Validate provider configurations
  config.providers.forEach((provider, index) => {
    if (!provider.apiKey) {
      errors.push(`Provider ${provider.name} missing API key`);
    }

    if (!provider.baseUrl) {
      errors.push(`Provider ${provider.name} missing base URL`);
    }

    if (provider.priority <= 0) {
      errors.push(`Provider ${provider.name} priority must be greater than 0`);
    }
  });

  return errors;
};
