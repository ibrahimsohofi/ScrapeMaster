import { z } from 'zod';

// Data Quality Metrics and Scoring
export interface DataQualityMetrics {
  completeness: number;      // % of non-null values
  validity: number;          // % of values passing validation rules
  consistency: number;       // % of values matching expected patterns
  accuracy: number;          // % of values matching known good data
  uniqueness: number;        // % of unique values (for fields that should be unique)
  timeliness: number;        // How recent/fresh the data is
  integrity: number;         // Referential integrity score
  overall: number;           // Weighted average of all metrics
}

export interface DataQualityRule {
  id: string;
  name: string;
  description: string;
  field: string;
  ruleType: QualityRuleType;
  condition: any;
  weight: number;            // Importance weight (0-1)
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: QualityCategory;
  enabled: boolean;
}

export type QualityRuleType =
  | 'not_null' | 'not_empty' | 'format' | 'range' | 'pattern'
  | 'unique' | 'reference' | 'custom' | 'length' | 'type'
  | 'freshness' | 'outlier' | 'duplicate' | 'relationship';

export type QualityCategory =
  | 'completeness' | 'validity' | 'consistency' | 'accuracy'
  | 'uniqueness' | 'timeliness' | 'integrity';

export interface QualityViolation {
  ruleId: string;
  ruleName: string;
  field: string;
  rowIndex: number;
  value: any;
  expectedValue?: any;
  severity: string;
  category: QualityCategory;
  message: string;
  suggestion?: string;
}

export interface DataProfile {
  fieldName: string;
  dataType: string;
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  uniquePercentage: number;
  minValue?: any;
  maxValue?: any;
  avgValue?: number;
  stdDev?: number;
  topValues: Array<{ value: any; count: number; percentage: number }>;
  patterns: Array<{ pattern: string; count: number; percentage: number }>;
  outliers: any[];
  qualityScore: number;
}

export interface DataQualityReport {
  timestamp: Date;
  totalRows: number;
  totalFields: number;
  overallScore: number;
  metrics: DataQualityMetrics;
  violations: QualityViolation[];
  profiles: DataProfile[];
  recommendations: QualityRecommendation[];
  trends: QualityTrend[];
}

export interface QualityRecommendation {
  type: 'fix' | 'improve' | 'monitor' | 'investigate';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  field?: string;
  action: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
}

export interface QualityTrend {
  metric: keyof DataQualityMetrics;
  current: number;
  previous: number;
  change: number;
  trend: 'improving' | 'stable' | 'declining';
}

// Pre-defined Quality Rules
export const STANDARD_QUALITY_RULES: DataQualityRule[] = [
  {
    id: 'email-format',
    name: 'Email Format Validation',
    description: 'Validates email addresses follow proper format',
    field: 'email',
    ruleType: 'pattern',
    condition: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    weight: 0.8,
    severity: 'high',
    category: 'validity',
    enabled: true
  },
  {
    id: 'phone-format',
    name: 'Phone Number Format',
    description: 'Validates phone numbers follow expected format',
    field: 'phone',
    ruleType: 'pattern',
    condition: /^[\+]?[1-9][\d]{0,15}$/,
    weight: 0.6,
    severity: 'medium',
    category: 'validity',
    enabled: true
  },
  {
    id: 'url-format',
    name: 'URL Format Validation',
    description: 'Validates URLs are properly formatted',
    field: 'url',
    ruleType: 'pattern',
    condition: /^https?:\/\/.+\..+/,
    weight: 0.7,
    severity: 'high',
    category: 'validity',
    enabled: true
  },
  {
    id: 'required-fields',
    name: 'Required Fields Check',
    description: 'Ensures critical fields are not null or empty',
    field: '*',
    ruleType: 'not_null',
    condition: true,
    weight: 1.0,
    severity: 'critical',
    category: 'completeness',
    enabled: true
  },
  {
    id: 'price-range',
    name: 'Price Range Validation',
    description: 'Validates prices are within reasonable range',
    field: 'price',
    ruleType: 'range',
    condition: { min: 0, max: 1000000 },
    weight: 0.8,
    severity: 'high',
    category: 'validity',
    enabled: true
  },
  {
    id: 'date-freshness',
    name: 'Data Freshness Check',
    description: 'Checks if data is recent enough',
    field: 'created_at',
    ruleType: 'freshness',
    condition: { maxDays: 30 },
    weight: 0.5,
    severity: 'medium',
    category: 'timeliness',
    enabled: true
  }
];

// Data Quality Engine
export class DataQualityEngine {
  private rules: DataQualityRule[] = [];
  private profiles: Map<string, DataProfile> = new Map();
  private historicalMetrics: DataQualityMetrics[] = [];

  constructor(rules: DataQualityRule[] = STANDARD_QUALITY_RULES) {
    this.rules = rules;
  }

  // Main Quality Assessment Function
  async assessDataQuality(data: any[], customRules: DataQualityRule[] = []): Promise<DataQualityReport> {
    const allRules = [...this.rules, ...customRules].filter(rule => rule.enabled);
    const violations: QualityViolation[] = [];
    const profiles: DataProfile[] = [];

    // Generate data profiles for each field
    const fields = this.extractFields(data);
    for (const field of fields) {
      const profile = this.generateFieldProfile(data, field);
      profiles.push(profile);
      this.profiles.set(field, profile);
    }

    // Run quality rules
    for (const rule of allRules) {
      const ruleViolations = this.evaluateRule(data, rule);
      violations.push(...ruleViolations);
    }

    // Calculate metrics
    const metrics = this.calculateMetrics(data, violations, profiles);

    // Generate recommendations
    const recommendations = this.generateRecommendations(violations, profiles, metrics);

    // Calculate trends
    const trends = this.calculateTrends(metrics);

    const report: DataQualityReport = {
      timestamp: new Date(),
      totalRows: data.length,
      totalFields: fields.length,
      overallScore: metrics.overall,
      metrics,
      violations,
      profiles,
      recommendations,
      trends
    };

    // Store historical data
    this.historicalMetrics.push(metrics);
    if (this.historicalMetrics.length > 100) {
      this.historicalMetrics = this.historicalMetrics.slice(-100);
    }

    return report;
  }

  private extractFields(data: any[]): string[] {
    if (data.length === 0) return [];

    const allFields = new Set<string>();
    data.forEach(row => {
      Object.keys(row).forEach(key => allFields.add(key));
    });

    return Array.from(allFields);
  }

  private generateFieldProfile(data: any[], fieldName: string): DataProfile {
    const values = data.map(row => row[fieldName]).filter(v => v !== undefined);
    const nonNullValues = values.filter(v => v !== null && v !== '');

    const nullCount = values.length - nonNullValues.length;
    const nullPercentage = (nullCount / values.length) * 100;

    const uniqueValues = [...new Set(nonNullValues)];
    const uniqueCount = uniqueValues.length;
    const uniquePercentage = (uniqueCount / nonNullValues.length) * 100;

    // Value frequency analysis
    const valueFrequency = new Map<any, number>();
    nonNullValues.forEach(value => {
      valueFrequency.set(value, (valueFrequency.get(value) || 0) + 1);
    });

    const topValues = Array.from(valueFrequency.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([value, count]) => ({
        value,
        count,
        percentage: (count / nonNullValues.length) * 100
      }));

    // Pattern analysis for strings
    const patterns = this.analyzePatterns(nonNullValues);

    // Data type detection
    const dataType = this.detectDataType(nonNullValues);

    // Statistical analysis for numeric fields
    let minValue: number | undefined, maxValue: number | undefined, avgValue: number | undefined, stdDev: number | undefined;
    if (dataType === 'number') {
      const numericValues = nonNullValues.map(v => Number.parseFloat(v)).filter(v => !isNaN(v));
      minValue = Math.min(...numericValues);
      maxValue = Math.max(...numericValues);
      avgValue = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;

      const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - (avgValue || 0), 2), 0) / numericValues.length;
      stdDev = Math.sqrt(variance);
    }

    // Outlier detection
    const outliers = this.detectOutliers(nonNullValues, dataType);

    // Calculate field quality score
    const qualityScore = this.calculateFieldQualityScore({
      nullPercentage,
      uniquePercentage,
      patterns,
      outliers,
      dataType,
      fieldName
    });

    return {
      fieldName,
      dataType,
      nullCount,
      nullPercentage,
      uniqueCount,
      uniquePercentage,
      minValue,
      maxValue,
      avgValue,
      stdDev,
      topValues,
      patterns,
      outliers,
      qualityScore
    };
  }

  private analyzePatterns(values: any[]): Array<{ pattern: string; count: number; percentage: number }> {
    const patternMap = new Map<string, number>();

    values.filter(v => typeof v === 'string').forEach(value => {
      // Generate pattern (A for letter, 9 for digit, * for other)
      const pattern = value.replace(/[a-zA-Z]/g, 'A').replace(/\d/g, '9').replace(/[^A9]/g, '*');
      patternMap.set(pattern, (patternMap.get(pattern) || 0) + 1);
    });

    return Array.from(patternMap.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([pattern, count]) => ({
        pattern,
        count,
        percentage: (count / values.length) * 100
      }));
  }

  private detectDataType(values: any[]): string {
    if (values.length === 0) return 'unknown';

    const samples = values.slice(0, 100); // Sample first 100 values
    let numberCount = 0;
    let dateCount = 0;
    let booleanCount = 0;
    let stringCount = 0;

    samples.forEach(value => {
      if (typeof value === 'number' || (!isNaN(Number.parseFloat(value)) && isFinite(value))) {
        numberCount++;
      } else if (typeof value === 'boolean' || value === 'true' || value === 'false') {
        booleanCount++;
      } else if (Date.parse(value) && !isNaN(Date.parse(value))) {
        dateCount++;
      } else {
        stringCount++;
      }
    });

    const total = samples.length;
    if (numberCount / total > 0.8) return 'number';
    if (dateCount / total > 0.8) return 'date';
    if (booleanCount / total > 0.8) return 'boolean';
    return 'string';
  }

  private detectOutliers(values: any[], dataType: string): any[] {
    if (dataType !== 'number' || values.length < 10) return [];

    const numericValues = values.map(v => Number.parseFloat(v)).filter(v => !isNaN(v));
    numericValues.sort((a, b) => a - b);

    const q1 = numericValues[Math.floor(numericValues.length * 0.25)];
    const q3 = numericValues[Math.floor(numericValues.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return numericValues.filter(value => value < lowerBound || value > upperBound);
  }

  private calculateFieldQualityScore(fieldInfo: {
    nullPercentage: number;
    uniquePercentage: number;
    patterns: any[];
    outliers: any[];
    dataType: string;
    fieldName: string;
  }): number {
    let score = 100;

    // Penalize for null values
    score -= fieldInfo.nullPercentage * 0.5;

    // Penalize for outliers (for numeric fields)
    if (fieldInfo.dataType === 'number' && fieldInfo.outliers.length > 0) {
      score -= Math.min(fieldInfo.outliers.length * 2, 20);
    }

    // Bonus for consistent patterns
    if (fieldInfo.patterns.length > 0 && fieldInfo.patterns[0].percentage > 80) {
      score += 10;
    }

    // Field-specific rules
    if (fieldInfo.fieldName.includes('email') && fieldInfo.dataType !== 'string') {
      score -= 30;
    }

    return Math.max(0, Math.min(100, score));
  }

  private evaluateRule(data: any[], rule: DataQualityRule): QualityViolation[] {
    const violations: QualityViolation[] = [];

    data.forEach((row, index) => {
      const fieldValue = rule.field === '*' ? row : row[rule.field];
      let isValid = true;
      let message = '';
      let suggestion = '';

      switch (rule.ruleType) {
        case 'not_null':
          isValid = fieldValue !== null && fieldValue !== undefined;
          message = `Field '${rule.field}' is null or undefined`;
          suggestion = 'Provide a valid value for this field';
          break;

        case 'not_empty':
          isValid = fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
          message = `Field '${rule.field}' is empty`;
          suggestion = 'Provide a non-empty value';
          break;

        case 'pattern':
          if (fieldValue && typeof fieldValue === 'string') {
            isValid = rule.condition.test(fieldValue);
            message = `Field '${rule.field}' does not match expected pattern`;
            suggestion = 'Ensure the value follows the correct format';
          }
          break;

        case 'range':
          if (fieldValue && !isNaN(Number.parseFloat(fieldValue))) {
            const numValue = Number.parseFloat(fieldValue);
            isValid = numValue >= rule.condition.min && numValue <= rule.condition.max;
            message = `Field '${rule.field}' is outside expected range (${rule.condition.min}-${rule.condition.max})`;
            suggestion = `Value should be between ${rule.condition.min} and ${rule.condition.max}`;
          }
          break;

        case 'length':
          if (fieldValue && typeof fieldValue === 'string') {
            isValid = fieldValue.length >= rule.condition.min && fieldValue.length <= rule.condition.max;
            message = `Field '${rule.field}' length is outside expected range`;
            suggestion = `Length should be between ${rule.condition.min} and ${rule.condition.max} characters`;
          }
          break;

        case 'unique':
          // This would require checking against all other values - simplified here
          break;

        case 'freshness':
          if (fieldValue) {
            const date = new Date(fieldValue);
            const daysDiff = (new Date().getTime() - date.getTime()) / (1000 * 3600 * 24);
            isValid = daysDiff <= rule.condition.maxDays;
            message = `Field '${rule.field}' is too old (${Math.floor(daysDiff)} days)`;
            suggestion = `Data should be updated more frequently`;
          }
          break;
      }

      if (!isValid) {
        violations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          field: rule.field,
          rowIndex: index,
          value: fieldValue,
          severity: rule.severity,
          category: rule.category,
          message,
          suggestion
        });
      }
    });

    return violations;
  }

  private calculateMetrics(data: any[], violations: QualityViolation[], profiles: DataProfile[]): DataQualityMetrics {
    const totalCells = data.length * profiles.length;

    // Completeness: % of non-null values
    const totalNulls = profiles.reduce((sum, profile) => sum + profile.nullCount, 0);
    const completeness = ((totalCells - totalNulls) / totalCells) * 100;

    // Validity: % of values passing validation rules
    const validityViolations = violations.filter(v => v.category === 'validity').length;
    const validity = ((totalCells - validityViolations) / totalCells) * 100;

    // Consistency: Average of pattern consistency across fields
    const consistency = profiles.reduce((sum, profile) => {
      if (profile.patterns.length > 0) {
        return sum + profile.patterns[0].percentage;
      }
      return sum + 100; // No patterns means consistent
    }, 0) / profiles.length;

    // Accuracy: Based on outliers and data type consistency
    const totalOutliers = profiles.reduce((sum, profile) => sum + profile.outliers.length, 0);
    const accuracy = ((totalCells - totalOutliers) / totalCells) * 100;

    // Uniqueness: Average uniqueness across all fields
    const uniqueness = profiles.reduce((sum, profile) => sum + profile.uniquePercentage, 0) / profiles.length;

    // Timeliness: Based on freshness violations
    const timeliness = 100 - (violations.filter(v => v.category === 'timeliness').length / data.length) * 100;

    // Integrity: Based on reference violations
    const integrity = 100 - (violations.filter(v => v.category === 'integrity').length / data.length) * 100;

    // Overall: Weighted average
    const overall = (
      completeness * 0.25 +
      validity * 0.25 +
      consistency * 0.15 +
      accuracy * 0.15 +
      uniqueness * 0.05 +
      timeliness * 0.1 +
      integrity * 0.05
    );

    return {
      completeness: Math.round(completeness * 100) / 100,
      validity: Math.round(validity * 100) / 100,
      consistency: Math.round(consistency * 100) / 100,
      accuracy: Math.round(accuracy * 100) / 100,
      uniqueness: Math.round(uniqueness * 100) / 100,
      timeliness: Math.round(timeliness * 100) / 100,
      integrity: Math.round(integrity * 100) / 100,
      overall: Math.round(overall * 100) / 100
    };
  }

  private generateRecommendations(
    violations: QualityViolation[],
    profiles: DataProfile[],
    metrics: DataQualityMetrics
  ): QualityRecommendation[] {
    const recommendations: QualityRecommendation[] = [];

    // High-impact recommendations based on violations
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      recommendations.push({
        type: 'fix',
        priority: 'critical',
        title: 'Critical Data Quality Issues',
        description: `Found ${criticalViolations.length} critical violations that must be addressed immediately.`,
        action: 'Review and fix all critical violations in the data validation report.',
        impact: 'Prevents data corruption and ensures system reliability.',
        effort: 'high'
      });
    }

    // Completeness recommendations
    if (metrics.completeness < 80) {
      const fieldsWithNulls = profiles.filter(p => p.nullPercentage > 20);
      recommendations.push({
        type: 'improve',
        priority: 'high',
        title: 'Improve Data Completeness',
        description: `Data completeness is ${metrics.completeness.toFixed(1)}%. Fields with high null rates: ${fieldsWithNulls.map(f => f.fieldName).join(', ')}`,
        action: 'Implement data collection improvements and validation at source.',
        impact: 'Better data completeness leads to more accurate analysis and insights.',
        effort: 'medium'
      });
    }

    // Pattern consistency recommendations
    const inconsistentFields = profiles.filter(p => p.patterns.length > 1 && p.patterns[0].percentage < 70);
    if (inconsistentFields.length > 0) {
      recommendations.push({
        type: 'improve',
        priority: 'medium',
        title: 'Standardize Data Formats',
        description: `Found inconsistent patterns in fields: ${inconsistentFields.map(f => f.fieldName).join(', ')}`,
        action: 'Implement data standardization rules and format validation.',
        impact: 'Improved consistency enables better data processing and integration.',
        effort: 'medium'
      });
    }

    // Outlier recommendations
    const fieldsWithOutliers = profiles.filter(p => p.outliers.length > 0);
    if (fieldsWithOutliers.length > 0) {
      recommendations.push({
        type: 'investigate',
        priority: 'medium',
        title: 'Review Data Outliers',
        description: `Found outliers in ${fieldsWithOutliers.length} fields that may indicate data quality issues.`,
        action: 'Investigate outlier values to determine if they are valid or errors.',
        impact: 'Identifying and handling outliers improves data accuracy.',
        effort: 'low'
      });
    }

    return recommendations;
  }

  private calculateTrends(currentMetrics: DataQualityMetrics): QualityTrend[] {
    if (this.historicalMetrics.length < 2) {
      return [];
    }

    const previousMetrics = this.historicalMetrics[this.historicalMetrics.length - 2];
    const trends: QualityTrend[] = [];

    Object.keys(currentMetrics).forEach(key => {
      const metricKey = key as keyof DataQualityMetrics;
      const current = currentMetrics[metricKey];
      const previous = previousMetrics[metricKey];
      const change = current - previous;

      let trend: 'improving' | 'stable' | 'declining';
      if (Math.abs(change) < 1) {
        trend = 'stable';
      } else if (change > 0) {
        trend = 'improving';
      } else {
        trend = 'declining';
      }

      trends.push({
        metric: metricKey,
        current,
        previous,
        change: Math.round(change * 100) / 100,
        trend
      });
    });

    return trends;
  }

  // Utility methods for external use
  public addRule(rule: DataQualityRule): void {
    this.rules.push(rule);
  }

  public removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  public getProfile(fieldName: string): DataProfile | undefined {
    return this.profiles.get(fieldName);
  }

  public getHistoricalMetrics(): DataQualityMetrics[] {
    return [...this.historicalMetrics];
  }

  public exportReport(report: DataQualityReport): string {
    return JSON.stringify(report, null, 2);
  }
}

// Export utility functions
export const QualityUtils = {
  // Generate quality score color
  getQualityScoreColor: (score: number): string => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-blue-600 bg-blue-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  },

  // Generate severity color
  getSeverityColor: (severity: string): string => {
    const colors = {
      low: 'text-gray-600 bg-gray-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-orange-600 bg-orange-100',
      critical: 'text-red-600 bg-red-100'
    };
    return colors[severity as keyof typeof colors] || colors.medium;
  },

  // Format quality score
  formatScore: (score: number): string => {
    return `${score.toFixed(1)}%`;
  }
};
