import { type Page, Browser } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import { createContext, runInContext } from 'vm';
import winston from 'winston';

export interface CustomScript {
  id: string;
  name: string;
  description: string;
  category: 'data-extraction' | 'interaction' | 'validation' | 'utility' | 'custom';
  version: string;
  author: string;
  code: string;
  dependencies: string[];
  permissions: ScriptPermissions;
  parameters: ScriptParameter[];
  metadata: {
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    downloadCount: number;
    rating: number;
    verified: boolean;
  };
}

export interface ScriptPermissions {
  domAccess: boolean;
  networkRequests: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  cookies: boolean;
  geolocation: boolean;
  notifications: boolean;
  fileSystem: boolean;
  clipboard: boolean;
  camera: boolean;
  microphone: boolean;
  dangerous: boolean; // For eval, Function constructor, etc.
}

export interface ScriptParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'selector';
  required: boolean;
  defaultValue?: any;
  description: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

export interface ExecutionContext {
  id: string;
  sessionId: string;
  page: Page;
  scripts: Map<string, CustomScript>;
  hooks: {
    preExecution: Array<(context: ExecutionContext, script: CustomScript) => Promise<void>>;
    postExecution: Array<(context: ExecutionContext, script: CustomScript, result: any) => Promise<void>>;
    onError: Array<(context: ExecutionContext, script: CustomScript, error: Error) => Promise<void>>;
  };
  sandbox: ScriptSandbox;
  executionLog: ExecutionLogEntry[];
  securityPolicy: SecurityPolicy;
}

export interface ExecutionLogEntry {
  id: string;
  scriptId: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  result?: any;
  error?: string;
  memoryUsage: number;
  permissions: string[];
}

export interface SecurityPolicy {
  maxExecutionTime: number; // milliseconds
  maxMemoryUsage: number; // bytes
  allowedDomains: string[];
  blockedDomains: string[];
  restrictedAPIs: string[];
  sandboxLevel: 'strict' | 'moderate' | 'permissive';
  csp: {
    scriptSrc: string[];
    connectSrc: string[];
    imgSrc: string[];
  };
}

export interface ScriptLibrary {
  id: string;
  name: string;
  description: string;
  scripts: Map<string, CustomScript>;
  categories: Map<string, string[]>; // category -> script IDs
  featured: string[];
  tags: Map<string, string[]>; // tag -> script IDs
}

export class ScriptSandbox {
  private context: any;
  private permissions: ScriptPermissions;
  private securityPolicy: SecurityPolicy;
  private logger: winston.Logger;

  constructor(permissions: ScriptPermissions, securityPolicy: SecurityPolicy) {
    this.permissions = permissions;
    this.securityPolicy = securityPolicy;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });

    this.context = createContext(this.createSandboxEnvironment());
  }

  private createSandboxEnvironment(): any {
    const sandbox: any = {
      console: {
        log: (...args: any[]) => this.logger.info('Script log:', ...args),
        error: (...args: any[]) => this.logger.error('Script error:', ...args),
        warn: (...args: any[]) => this.logger.warn('Script warning:', ...args),
        info: (...args: any[]) => this.logger.info('Script info:', ...args)
      },
      setTimeout: (callback: Function, delay: number) => {
        if (delay > 30000) delay = 30000; // Max 30 seconds
        return setTimeout(callback, delay);
      },
      setInterval: (callback: Function, delay: number) => {
        if (delay < 100) delay = 100; // Min 100ms
        return setInterval(callback, delay);
      },
      clearTimeout,
      clearInterval,
      JSON,
      Math,
      Date,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      Promise,
      Error,
      TypeError,
      ReferenceError,
      SyntaxError
    };

    // Add DOM-like APIs if permitted
    if (this.permissions.domAccess) {
      sandbox.document = this.createSecureDocumentProxy();
      sandbox.window = this.createSecureWindowProxy();
    }

    // Add network APIs if permitted
    if (this.permissions.networkRequests) {
      sandbox.fetch = this.createSecureFetch();
      sandbox.XMLHttpRequest = this.createSecureXHR();
    }

    // Add storage APIs if permitted
    if (this.permissions.localStorage) {
      sandbox.localStorage = this.createSecureStorage('local');
    }

    if (this.permissions.sessionStorage) {
      sandbox.sessionStorage = this.createSecureStorage('session');
    }

    return sandbox;
  }

  private createSecureDocumentProxy(): any {
    return new Proxy({}, {
      get: (target, prop) => {
        if (typeof prop === 'string') {
          switch (prop) {
            case 'querySelector':
              return (selector: string) => this.secureSelector(selector);
            case 'querySelectorAll':
              return (selector: string) => this.secureSelector(selector, true);
            case 'getElementById':
              return (id: string) => this.secureSelector(`#${id}`);
            case 'getElementsByClassName':
              return (className: string) => this.secureSelector(`.${className}`, true);
            case 'getElementsByTagName':
              return (tagName: string) => this.secureSelector(tagName, true);
            case 'createElement':
              return (tagName: string) => ({ tagName, _isSandboxed: true });
            case 'location':
              return { href: window.location.href, hostname: window.location.hostname };
            case 'title':
              return 'Sandboxed Document';
            default:
              return undefined;
          }
        }
        return undefined;
      }
    });
  }

  private createSecureWindowProxy(): any {
    return new Proxy({}, {
      get: (target, prop) => {
        if (typeof prop === 'string') {
          switch (prop) {
            case 'location':
              return { href: window.location.href, hostname: window.location.hostname };
            case 'alert':
              return (message: string) => this.logger.info('Script alert:', message);
            case 'confirm':
              return (message: string) => {
                this.logger.info('Script confirm:', message);
                return false; // Always return false in sandbox
              };
            case 'prompt':
              return (message: string) => {
                this.logger.info('Script prompt:', message);
                return null; // Always return null in sandbox
              };
            default:
              return undefined;
          }
        }
        return undefined;
      }
    });
  }

  private createSecureFetch(): typeof fetch {
    return async (url: RequestInfo | URL, init?: RequestInit) => {
      const urlString = typeof url === 'string' ? url : url.toString();

      // Check against security policy
      if (!this.isUrlAllowed(urlString)) {
        throw new Error(`URL not allowed by security policy: ${urlString}`);
      }

      // Add security headers
      const secureInit: RequestInit = {
        ...init,
        headers: {
          ...init?.headers,
          'X-Sandbox-Request': 'true'
        }
      };

      return fetch(url, secureInit);
    };
  }

  private createSecureXHR(): typeof XMLHttpRequest {
    return class SecureXMLHttpRequest {
      constructor() {
        throw new Error('XMLHttpRequest is disabled in sandbox. Use fetch instead.');
      }
    } as any;
  }

  private createSecureStorage(type: 'local' | 'session'): Storage {
    const storage = new Map<string, string>();

    return {
      getItem: (key: string) => storage.get(key) || null,
      setItem: (key: string, value: string) => {
        if (storage.size > 100) {
          throw new Error('Storage quota exceeded');
        }
        storage.set(key, value);
      },
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
      key: (index: number) => {
        const keys = Array.from(storage.keys());
        return keys[index] || null;
      },
      get length() {
        return storage.size;
      }
    };
  }

  private secureSelector(selector: string, all = false): any {
    // Validate selector to prevent malicious queries
    if (this.isSecureSelector(selector)) {
      return { selector, _isSandboxed: true, all };
    }
    throw new Error(`Unsafe selector: ${selector}`);
  }

  private isSecureSelector(selector: string): boolean {
    // Basic validation - can be enhanced
    const dangerousPatterns = [
      /javascript:/i,
      /vbscript:/i,
      /data:/i,
      /eval\(/i,
      /function\(/i,
      /\[.*javascript.*\]/i
    ];

    return !dangerousPatterns.some(pattern => pattern.test(selector));
  }

  private isUrlAllowed(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Check blocked domains
      if (this.securityPolicy.blockedDomains.includes(domain)) {
        return false;
      }

      // Check allowed domains
      if (this.securityPolicy.allowedDomains.length > 0) {
        return this.securityPolicy.allowedDomains.some(allowed =>
          domain === allowed || domain.endsWith(`.${allowed}`)
        );
      }

      return true;
    } catch {
      return false;
    }
  }

  async execute(code: string, context: any = {}): Promise<any> {
    try {
      return runInContext(code, this.context, { timeout: this.securityPolicy.maxExecutionTime });
    } catch (error) {
      this.logger.error('Script execution error:', error);
      throw error;
    }
  }
}

export class ScriptInjectionFramework {
  private library: ScriptLibrary;
  private contexts: Map<string, ExecutionContext> = new Map();
  private globalHooks: ExecutionContext['hooks'] = {
    preExecution: [],
    postExecution: [],
    onError: []
  };
  private logger: winston.Logger;

  constructor() {
    this.library = {
      id: uuidv4(),
      name: 'TechFlow Script Library',
      description: 'Comprehensive collection of web scraping scripts',
      scripts: new Map(),
      categories: new Map(),
      featured: [],
      tags: new Map()
    };

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'script-injection.log' })
      ]
    });

    this.initializeBuiltInScripts();
  }

  // Script Library Management
  async addScript(script: Omit<CustomScript, 'id' | 'metadata'>): Promise<string> {
    const scriptId = uuidv4();
    const fullScript: CustomScript = {
      ...script,
      id: scriptId,
      metadata: {
        tags: script.parameters.map(p => p.type),
        createdAt: new Date(),
        updatedAt: new Date(),
        downloadCount: 0,
        rating: 0,
        verified: false
      }
    };

    // Validate script
    await this.validateScript(fullScript);

    this.library.scripts.set(scriptId, fullScript);
    this.categorizeScript(scriptId, script.category);

    this.logger.info(`Added script ${scriptId}: ${script.name}`);
    return scriptId;
  }

  async updateScript(scriptId: string, updates: Partial<CustomScript>): Promise<void> {
    const script = this.library.scripts.get(scriptId);
    if (!script) {
      throw new Error(`Script ${scriptId} not found`);
    }

    const updatedScript = {
      ...script,
      ...updates,
      metadata: {
        ...script.metadata,
        updatedAt: new Date()
      }
    };

    await this.validateScript(updatedScript);
    this.library.scripts.set(scriptId, updatedScript);

    this.logger.info(`Updated script ${scriptId}`);
  }

  async deleteScript(scriptId: string): Promise<void> {
    this.library.scripts.delete(scriptId);

    // Remove from categories
    for (const [category, scripts] of this.library.categories) {
      const index = scripts.indexOf(scriptId);
      if (index > -1) {
        scripts.splice(index, 1);
      }
    }

    // Remove from featured
    const featuredIndex = this.library.featured.indexOf(scriptId);
    if (featuredIndex > -1) {
      this.library.featured.splice(featuredIndex, 1);
    }

    this.logger.info(`Deleted script ${scriptId}`);
  }

  private async validateScript(script: CustomScript): Promise<void> {
    // Basic validation
    if (!script.code || script.code.trim().length === 0) {
      throw new Error('Script code cannot be empty');
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      /eval\(/,
      /Function\(/,
      /setTimeout\(['"].*['"]\)/,
      /setInterval\(['"].*['"]\)/,
      /document\.write/,
      /innerHTML\s*=/,
      /outerHTML\s*=/,
      /execScript/,
      /javascript:/,
      /vbscript:/
    ];

    if (script.permissions.dangerous) {
      this.logger.warn(`Script ${script.id} has dangerous permissions`);
    } else {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(script.code)) {
          throw new Error(`Script contains potentially dangerous code: ${pattern.source}`);
        }
      }
    }

    // Validate dependencies
    for (const dependency of script.dependencies) {
      if (!this.library.scripts.has(dependency)) {
        throw new Error(`Dependency not found: ${dependency}`);
      }
    }
  }

  private categorizeScript(scriptId: string, category: string): void {
    if (!this.library.categories.has(category)) {
      this.library.categories.set(category, []);
    }
    this.library.categories.get(category)!.push(scriptId);
  }

  // Execution Context Management
  async createExecutionContext(sessionId: string, page: Page, securityPolicy?: Partial<SecurityPolicy>): Promise<string> {
    const contextId = uuidv4();

    const defaultSecurityPolicy: SecurityPolicy = {
      maxExecutionTime: 30000, // 30 seconds
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      allowedDomains: [],
      blockedDomains: ['localhost', '127.0.0.1', '0.0.0.0'],
      restrictedAPIs: ['eval', 'Function', 'setTimeout', 'setInterval'],
      sandboxLevel: 'moderate',
      csp: {
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:']
      }
    };

    const finalSecurityPolicy = { ...defaultSecurityPolicy, ...securityPolicy };

    const context: ExecutionContext = {
      id: contextId,
      sessionId,
      page,
      scripts: new Map(),
      hooks: {
        preExecution: [...this.globalHooks.preExecution],
        postExecution: [...this.globalHooks.postExecution],
        onError: [...this.globalHooks.onError]
      },
      sandbox: new ScriptSandbox({
        domAccess: true,
        networkRequests: true,
        localStorage: false,
        sessionStorage: false,
        cookies: false,
        geolocation: false,
        notifications: false,
        fileSystem: false,
        clipboard: false,
        camera: false,
        microphone: false,
        dangerous: false
      }, finalSecurityPolicy),
      executionLog: [],
      securityPolicy: finalSecurityPolicy
    };

    this.contexts.set(contextId, context);
    this.logger.info(`Created execution context ${contextId}`);

    return contextId;
  }

  async destroyExecutionContext(contextId: string): Promise<void> {
    this.contexts.delete(contextId);
    this.logger.info(`Destroyed execution context ${contextId}`);
  }

  // Script Execution
  async executeScript(
    contextId: string,
    scriptId: string,
    parameters: Record<string, any> = {}
  ): Promise<{
    success: boolean;
    result?: any;
    error?: string;
    executionTime: number;
    memoryUsage: number;
  }> {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new Error(`Execution context ${contextId} not found`);
    }

    const script = this.library.scripts.get(scriptId);
    if (!script) {
      throw new Error(`Script ${scriptId} not found`);
    }

    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    const logEntry: ExecutionLogEntry = {
      id: uuidv4(),
      scriptId,
      timestamp: new Date(),
      duration: 0,
      success: false,
      memoryUsage: 0,
      permissions: Object.keys(script.permissions).filter(key =>
        script.permissions[key as keyof ScriptPermissions]
      )
    };

    try {
      // Pre-execution hooks
      for (const hook of context.hooks.preExecution) {
        await hook(context, script);
      }

      // Validate parameters
      const validatedParams = this.validateParameters(script.parameters, parameters);

      // Load dependencies
      await this.loadDependencies(context, script.dependencies);

      // Prepare execution environment
      const executionEnv = {
        page: context.page,
        parameters: validatedParams,
        utils: this.createUtilityFunctions(),
        ...this.createPageInterface(context.page)
      };

      // Execute script in sandbox
      const result = await context.sandbox.execute(script.code, executionEnv);

      logEntry.success = true;
      logEntry.result = result;

      // Post-execution hooks
      for (const hook of context.hooks.postExecution) {
        await hook(context, script, result);
      }

      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;

      logEntry.duration = endTime - startTime;
      logEntry.memoryUsage = endMemory - startMemory;

      context.executionLog.push(logEntry);

      // Update script metadata
      script.metadata.downloadCount++;

      this.logger.info(`Script ${scriptId} executed successfully in ${logEntry.duration}ms`);

      return {
        success: true,
        result,
        executionTime: logEntry.duration,
        memoryUsage: logEntry.memoryUsage
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logEntry.success = false;
      logEntry.error = errorMessage;
      logEntry.duration = Date.now() - startTime;
      logEntry.memoryUsage = process.memoryUsage().heapUsed - startMemory;

      context.executionLog.push(logEntry);

      // Error hooks
      for (const hook of context.hooks.onError) {
        await hook(context, script, error as Error);
      }

      this.logger.error(`Script ${scriptId} execution failed: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
        executionTime: logEntry.duration,
        memoryUsage: logEntry.memoryUsage
      };
    }
  }

  private validateParameters(scriptParams: ScriptParameter[], provided: Record<string, any>): Record<string, any> {
    const validated: Record<string, any> = {};

    for (const param of scriptParams) {
      const value = provided[param.name];

      if (param.required && (value === undefined || value === null)) {
        throw new Error(`Required parameter missing: ${param.name}`);
      }

      if (value !== undefined) {
        // Type validation
        switch (param.type) {
          case 'string':
            if (typeof value !== 'string') {
              throw new Error(`Parameter ${param.name} must be a string`);
            }
            break;
          case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
              throw new Error(`Parameter ${param.name} must be a number`);
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              throw new Error(`Parameter ${param.name} must be a boolean`);
            }
            break;
          case 'array':
            if (!Array.isArray(value)) {
              throw new Error(`Parameter ${param.name} must be an array`);
            }
            break;
          case 'object':
            if (typeof value !== 'object' || Array.isArray(value)) {
              throw new Error(`Parameter ${param.name} must be an object`);
            }
            break;
        }

        // Validation rules
        if (param.validation) {
          if (param.validation.min !== undefined && value < param.validation.min) {
            throw new Error(`Parameter ${param.name} must be at least ${param.validation.min}`);
          }
          if (param.validation.max !== undefined && value > param.validation.max) {
            throw new Error(`Parameter ${param.name} must be at most ${param.validation.max}`);
          }
          if (param.validation.pattern && !new RegExp(param.validation.pattern).test(value)) {
            throw new Error(`Parameter ${param.name} does not match required pattern`);
          }
          if (param.validation.enum && !param.validation.enum.includes(value)) {
            throw new Error(`Parameter ${param.name} must be one of: ${param.validation.enum.join(', ')}`);
          }
        }

        validated[param.name] = value;
      } else if (param.defaultValue !== undefined) {
        validated[param.name] = param.defaultValue;
      }
    }

    return validated;
  }

  private async loadDependencies(context: ExecutionContext, dependencies: string[]): Promise<void> {
    for (const depId of dependencies) {
      if (!context.scripts.has(depId)) {
        const dependency = this.library.scripts.get(depId);
        if (dependency) {
          context.scripts.set(depId, dependency);
        }
      }
    }
  }

  private createUtilityFunctions(): any {
    return {
      delay: (ms: number) => new Promise(resolve => setTimeout(resolve, Math.min(ms, 10000))),
      random: (min: number, max: number) => Math.random() * (max - min) + min,
      randomInt: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
      uuid: () => uuidv4(),
      formatDate: (date: Date) => date.toISOString(),
      parseJson: (json: string) => {
        try {
          return JSON.parse(json);
        } catch {
          return null;
        }
      }
    };
  }

  private createPageInterface(page: Page): any {
    return {
      goto: (url: string) => page.goto(url),
      click: (selector: string) => page.click(selector),
      type: (selector: string, text: string) => page.fill(selector, text),
      getText: (selector: string) => page.textContent(selector),
      getAttribute: (selector: string, name: string) => page.getAttribute(selector, name),
      waitForSelector: (selector: string, timeout = 5000) => page.waitForSelector(selector, { timeout }),
      screenshot: (options?: any) => page.screenshot(options),
      pdf: (options?: any) => page.pdf(options),
      evaluate: (fn: any, ...args: any[]) => page.evaluate(fn, ...args)
    };
  }

  // Built-in Scripts
  private initializeBuiltInScripts(): void {
    const builtInScripts: Omit<CustomScript, 'id' | 'metadata'>[] = [
      {
        name: 'Extract All Links',
        description: 'Extracts all links from the current page',
        category: 'data-extraction',
        version: '1.0.0',
        author: 'TechFlow',
        code: `
          const links = Array.from(document.querySelectorAll('a[href]')).map(link => ({
            text: link.textContent?.trim() || '',
            href: link.href,
            title: link.title || ''
          }));
          return links;
        `,
        dependencies: [],
        permissions: {
          domAccess: true,
          networkRequests: false,
          localStorage: false,
          sessionStorage: false,
          cookies: false,
          geolocation: false,
          notifications: false,
          fileSystem: false,
          clipboard: false,
          camera: false,
          microphone: false,
          dangerous: false
        },
        parameters: []
      },
      {
        name: 'Extract Table Data',
        description: 'Extracts data from HTML tables',
        category: 'data-extraction',
        version: '1.0.0',
        author: 'TechFlow',
        code: `
          const tableSelector = parameters.tableSelector || 'table';
          const tables = document.querySelectorAll(tableSelector);
          const result = [];

          tables.forEach((table, tableIndex) => {
            const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim() || '');
            const rows = Array.from(table.querySelectorAll('tr')).slice(headers.length > 0 ? 1 : 0);

            const tableData = rows.map(row => {
              const cells = Array.from(row.querySelectorAll('td, th'));
              const rowData = {};

              cells.forEach((cell, cellIndex) => {
                const header = headers[cellIndex] || \`Column \${cellIndex + 1}\`;
                rowData[header] = cell.textContent?.trim() || '';
              });

              return rowData;
            });

            result.push({
              tableIndex,
              headers,
              data: tableData
            });
          });

          return result;
        `,
        dependencies: [],
        permissions: {
          domAccess: true,
          networkRequests: false,
          localStorage: false,
          sessionStorage: false,
          cookies: false,
          geolocation: false,
          notifications: false,
          fileSystem: false,
          clipboard: false,
          camera: false,
          microphone: false,
          dangerous: false
        },
        parameters: [
          {
            name: 'tableSelector',
            type: 'selector',
            required: false,
            defaultValue: 'table',
            description: 'CSS selector for tables to extract'
          }
        ]
      },
      {
        name: 'Auto-fill Form',
        description: 'Automatically fills form fields with provided data',
        category: 'interaction',
        version: '1.0.0',
        author: 'TechFlow',
        code: `
          const formData = parameters.formData || {};

          for (const [fieldName, value] of Object.entries(formData)) {
            const field = document.querySelector(\`[name="\${fieldName}"], #\${fieldName}\`);
            if (field) {
              if (field.type === 'checkbox' || field.type === 'radio') {
                field.checked = Boolean(value);
              } else {
                field.value = String(value);
              }
            }
          }

          return { filled: Object.keys(formData).length };
        `,
        dependencies: [],
        permissions: {
          domAccess: true,
          networkRequests: false,
          localStorage: false,
          sessionStorage: false,
          cookies: false,
          geolocation: false,
          notifications: false,
          fileSystem: false,
          clipboard: false,
          camera: false,
          microphone: false,
          dangerous: false
        },
        parameters: [
          {
            name: 'formData',
            type: 'object',
            required: true,
            description: 'Object containing field names and values to fill'
          }
        ]
      }
    ];

    builtInScripts.forEach(script => {
      this.addScript(script).catch(error => {
        this.logger.error(`Failed to add built-in script: ${error}`);
      });
    });
  }

  // Public API
  getScript(scriptId: string): CustomScript | undefined {
    return this.library.scripts.get(scriptId);
  }

  getScriptsByCategory(category: string): CustomScript[] {
    const scriptIds = this.library.categories.get(category) || [];
    return scriptIds.map(id => this.library.scripts.get(id)!).filter(Boolean);
  }

  searchScripts(query: string): CustomScript[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.library.scripts.values()).filter(script =>
      script.name.toLowerCase().includes(lowerQuery) ||
      script.description.toLowerCase().includes(lowerQuery) ||
      script.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  getFeaturedScripts(): CustomScript[] {
    return this.library.featured.map(id => this.library.scripts.get(id)!).filter(Boolean);
  }

  getExecutionLog(contextId: string): ExecutionLogEntry[] {
    const context = this.contexts.get(contextId);
    return context ? context.executionLog : [];
  }

  // Hook Management
  addGlobalHook(type: keyof ExecutionContext['hooks'], hook: any): void {
    this.globalHooks[type].push(hook);
  }

  addContextHook(contextId: string, type: keyof ExecutionContext['hooks'], hook: any): void {
    const context = this.contexts.get(contextId);
    if (context) {
      context.hooks[type].push(hook);
    }
  }
}
