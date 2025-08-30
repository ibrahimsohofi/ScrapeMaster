import type { NodeExecutor, NodeConfiguration, ExecutionContext, NodeExecutionResult, DataSchema, DataType } from '../visual-editor';

// Extract Node - Extract data from HTML, JSON, or text
export class ExtractNodeExecutor implements NodeExecutor {
  async execute(
    config: NodeConfiguration,
    inputs: any[],
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const input = inputs[0];
    const { extractType, selectors, patterns } = config;

    let extractedData: any[] = [];

    try {
      switch (extractType) {
        case 'css':
          extractedData = this.extractWithCSS(input, selectors);
          break;
        case 'xpath':
          extractedData = this.extractWithXPath(input, selectors);
          break;
        case 'regex':
          extractedData = this.extractWithRegex(input, patterns);
          break;
        case 'json':
          extractedData = this.extractFromJSON(input, config.jsonPath);
          break;
        default:
          throw new Error(`Unsupported extract type: ${extractType}`);
      }

      const schema: DataSchema = {
        type: 'array',
        items: { type: 'object' }
      };

      return {
        outputs: [extractedData],
        schemas: [schema],
        preview: this.generatePreview(extractedData),
        validation: this.validateExtraction(extractedData, config)
      };

    } catch (error) {
      throw new Error(`Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractWithCSS(html: string, selectors: { [key: string]: string }): any[] {
    // In production, use cheerio or similar HTML parser
    const results: any[] = [];

    // Mock extraction logic
    Object.entries(selectors).forEach(([field, selector]) => {
      results.push({
        field,
        selector,
        value: `Extracted value for ${selector}`,
        extractedAt: new Date()
      });
    });

    return results;
  }

  private extractWithXPath(html: string, selectors: { [key: string]: string }): any[] {
    // Mock XPath extraction
    return Object.entries(selectors).map(([field, xpath]) => ({
      field,
      xpath,
      value: `XPath extracted: ${xpath}`,
      extractedAt: new Date()
    }));
  }

  private extractWithRegex(text: string, patterns: { [key: string]: string }): any[] {
    const results: any[] = [];

    Object.entries(patterns).forEach(([field, pattern]) => {
      const regex = new RegExp(pattern, 'g');
      const matches = text.match(regex) || [];

      matches.forEach((match, index) => {
        results.push({
          field,
          pattern,
          match,
          index,
          extractedAt: new Date()
        });
      });
    });

    return results;
  }

  private extractFromJSON(data: any, jsonPath: string): any[] {
    // Simple JSON path extraction (in production, use proper JSONPath library)
    const pathParts = jsonPath.split('.');
    let current = data;

    for (const part of pathParts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        current = null;
        break;
      }
    }

    return Array.isArray(current) ? current : [current];
  }

  private generatePreview(data: any[]): any {
    return {
      sample: data.slice(0, 10),
      schema: { type: 'array', items: { type: 'object' } },
      rowCount: data.length,
      columns: this.inferColumns(data),
      quality: this.assessDataQuality(data)
    };
  }

  private inferColumns(data: any[]): any[] {
    if (data.length === 0) return [];

    const sample = data[0];
    if (typeof sample !== 'object') return [];

    return Object.keys(sample).map(key => ({
      name: key,
      type: this.inferDataType(sample[key]),
      nullable: data.some(item => item[key] == null),
      uniqueValues: new Set(data.map(item => item[key])).size
    }));
  }

  private inferDataType(value: any): DataType {
    if (value == null) return 'text';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (value instanceof Date) return 'date';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';

    // Check for URL pattern
    if (typeof value === 'string' && value.match(/^https?:\/\//)) return 'url';

    // Check for email pattern
    if (typeof value === 'string' && value.includes('@')) return 'email';

    return 'text';
  }

  private assessDataQuality(data: any[]): any {
    if (data.length === 0) {
      return { completeness: 0, validity: 0, consistency: 0, accuracy: 0, overall: 0 };
    }

    const completeness = this.calculateCompleteness(data);
    const validity = this.calculateValidity(data);
    const consistency = this.calculateConsistency(data);
    const accuracy = 95; // Mock accuracy score

    const overall = (completeness + validity + consistency + accuracy) / 4;

    return { completeness, validity, consistency, accuracy, overall };
  }

  private calculateCompleteness(data: any[]): number {
    const totalFields = data.length * Object.keys(data[0] || {}).length;
    const nonNullFields = data.reduce((count, item) => {
      return count + Object.values(item).filter(val => val != null).length;
    }, 0);

    return totalFields > 0 ? (nonNullFields / totalFields) * 100 : 0;
  }

  private calculateValidity(data: any[]): number {
    // Mock validity calculation
    return 95;
  }

  private calculateConsistency(data: any[]): number {
    // Mock consistency calculation
    return 90;
  }

  private validateExtraction(data: any[], config: NodeConfiguration): any {
    const errors: any[] = [];
    const warnings: any[] = [];

    if (data.length === 0) {
      warnings.push({
        field: 'output',
        message: 'No data was extracted',
        suggestion: 'Check your selectors or patterns'
      });
    }

    if (config.minItems && data.length < config.minItems) {
      errors.push({
        field: 'output',
        message: `Expected at least ${config.minItems} items, got ${data.length}`,
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, 100 - errors.length * 20 - warnings.length * 5)
    };
  }
}

// Transform Node - Apply transformations to data
export class TransformNodeExecutor implements NodeExecutor {
  async execute(
    config: NodeConfiguration,
    inputs: any[],
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const input = inputs[0];
    const { transformType, transformations, customScript } = config;

    let transformedData: any;

    try {
      switch (transformType) {
        case 'map':
          transformedData = this.applyMappings(input, transformations);
          break;
        case 'aggregate':
          transformedData = this.applyAggregations(input, transformations);
          break;
        case 'normalize':
          transformedData = this.normalizeData(input, transformations);
          break;
        case 'custom':
          transformedData = await this.executeCustomScript(input, customScript);
          break;
        default:
          throw new Error(`Unsupported transform type: ${transformType}`);
      }

      const schema = this.inferSchema(transformedData);

      return {
        outputs: [transformedData],
        schemas: [schema],
        preview: this.generatePreview(transformedData),
        validation: this.validateTransformation(transformedData, config)
      };

    } catch (error) {
      throw new Error(`Transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private applyMappings(data: any, mappings: { [key: string]: string }): any {
    if (Array.isArray(data)) {
      return data.map(item => this.mapObject(item, mappings));
    } else if (typeof data === 'object' && data !== null) {
      return this.mapObject(data, mappings);
    }
    return data;
  }

  private mapObject(obj: any, mappings: { [key: string]: string }): any {
    const result: any = {};

    Object.entries(mappings).forEach(([newKey, sourcePath]) => {
      const value = this.getNestedValue(obj, sourcePath);
      if (value !== undefined) {
        result[newKey] = value;
      }
    });

    return result;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private applyAggregations(data: any[], aggregations: any[]): any {
    if (!Array.isArray(data)) {
      throw new Error('Aggregation requires array input');
    }

    const result: any = {};

    aggregations.forEach(agg => {
      const { field, operation, groupBy } = agg;

      if (groupBy) {
        result[`${field}_by_${groupBy}`] = this.groupAndAggregate(data, field, operation, groupBy);
      } else {
        result[`${field}_${operation}`] = this.aggregate(data, field, operation);
      }
    });

    return result;
  }

  private aggregate(data: any[], field: string, operation: string): any {
    const values = data.map(item => this.getNestedValue(item, field)).filter(val => val != null);

    switch (operation) {
      case 'count':
        return values.length;
      case 'sum':
        return values.reduce((sum, val) => sum + (Number(val) || 0), 0);
      case 'avg':
        return values.length > 0 ? values.reduce((sum, val) => sum + (Number(val) || 0), 0) / values.length : 0;
      case 'min':
        return Math.min(...values.map(Number));
      case 'max':
        return Math.max(...values.map(Number));
      case 'unique':
        return [...new Set(values)];
      default:
        return null;
    }
  }

  private groupAndAggregate(data: any[], field: string, operation: string, groupBy: string): any {
    const groups: { [key: string]: any[] } = {};

    data.forEach(item => {
      const groupKey = this.getNestedValue(item, groupBy);
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
    });

    const result: any = {};
    Object.entries(groups).forEach(([key, groupData]) => {
      result[key] = this.aggregate(groupData, field, operation);
    });

    return result;
  }

  private normalizeData(data: any, config: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.normalizeItem(item, config));
    } else if (typeof data === 'object' && data !== null) {
      return this.normalizeItem(data, config);
    }
    return data;
  }

  private normalizeItem(item: any, config: any): any {
    const result = { ...item };

    Object.entries(config.normalizations || {}).forEach(([field, normalization]: [string, any]) => {
      const value = this.getNestedValue(result, field);
      if (value !== undefined) {
        result[field] = this.applyNormalization(value, normalization);
      }
    });

    return result;
  }

  private applyNormalization(value: any, normalization: any): any {
    const { type, options } = normalization;

    switch (type) {
      case 'lowercase':
        return String(value).toLowerCase();
      case 'uppercase':
        return String(value).toUpperCase();
      case 'trim':
        return String(value).trim();
      case 'number':
        return Number(value) || 0;
      case 'date':
        return new Date(value);
      case 'remove_html':
        return String(value).replace(/<[^>]*>/g, '');
      case 'extract_domain':
        try {
          return new URL(String(value)).hostname;
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  private async executeCustomScript(data: any, script: string): Promise<any> {
    // In production, use a secure sandbox environment
    try {
      const func = new Function('data', 'context', script);
      return func(data, {});
    } catch (error) {
      throw new Error(`Custom script execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private inferSchema(data: any): DataSchema {
    if (Array.isArray(data)) {
      return {
        type: 'array',
        items: data.length > 0 ? this.inferSchema(data[0]) : { type: 'object' }
      };
    } else if (typeof data === 'object' && data !== null) {
      const properties: { [key: string]: DataSchema } = {};
      Object.entries(data).forEach(([key, value]) => {
        properties[key] = this.inferSchema(value);
      });
      return { type: 'object', properties };
    } else {
      return { type: this.inferPrimitiveType(data) };
    }
  }

  private inferPrimitiveType(value: any): DataType {
    if (value == null) return 'text';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (value instanceof Date) return 'date';
    return 'text';
  }

  private generatePreview(data: any): any {
    const sample = Array.isArray(data) ? data.slice(0, 10) : [data];

    return {
      sample,
      schema: this.inferSchema(data),
      rowCount: Array.isArray(data) ? data.length : 1,
      columns: this.inferColumns(sample),
      quality: this.assessDataQuality(sample)
    };
  }

  private inferColumns(data: any[]): any[] {
    if (data.length === 0) return [];

    const sample = data[0];
    if (typeof sample !== 'object') return [];

    return Object.keys(sample).map(key => ({
      name: key,
      type: this.inferPrimitiveType(sample[key]),
      nullable: data.some(item => item[key] == null),
      uniqueValues: new Set(data.map(item => item[key])).size
    }));
  }

  private assessDataQuality(data: any[]): any {
    return {
      completeness: 95,
      validity: 90,
      consistency: 85,
      accuracy: 90,
      overall: 90
    };
  }

  private validateTransformation(data: any, config: NodeConfiguration): any {
    return {
      isValid: true,
      errors: [],
      warnings: [],
      score: 95
    };
  }
}

// Filter Node - Filter data based on conditions
export class FilterNodeExecutor implements NodeExecutor {
  async execute(
    config: NodeConfiguration,
    inputs: any[],
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const input = inputs[0];
    const { conditions, logic } = config;

    if (!Array.isArray(input)) {
      throw new Error('Filter node requires array input');
    }

    const filteredData = input.filter(item =>
      this.evaluateConditions(item, conditions, logic || 'AND')
    );

    const schema: DataSchema = {
      type: 'array',
      items: { type: 'object' }
    };

    return {
      outputs: [filteredData],
      schemas: [schema],
      preview: this.generatePreview(filteredData),
      validation: this.validateFilter(filteredData, input, config)
    };
  }

  private evaluateConditions(item: any, conditions: any[], logic: string): boolean {
    const results = conditions.map(condition => this.evaluateCondition(item, condition));

    switch (logic.toUpperCase()) {
      case 'AND':
        return results.every(result => result);
      case 'OR':
        return results.some(result => result);
      case 'NOT':
        return !results[0];
      default:
        return results.every(result => result);
    }
  }

  private evaluateCondition(item: any, condition: any): boolean {
    const { field, operator, value, dataType } = condition;
    const itemValue = this.getNestedValue(item, field);

    const normalizedItemValue = this.normalizeValue(itemValue, dataType);
    const normalizedConditionValue = this.normalizeValue(value, dataType);

    switch (operator) {
      case 'equals':
        return normalizedItemValue === normalizedConditionValue;
      case 'not_equals':
        return normalizedItemValue !== normalizedConditionValue;
      case 'greater_than':
        return normalizedItemValue > normalizedConditionValue;
      case 'less_than':
        return normalizedItemValue < normalizedConditionValue;
      case 'greater_equal':
        return normalizedItemValue >= normalizedConditionValue;
      case 'less_equal':
        return normalizedItemValue <= normalizedConditionValue;
      case 'contains':
        return String(normalizedItemValue).includes(String(normalizedConditionValue));
      case 'not_contains':
        return !String(normalizedItemValue).includes(String(normalizedConditionValue));
      case 'starts_with':
        return String(normalizedItemValue).startsWith(String(normalizedConditionValue));
      case 'ends_with':
        return String(normalizedItemValue).endsWith(String(normalizedConditionValue));
      case 'regex':
        try {
          const regex = new RegExp(String(normalizedConditionValue));
          return regex.test(String(normalizedItemValue));
        } catch {
          return false;
        }
      case 'is_null':
        return itemValue == null;
      case 'is_not_null':
        return itemValue != null;
      case 'in':
        return Array.isArray(normalizedConditionValue) &&
               normalizedConditionValue.includes(normalizedItemValue);
      case 'not_in':
        return Array.isArray(normalizedConditionValue) &&
               !normalizedConditionValue.includes(normalizedItemValue);
      default:
        return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private normalizeValue(value: any, dataType: string): any {
    switch (dataType) {
      case 'number':
        return Number(value) || 0;
      case 'boolean':
        return Boolean(value);
      case 'date':
        return value instanceof Date ? value : new Date(value);
      case 'text':
      default:
        return String(value);
    }
  }

  private generatePreview(data: any[]): any {
    return {
      sample: data.slice(0, 10),
      schema: { type: 'array', items: { type: 'object' } },
      rowCount: data.length,
      columns: this.inferColumns(data),
      quality: this.assessDataQuality(data)
    };
  }

  private inferColumns(data: any[]): any[] {
    if (data.length === 0) return [];

    const sample = data[0];
    if (typeof sample !== 'object') return [];

    return Object.keys(sample).map(key => ({
      name: key,
      type: this.inferDataType(sample[key]),
      nullable: data.some(item => item[key] == null),
      uniqueValues: new Set(data.map(item => item[key])).size
    }));
  }

  private inferDataType(value: any): DataType {
    if (value == null) return 'text';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (value instanceof Date) return 'date';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return 'text';
  }

  private assessDataQuality(data: any[]): any {
    return {
      completeness: 90,
      validity: 95,
      consistency: 90,
      accuracy: 95,
      overall: 92
    };
  }

  private validateFilter(filteredData: any[], originalData: any[], config: NodeConfiguration): any {
    const warnings: any[] = [];

    const reductionPercentage = ((originalData.length - filteredData.length) / originalData.length) * 100;

    if (reductionPercentage > 90) {
      warnings.push({
        field: 'filter',
        message: `Filter removed ${reductionPercentage.toFixed(1)}% of data`,
        suggestion: 'Consider reviewing filter conditions'
      });
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      score: 95
    };
  }
}

// Validate Node - Validate data quality and structure
export class ValidateNodeExecutor implements NodeExecutor {
  async execute(
    config: NodeConfiguration,
    inputs: any[],
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const input = inputs[0];
    const { validationRules, strictMode } = config;

    const validationResult = this.performValidation(input, validationRules, strictMode);

    // If strict mode, only pass valid data
    const outputData = strictMode ?
      this.filterValidData(input, validationResult) :
      input;

    return {
      outputs: [outputData],
      schemas: [{ type: 'array', items: { type: 'object' } }],
      preview: this.generatePreview(outputData),
      validation: validationResult
    };
  }

  private performValidation(data: any, rules: any[], strictMode: boolean): any {
    const errors: any[] = [];
    const warnings: any[] = [];

    if (!Array.isArray(data)) {
      errors.push({
        field: 'input',
        message: 'Input must be an array',
        severity: 'error'
      });
      return { isValid: false, errors, warnings, score: 0 };
    }

    let validItems = 0;

    data.forEach((item, index) => {
      const itemErrors = this.validateItem(item, rules, index);
      errors.push(...itemErrors.filter(e => e.severity === 'error'));
      warnings.push(...itemErrors.filter(e => e.severity === 'warning'));

      if (itemErrors.filter(e => e.severity === 'error').length === 0) {
        validItems++;
      }
    });

    const isValid = errors.length === 0;
    const score = data.length > 0 ? (validItems / data.length) * 100 : 100;

    return { isValid, errors, warnings, score };
  }

  private validateItem(item: any, rules: any[], index: number): any[] {
    const issues: any[] = [];

    rules.forEach(rule => {
      const { field, validationType, value, message } = rule;
      const fieldValue = this.getNestedValue(item, field);

      switch (validationType) {
        case 'required':
          if (fieldValue == null || fieldValue === '') {
            issues.push({
              field: `item[${index}].${field}`,
              message: message || `Field '${field}' is required`,
              severity: 'error'
            });
          }
          break;

        case 'type':
          if (!this.validateType(fieldValue, value)) {
            issues.push({
              field: `item[${index}].${field}`,
              message: message || `Field '${field}' must be of type '${value}'`,
              severity: 'error'
            });
          }
          break;

        case 'pattern':
          if (fieldValue != null && !new RegExp(value).test(String(fieldValue))) {
            issues.push({
              field: `item[${index}].${field}`,
              message: message || `Field '${field}' does not match required pattern`,
              severity: 'warning'
            });
          }
          break;

        case 'range':
          const numValue = Number(fieldValue);
          if (!isNaN(numValue) && (numValue < value.min || numValue > value.max)) {
            issues.push({
              field: `item[${index}].${field}`,
              message: message || `Field '${field}' must be between ${value.min} and ${value.max}`,
              severity: 'error'
            });
          }
          break;

        case 'length':
          const length = String(fieldValue).length;
          if (value.min && length < value.min) {
            issues.push({
              field: `item[${index}].${field}`,
              message: message || `Field '${field}' is too short (minimum ${value.min} characters)`,
              severity: 'warning'
            });
          }
          if (value.max && length > value.max) {
            issues.push({
              field: `item[${index}].${field}`,
              message: message || `Field '${field}' is too long (maximum ${value.max} characters)`,
              severity: 'warning'
            });
          }
          break;
      }
    });

    return issues;
  }

  private validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(value));
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'url':
        try {
          new URL(String(value));
          return true;
        } catch {
          return false;
        }
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
      default:
        return true;
    }
  }

  private filterValidData(data: any[], validationResult: any): any[] {
    if (!Array.isArray(data)) return [];

    const errorIndexes = new Set();
    validationResult.errors.forEach((error: any) => {
      const match = error.field.match(/item\[(\d+)\]/);
      if (match) {
        errorIndexes.add(Number.parseInt(match[1]));
      }
    });

    return data.filter((_, index) => !errorIndexes.has(index));
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private generatePreview(data: any[]): any {
    return {
      sample: data.slice(0, 10),
      schema: { type: 'array', items: { type: 'object' } },
      rowCount: data.length,
      columns: this.inferColumns(data),
      quality: this.assessDataQuality(data)
    };
  }

  private inferColumns(data: any[]): any[] {
    if (data.length === 0) return [];

    const sample = data[0];
    if (typeof sample !== 'object') return [];

    return Object.keys(sample).map(key => ({
      name: key,
      type: this.inferDataType(sample[key]),
      nullable: data.some(item => item[key] == null),
      uniqueValues: new Set(data.map(item => item[key])).size
    }));
  }

  private inferDataType(value: any): DataType {
    if (value == null) return 'text';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (value instanceof Date) return 'date';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return 'text';
  }

  private assessDataQuality(data: any[]): any {
    return {
      completeness: 95,
      validity: 90,
      consistency: 85,
      accuracy: 90,
      overall: 90
    };
  }
}

// Export all node executors
export const nodeExecutors = {
  extract: new ExtractNodeExecutor(),
  transform: new TransformNodeExecutor(),
  filter: new FilterNodeExecutor(),
  validate: new ValidateNodeExecutor()
};
