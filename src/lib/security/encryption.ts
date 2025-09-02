import * as crypto from 'crypto';
import { logger } from '@/lib/utils';

interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
  saltLength: number;
  iterations: number;
}

interface EncryptedData {
  data: string;
  iv: string;
  tag: string;
  salt: string;
  algorithm: string;
}

interface MaskingConfig {
  showFirst?: number;
  showLast?: number;
  maskChar?: string;
  preserveFormat?: boolean;
}

export class EncryptionService {
  private config: EncryptionConfig;
  private masterKey: Buffer;

  constructor() {
    this.config = {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      tagLength: 16,
      saltLength: 32,
      iterations: 100000,
    };

    // In production, this should come from a secure key management service
    const masterKeyHex = process.env.ENCRYPTION_MASTER_KEY || this.generateMasterKey();
    this.masterKey = Buffer.from(masterKeyHex, 'hex');
  }

  /**
   * Generate a new master key
   */
  private generateMasterKey(): string {
    const key = crypto.randomBytes(this.config.keyLength);
    logger.warn('Generated new encryption master key - store this securely!', {
      key: key.toString('hex'),
    });
    return key.toString('hex');
  }

  /**
   * Derive key from master key using PBKDF2
   */
  private deriveKey(salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      this.config.iterations,
      this.config.keyLength,
      'sha256'
    );
  }

  /**
   * Encrypt data
   */
  encrypt(plaintext: string, associatedData?: string): EncryptedData {
    try {
      const salt = crypto.randomBytes(this.config.saltLength);
      const key = this.deriveKey(salt);
      const iv = crypto.randomBytes(this.config.ivLength);

      const cipher = crypto.createCipheriv(this.config.algorithm, key, iv);

      if (associatedData && this.config.algorithm.includes('gcm')) {
        (cipher as any).setAAD(Buffer.from(associatedData, 'utf8'));
      }

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = this.config.algorithm.includes('gcm')
        ? (cipher as any).getAuthTag()
        : Buffer.alloc(0);

      return {
        data: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        salt: salt.toString('hex'),
        algorithm: this.config.algorithm,
      };
    } catch (error) {
      logger.error('Encryption failed', { error });
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData: EncryptedData, associatedData?: string): string {
    try {
      const salt = Buffer.from(encryptedData.salt, 'hex');
      const key = this.deriveKey(salt);
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');

      const decipher = crypto.createDecipheriv(encryptedData.algorithm, key, iv);

      if (encryptedData.algorithm.includes('gcm')) {
        (decipher as any).setAuthTag(tag);

        if (associatedData) {
          (decipher as any).setAAD(Buffer.from(associatedData, 'utf8'));
        }
      }

      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Decryption failed', { error });
      throw new Error('Decryption failed');
    }
  }

  /**
   * Encrypt object
   */
  encryptObject(obj: any, associatedData?: string): EncryptedData {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString, associatedData);
  }

  /**
   * Decrypt object
   */
  decryptObject<T>(encryptedData: EncryptedData, associatedData?: string): T {
    const jsonString = this.decrypt(encryptedData, associatedData);
    return JSON.parse(jsonString);
  }

  /**
   * Generate secure hash
   */
  hash(data: string, salt?: string): { hash: string; salt: string } {
    const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(16);
    const hash = crypto.pbkdf2Sync(data, saltBuffer, this.config.iterations, 64, 'sha256');

    return {
      hash: hash.toString('hex'),
      salt: saltBuffer.toString('hex'),
    };
  }

  /**
   * Verify hash
   */
  verifyHash(data: string, hash: string, salt: string): boolean {
    const { hash: computedHash } = this.hash(data, salt);
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(computedHash, 'hex')
    );
  }

  /**
   * Generate secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

/**
 * Data Masking Service
 */
export class DataMaskingService {
  /**
   * Mask email address
   */
  maskEmail(email: string, config: MaskingConfig = {}): string {
    if (!email || !email.includes('@')) return email;

    const [username, domain] = email.split('@');
    const { showFirst = 2, showLast = 1, maskChar = '*' } = config;

    if (username.length <= showFirst + showLast) {
      return `${maskChar.repeat(3)}@${domain}`;
    }

    const maskedUsername =
      username.substring(0, showFirst) +
      maskChar.repeat(username.length - showFirst - showLast) +
      username.substring(username.length - showLast);

    return `${maskedUsername}@${domain}`;
  }

  /**
   * Mask phone number
   */
  maskPhone(phone: string, config: MaskingConfig = {}): string {
    if (!phone) return phone;

    const { showLast = 4, maskChar = '*' } = config;
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length <= showLast) {
      return maskChar.repeat(phone.length);
    }

    const maskedDigits = maskChar.repeat(cleanPhone.length - showLast);
    const visibleDigits = cleanPhone.substring(cleanPhone.length - showLast);

    // Preserve original formatting
    let result = phone;
    for (let i = 0; i < cleanPhone.length - showLast; i++) {
      result = result.replace(/\d/, maskChar);
    }

    return result;
  }

  /**
   * Mask credit card number
   */
  maskCreditCard(cardNumber: string, config: MaskingConfig = {}): string {
    if (!cardNumber) return cardNumber;

    const { showLast = 4, maskChar = '*' } = config;
    const cleanCard = cardNumber.replace(/\D/g, '');

    if (cleanCard.length <= showLast) {
      return maskChar.repeat(cardNumber.length);
    }

    const maskedDigits = maskChar.repeat(cleanCard.length - showLast);
    const visibleDigits = cleanCard.substring(cleanCard.length - showLast);

    return maskedDigits + visibleDigits;
  }

  /**
   * Mask generic string
   */
  maskString(str: string, config: MaskingConfig = {}): string {
    if (!str) return str;

    const {
      showFirst = 0,
      showLast = 0,
      maskChar = '*',
      preserveFormat = false
    } = config;

    if (str.length <= showFirst + showLast) {
      return preserveFormat ?
        str.replace(/\w/g, maskChar) :
        maskChar.repeat(str.length);
    }

    const prefix = str.substring(0, showFirst);
    const suffix = str.substring(str.length - showLast);
    const middleLength = str.length - showFirst - showLast;

    if (preserveFormat) {
      const middle = str.substring(showFirst, str.length - showLast);
      const maskedMiddle = middle.replace(/\w/g, maskChar);
      return prefix + maskedMiddle + suffix;
    } else {
      return prefix + maskChar.repeat(middleLength) + suffix;
    }
  }

  /**
   * Mask object properties
   */
  maskObject(obj: any, maskingRules: Record<string, MaskingConfig>): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.maskObject(item, maskingRules));
    }

    const masked: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (maskingRules[key]) {
        if (typeof value === 'string') {
          masked[key] = this.getMaskedValue(key, value, maskingRules[key]);
        } else {
          masked[key] = value;
        }
      } else if (typeof value === 'object') {
        masked[key] = this.maskObject(value, maskingRules);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  /**
   * Get masked value based on field type
   */
  private getMaskedValue(fieldName: string, value: string, config: MaskingConfig): string {
    const field = fieldName.toLowerCase();

    if (field.includes('email')) {
      return this.maskEmail(value, config);
    } else if (field.includes('phone') || field.includes('mobile')) {
      return this.maskPhone(value, config);
    } else if (field.includes('card') || field.includes('credit')) {
      return this.maskCreditCard(value, config);
    } else {
      return this.maskString(value, config);
    }
  }
}

/**
 * Secure Export Service
 */
export class SecureExportService {
  private encryption: EncryptionService;
  private masking: DataMaskingService;

  constructor() {
    this.encryption = new EncryptionService();
    this.masking = new DataMaskingService();
  }

  /**
   * Export data with encryption
   */
  async exportEncrypted(
    data: any[],
    format: 'json' | 'csv' | 'xlsx',
    password?: string
  ): Promise<{
    data: Buffer;
    key?: string;
    metadata: {
      format: string;
      recordCount: number;
      encryptedAt: string;
      checksum: string;
    };
  }> {
    let serializedData: string;

    // Serialize data based on format
    switch (format) {
      case 'json':
        serializedData = JSON.stringify(data, null, 2);
        break;
      case 'csv':
        serializedData = this.convertToCSV(data);
        break;
      case 'xlsx':
        // In a real implementation, you'd use a library like xlsx
        serializedData = JSON.stringify(data);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Calculate checksum
    const checksum = crypto.createHash('sha256')
      .update(serializedData)
      .digest('hex');

    // Encrypt data
    let encryptedData: EncryptedData;
    let exportKey: string | undefined;

    if (password) {
      // Use password-based encryption
      const { hash: derivedKey } = this.encryption.hash(password);
      encryptedData = this.encryption.encrypt(serializedData, derivedKey);
    } else {
      // Generate random key for encryption
      exportKey = this.encryption.generateToken(32);
      encryptedData = this.encryption.encrypt(serializedData, exportKey);
    }

    const exportPackage = {
      version: '1.0',
      encrypted: encryptedData,
      metadata: {
        format,
        recordCount: data.length,
        encryptedAt: new Date().toISOString(),
        checksum,
      },
    };

    return {
      data: Buffer.from(JSON.stringify(exportPackage)),
      key: exportKey,
      metadata: exportPackage.metadata,
    };
  }

  /**
   * Export data with masking
   */
  exportMasked(
    data: any[],
    maskingRules: Record<string, MaskingConfig>,
    format: 'json' | 'csv' | 'xlsx'
  ): Buffer {
    const maskedData = data.map(item => this.masking.maskObject(item, maskingRules));

    let serializedData: string;
    switch (format) {
      case 'json':
        serializedData = JSON.stringify(maskedData, null, 2);
        break;
      case 'csv':
        serializedData = this.convertToCSV(maskedData);
        break;
      case 'xlsx':
        serializedData = JSON.stringify(maskedData);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return Buffer.from(serializedData);
  }

  /**
   * Import encrypted data
   */
  async importEncrypted(
    encryptedBuffer: Buffer,
    passwordOrKey: string
  ): Promise<{
    data: any[];
    metadata: any;
  }> {
    try {
      const exportPackage = JSON.parse(encryptedBuffer.toString());
      const { encrypted, metadata } = exportPackage;

      // Decrypt data
      const decryptedData = this.encryption.decrypt(encrypted, passwordOrKey);

      // Parse based on format
      let data: any[];
      switch (metadata.format) {
        case 'json':
          data = JSON.parse(decryptedData);
          break;
        case 'csv':
          data = this.parseCSV(decryptedData);
          break;
        case 'xlsx':
          data = JSON.parse(decryptedData);
          break;
        default:
          throw new Error(`Unsupported format: ${metadata.format}`);
      }

      // Verify checksum
      const checksum = crypto.createHash('sha256')
        .update(decryptedData)
        .digest('hex');

      if (checksum !== metadata.checksum) {
        throw new Error('Data integrity check failed');
      }

      return { data, metadata };
    } catch (error) {
      logger.error('Failed to import encrypted data', { error });
      throw new Error('Failed to decrypt or parse data');
    }
  }

  /**
   * Convert array to CSV
   */
  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Parse CSV to array
   */
  private parseCSV(csvData: string): any[] {
    const lines = csvData.split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].split(',');
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row: any = {};

      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j];
      }

      data.push(row);
    }

    return data;
  }
}

// Export singleton instances
export const encryptionService = new EncryptionService();
export const dataMaskingService = new DataMaskingService();
export const secureExportService = new SecureExportService();
