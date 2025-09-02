type ExtendedExportFormat = 'json' | 'csv' | 'tsv' | 'xlsx' | 'xml' | 'sql' | 'parquet' | 'yaml' | 'jsonl';

interface ExportOptions {
  includeMetadata?: boolean;
  compression?: 'none' | 'gzip' | 'brotli';
  formatting?: {
    pretty?: boolean;
    indent?: number;
    dateFormat?: string;
  };
  sql?: {
    tableName?: string;
    dialect?: 'mysql' | 'postgresql' | 'sqlite' | 'mssql';
    includeCreateTable?: boolean;
  };
  xml?: {
    rootElement?: string;
    rowElement?: string;
    attributes?: boolean;
  };
  parquet?: {
    compression?: 'snappy' | 'gzip' | 'lz4' | 'brotli';
    rowGroupSize?: number;
  };
}

interface ExportResult {
  success: boolean;
  data?: Buffer | string;
  filename: string;
  mimeType: string;
  size: number;
  error?: string;
}

class EnhancedDataExporter {
  async export(
    data: any[],
    format: ExtendedExportFormat,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFilename = `export_${timestamp}`;

    try {
      switch (format) {
        case 'json':
          return this.exportJSON(data, baseFilename, options);
        case 'csv':
          return this.exportCSV(data, baseFilename, options);
        case 'tsv':
          return this.exportTSV(data, baseFilename, options);
        case 'xlsx':
          return this.exportXLSX(data, baseFilename, options);
        case 'xml':
          return this.exportXML(data, baseFilename, options);
        case 'sql':
          return this.exportSQL(data, baseFilename, options);
        case 'parquet':
          return this.exportParquet(data, baseFilename, options);
        case 'yaml':
          return this.exportYAML(data, baseFilename, options);
        case 'jsonl':
          return this.exportJSONL(data, baseFilename, options);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      return {
        success: false,
        filename: `${baseFilename}.error`,
        mimeType: 'text/plain',
        size: 0,
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  private async exportJSON(data: any[], filename: string, options: ExportOptions): Promise<ExportResult> {
    const exportData = this.prepareData(data, options);
    const jsonString = options.formatting?.pretty
      ? JSON.stringify(exportData, null, options.formatting.indent || 2)
      : JSON.stringify(exportData);

    const buffer = await this.compressData(Buffer.from(jsonString, 'utf8'), options.compression);
    const extension = this.getCompressionExtension(options.compression);

    return {
      success: true,
      data: buffer,
      filename: `${filename}.json${extension}`,
      mimeType: 'application/json',
      size: buffer.length
    };
  }

  private async exportCSV(data: any[], filename: string, options: ExportOptions): Promise<ExportResult> {
    const flatData = this.flattenData(data);
    if (flatData.length === 0) {
      throw new Error('No data to export');
    }

    const headers = Object.keys(flatData[0]);
    const csvRows = [
      headers.join(','),
      ...flatData.map(row =>
        headers.map(header => this.escapeCSVValue(row[header])).join(',')
      )
    ];

    const csvString = csvRows.join('\n');
    const buffer = await this.compressData(Buffer.from(csvString, 'utf8'), options.compression);
    const extension = this.getCompressionExtension(options.compression);

    return {
      success: true,
      data: buffer,
      filename: `${filename}.csv${extension}`,
      mimeType: 'text/csv',
      size: buffer.length
    };
  }

  private async exportTSV(data: any[], filename: string, options: ExportOptions): Promise<ExportResult> {
    const flatData = this.flattenData(data);
    if (flatData.length === 0) {
      throw new Error('No data to export');
    }

    const headers = Object.keys(flatData[0]);
    const tsvRows = [
      headers.join('\t'),
      ...flatData.map(row =>
        headers.map(header => this.escapeTSVValue(row[header])).join('\t')
      )
    ];

    const tsvString = tsvRows.join('\n');
    const buffer = await this.compressData(Buffer.from(tsvString, 'utf8'), options.compression);
    const extension = this.getCompressionExtension(options.compression);

    return {
      success: true,
      data: buffer,
      filename: `${filename}.tsv${extension}`,
      mimeType: 'text/tab-separated-values',
      size: buffer.length
    };
  }

  private async exportXLSX(data: any[], filename: string, options: ExportOptions): Promise<ExportResult> {
    // This would require a library like 'xlsx' or 'exceljs'
    // For now, return a placeholder
    const flatData = this.flattenData(data);
    const csvString = this.convertToCSV(flatData);
    const buffer = Buffer.from(csvString, 'utf8');

    return {
      success: true,
      data: buffer,
      filename: `${filename}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: buffer.length
    };
  }

  private async exportXML(data: any[], filename: string, options: ExportOptions): Promise<ExportResult> {
    const rootElement = options.xml?.rootElement || 'data';
    const rowElement = options.xml?.rowElement || 'row';
    const useAttributes = options.xml?.attributes || false;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}>\n`;

    for (const item of data) {
      xml += `  <${rowElement}`;

      if (useAttributes) {
        for (const [key, value] of Object.entries(item)) {
          xml += ` ${this.sanitizeXMLName(key)}="${this.escapeXMLValue(value)}"`;
        }
        xml += ' />\n';
      } else {
        xml += '>\n';
        for (const [key, value] of Object.entries(item)) {
          xml += `    <${this.sanitizeXMLName(key)}>${this.escapeXMLValue(value)}</${this.sanitizeXMLName(key)}>\n`;
        }
        xml += `  </${rowElement}>\n`;
      }
    }

    xml += `</${rootElement}>`;

    const buffer = await this.compressData(Buffer.from(xml, 'utf8'), options.compression);
    const extension = this.getCompressionExtension(options.compression);

    return {
      success: true,
      data: buffer,
      filename: `${filename}.xml${extension}`,
      mimeType: 'application/xml',
      size: buffer.length
    };
  }

  private async exportSQL(data: any[], filename: string, options: ExportOptions): Promise<ExportResult> {
    const tableName = options.sql?.tableName || 'scraped_data';
    const dialect = options.sql?.dialect || 'mysql';
    const includeCreateTable = options.sql?.includeCreateTable !== false;

    const flatData = this.flattenData(data);
    if (flatData.length === 0) {
      throw new Error('No data to export');
    }

    let sql = '';

    if (includeCreateTable) {
      sql += this.generateCreateTableSQL(flatData[0], tableName, dialect);
      sql += '\n\n';
    }

    // Generate INSERT statements
    const columns = Object.keys(flatData[0]);
    const insertStatements = flatData.map(row => {
      const values = columns.map(col => this.formatSQLValue(row[col], dialect)).join(', ');
      return `INSERT INTO ${tableName} (${columns.map(col => `\`${col}\``).join(', ')}) VALUES (${values});`;
    });

    sql += insertStatements.join('\n');

    const buffer = await this.compressData(Buffer.from(sql, 'utf8'), options.compression);
    const extension = this.getCompressionExtension(options.compression);

    return {
      success: true,
      data: buffer,
      filename: `${filename}.sql${extension}`,
      mimeType: 'application/sql',
      size: buffer.length
    };
  }

  private async exportParquet(data: any[], filename: string, options: ExportOptions): Promise<ExportResult> {
    // Parquet export would require a library like 'parquetjs'
    // For now, return JSON as fallback
    console.warn('Parquet export not yet implemented, falling back to JSON');
    return this.exportJSON(data, filename.replace('.parquet', '.json'), options);
  }

  private async exportYAML(data: any[], filename: string, options: ExportOptions): Promise<ExportResult> {
    const exportData = this.prepareData(data, options);

    // Simple YAML serialization (would use 'js-yaml' in production)
    const yamlString = this.convertToYAML(exportData);

    const buffer = await this.compressData(Buffer.from(yamlString, 'utf8'), options.compression);
    const extension = this.getCompressionExtension(options.compression);

    return {
      success: true,
      data: buffer,
      filename: `${filename}.yaml${extension}`,
      mimeType: 'application/x-yaml',
      size: buffer.length
    };
  }

  private async exportJSONL(data: any[], filename: string, options: ExportOptions): Promise<ExportResult> {
    const exportData = this.prepareData(data, options);
    const jsonlString = exportData.map(item => JSON.stringify(item)).join('\n');

    const buffer = await this.compressData(Buffer.from(jsonlString, 'utf8'), options.compression);
    const extension = this.getCompressionExtension(options.compression);

    return {
      success: true,
      data: buffer,
      filename: `${filename}.jsonl${extension}`,
      mimeType: 'application/x-jsonlines',
      size: buffer.length
    };
  }

  // Helper methods
  private prepareData(data: any[], options: ExportOptions): any[] {
    let exportData = [...data];

    if (options.includeMetadata) {
      exportData = exportData.map(item => ({
        ...item,
        _metadata: {
          exportedAt: new Date().toISOString(),
          exportId: this.generateExportId()
        }
      }));
    }

    return exportData;
  }

  private flattenData(data: any[]): any[] {
    return data.map(item => this.flattenObject(item));
  }

  private flattenObject(obj: any, prefix = ''): any {
    const flattened: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        flattened[newKey] = value.join('; ');
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }

  private escapeCSVValue(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private escapeTSVValue(value: any): string {
    if (value === null || value === undefined) return '';
    return String(value).replace(/\t/g, '\\t').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  }

  private escapeXMLValue(value: any): string {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private sanitizeXMLName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  private generateCreateTableSQL(sampleRow: any, tableName: string, dialect: string): string {
    const columns = Object.keys(sampleRow).map(key => {
      const value = sampleRow[key];
      const type = this.inferSQLType(value, dialect);
      return `\`${key}\` ${type}`;
    });

    return `CREATE TABLE ${tableName} (\n  ${columns.join(',\n  ')}\n);`;
  }

  private inferSQLType(value: any, dialect: string): string {
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'INT' : 'DECIMAL(10,2)';
    }
    if (typeof value === 'boolean') {
      return dialect === 'postgresql' ? 'BOOLEAN' : 'TINYINT(1)';
    }
    if (value instanceof Date) {
      return 'DATETIME';
    }
    if (typeof value === 'string' && value.length > 255) {
      return 'TEXT';
    }
    return 'VARCHAR(255)';
  }

  private formatSQLValue(value: any, dialect: string): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`;
    }
    if (typeof value === 'boolean') {
      return dialect === 'postgresql' ? (value ? 'TRUE' : 'FALSE') : (value ? '1' : '0');
    }
    return String(value);
  }

  private convertToYAML(data: any, indent = 0): string {
    const spaces = ' '.repeat(indent);

    if (Array.isArray(data)) {
      return data.map(item => `${spaces}- ${this.convertToYAML(item, indent + 2).trim()}`).join('\n');
    }

    if (data && typeof data === 'object') {
      return Object.entries(data)
        .map(([key, value]) => {
          if (typeof value === 'object') {
            return `${spaces}${key}:\n${this.convertToYAML(value, indent + 2)}`;
          }
          return `${spaces}${key}: ${value}`;
        })
        .join('\n');
    }

    return String(data);
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = [
      headers.join(','),
      ...data.map(row => headers.map(h => this.escapeCSVValue(row[h])).join(','))
    ];

    return rows.join('\n');
  }

  private async compressData(buffer: Buffer, compression?: string): Promise<Buffer> {
    if (!compression || compression === 'none') {
      return buffer;
    }

    // In a real implementation, you would use compression libraries
    // For now, return the original buffer
    console.warn(`Compression ${compression} not implemented yet`);
    return buffer;
  }

  private getCompressionExtension(compression?: string): string {
    switch (compression) {
      case 'gzip': return '.gz';
      case 'brotli': return '.br';
      default: return '';
    }
  }

  private generateExportId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export { EnhancedDataExporter, type ExportOptions, type ExportResult, type ExtendedExportFormat };
