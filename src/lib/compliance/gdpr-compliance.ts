import { logger } from '@/lib/utils';
import { encryptionService } from '@/lib/security/encryption';

interface PersonalData {
  id: string;
  dataSubjectId: string;
  dataType: 'email' | 'name' | 'phone' | 'address' | 'ip' | 'biometric' | 'other';
  data: string;
  purpose: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  source: string;
  collectedAt: Date;
  lastModified: Date;
  retentionPeriod: number; // in days
  consentId?: string;
  encrypted: boolean;
}

interface ConsentRecord {
  id: string;
  dataSubjectId: string;
  purposes: string[];
  consentGiven: boolean;
  consentDate: Date;
  withdrawnDate?: Date;
  ipAddress: string;
  userAgent: string;
  consentMethod: 'explicit' | 'implicit' | 'opt_in' | 'opt_out';
  version: string;
}

interface DataProcessingActivity {
  id: string;
  name: string;
  description: string;
  dataController: string;
  dataProcessor?: string;
  purposes: string[];
  dataCategories: string[];
  dataSubjectCategories: string[];
  recipients: string[];
  transferOutsideEU: boolean;
  safeguards?: string;
  retentionPeriod: number;
  technicalMeasures: string[];
  organisationalMeasures: string[];
}

interface DataBreachIncident {
  id: string;
  title: string;
  description: string;
  discoveredAt: Date;
  reportedAt?: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedRecords: number;
  dataTypes: string[];
  riskAssessment: string;
  containmentMeasures: string[];
  notificationRequired: boolean;
  supervisoryAuthorityNotified: boolean;
  dataSubjectsNotified: boolean;
  status: 'open' | 'investigating' | 'contained' | 'resolved';
  remedialActions: string[];
}

export class GDPRComplianceService {
  private personalDataStore: Map<string, PersonalData> = new Map();
  private consentRecords: Map<string, ConsentRecord> = new Map();
  private processingActivities: Map<string, DataProcessingActivity> = new Map();
  private breachIncidents: Map<string, DataBreachIncident> = new Map();

  /**
   * Register personal data processing
   */
  async registerPersonalData(data: Omit<PersonalData, 'id' | 'collectedAt' | 'lastModified' | 'encrypted'>): Promise<string> {
    const id = `pd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Encrypt sensitive data
    const encryptedData = encryptionService.encrypt(data.data);

    const personalData: PersonalData = {
      id,
      ...data,
      data: JSON.stringify(encryptedData),
      collectedAt: new Date(),
      lastModified: new Date(),
      encrypted: true,
    };

    this.personalDataStore.set(id, personalData);

    logger.info('Personal data registered', {
      id,
      dataSubjectId: data.dataSubjectId,
      dataType: data.dataType,
      purpose: data.purpose,
    });

    return id;
  }

  /**
   * Get personal data by data subject
   */
  async getPersonalDataBySubject(dataSubjectId: string): Promise<PersonalData[]> {
    const data: PersonalData[] = [];

    for (const personalData of this.personalDataStore.values()) {
      if (personalData.dataSubjectId === dataSubjectId) {
        data.push(personalData);
      }
    }

    return data;
  }

  /**
   * Delete personal data (Right to be forgotten)
   */
  async deletePersonalData(dataSubjectId: string, dataType?: string): Promise<{
    deleted: number;
    errors: string[];
  }> {
    let deleted = 0;
    const errors: string[] = [];

    for (const [id, personalData] of this.personalDataStore.entries()) {
      if (personalData.dataSubjectId === dataSubjectId) {
        if (!dataType || personalData.dataType === dataType) {
          try {
            this.personalDataStore.delete(id);
            deleted++;

            logger.info('Personal data deleted', {
              id,
              dataSubjectId,
              dataType: personalData.dataType,
            });
          } catch (error) {
            errors.push(`Failed to delete data ${id}: ${error}`);
          }
        }
      }
    }

    return { deleted, errors };
  }

  /**
   * Update personal data
   */
  async updatePersonalData(id: string, updates: Partial<PersonalData>): Promise<boolean> {
    const personalData = this.personalDataStore.get(id);
    if (!personalData) return false;

    // Re-encrypt data if it's being updated
    if (updates.data) {
      const encryptedData = encryptionService.encrypt(updates.data);
      updates.data = JSON.stringify(encryptedData);
      updates.encrypted = true;
    }

    const updatedData = {
      ...personalData,
      ...updates,
      lastModified: new Date(),
    };

    this.personalDataStore.set(id, updatedData);

    logger.info('Personal data updated', { id });
    return true;
  }

  /**
   * Record consent
   */
  async recordConsent(consent: Omit<ConsentRecord, 'id' | 'consentDate'>): Promise<string> {
    const id = `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const consentRecord: ConsentRecord = {
      id,
      ...consent,
      consentDate: new Date(),
    };

    this.consentRecords.set(id, consentRecord);

    logger.info('Consent recorded', {
      id,
      dataSubjectId: consent.dataSubjectId,
      purposes: consent.purposes,
      consentGiven: consent.consentGiven,
    });

    return id;
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(consentId: string): Promise<boolean> {
    const consent = this.consentRecords.get(consentId);
    if (!consent) return false;

    consent.consentGiven = false;
    consent.withdrawnDate = new Date();

    this.consentRecords.set(consentId, consent);

    logger.info('Consent withdrawn', { consentId });
    return true;
  }

  /**
   * Check if consent is valid for purpose
   */
  async hasValidConsent(dataSubjectId: string, purpose: string): Promise<boolean> {
    for (const consent of this.consentRecords.values()) {
      if (consent.dataSubjectId === dataSubjectId &&
          consent.consentGiven &&
          !consent.withdrawnDate &&
          consent.purposes.includes(purpose)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Export personal data (Data portability)
   */
  async exportPersonalData(dataSubjectId: string): Promise<{
    personalData: any[];
    consents: ConsentRecord[];
    exportDate: Date;
  }> {
    const personalData = await this.getPersonalDataBySubject(dataSubjectId);
    const consents: ConsentRecord[] = [];

    // Decrypt personal data for export
    const decryptedData = await Promise.all(
      personalData.map(async (data) => {
        try {
          const encryptedData = JSON.parse(data.data);
          const decryptedValue = encryptionService.decrypt(encryptedData);

          return {
            ...data,
            data: decryptedValue,
            encrypted: false,
          };
        } catch (error) {
          logger.error('Failed to decrypt personal data for export', { id: data.id, error });
          return data;
        }
      })
    );

    // Get consent records
    for (const consent of this.consentRecords.values()) {
      if (consent.dataSubjectId === dataSubjectId) {
        consents.push(consent);
      }
    }

    return {
      personalData: decryptedData,
      consents,
      exportDate: new Date(),
    };
  }

  /**
   * Register processing activity
   */
  async registerProcessingActivity(activity: Omit<DataProcessingActivity, 'id'>): Promise<string> {
    const id = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const processingActivity: DataProcessingActivity = {
      id,
      ...activity,
    };

    this.processingActivities.set(id, processingActivity);

    logger.info('Processing activity registered', {
      id,
      name: activity.name,
      purposes: activity.purposes,
    });

    return id;
  }

  /**
   * Get processing activities register
   */
  async getProcessingActivitiesRegister(): Promise<DataProcessingActivity[]> {
    return Array.from(this.processingActivities.values());
  }

  /**
   * Report data breach
   */
  async reportDataBreach(breach: Omit<DataBreachIncident, 'id' | 'discoveredAt' | 'status'>): Promise<string> {
    const id = `breach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const breachIncident: DataBreachIncident = {
      id,
      ...breach,
      discoveredAt: new Date(),
      status: 'open',
    };

    this.breachIncidents.set(id, breachIncident);

    logger.error('Data breach reported', {
      id,
      title: breach.title,
      severity: breach.severity,
      affectedRecords: breach.affectedRecords,
    });

    // Auto-determine if notification is required (72 hours rule)
    if (breach.severity === 'high' || breach.severity === 'critical') {
      breachIncident.notificationRequired = true;
    }

    return id;
  }

  /**
   * Update data breach incident
   */
  async updateDataBreach(id: string, updates: Partial<DataBreachIncident>): Promise<boolean> {
    const incident = this.breachIncidents.get(id);
    if (!incident) return false;

    const updatedIncident = { ...incident, ...updates };
    this.breachIncidents.set(id, updatedIncident);

    logger.info('Data breach updated', { id, status: updatedIncident.status });
    return true;
  }

  /**
   * Get data breaches requiring notification
   */
  async getBreachesRequiringNotification(): Promise<DataBreachIncident[]> {
    const breaches: DataBreachIncident[] = [];
    const now = new Date();

    for (const breach of this.breachIncidents.values()) {
      if (breach.notificationRequired && !breach.supervisoryAuthorityNotified) {
        const timeSinceDiscovery = now.getTime() - breach.discoveredAt.getTime();
        const hoursElapsed = timeSinceDiscovery / (1000 * 60 * 60);

        // GDPR requires notification within 72 hours
        if (hoursElapsed < 72) {
          breaches.push(breach);
        }
      }
    }

    return breaches;
  }

  /**
   * Clean up expired data
   */
  async cleanupExpiredData(): Promise<{
    deleted: number;
    errors: string[];
  }> {
    let deleted = 0;
    const errors: string[] = [];
    const now = new Date();

    for (const [id, personalData] of this.personalDataStore.entries()) {
      const retentionEndDate = new Date(personalData.collectedAt);
      retentionEndDate.setDate(retentionEndDate.getDate() + personalData.retentionPeriod);

      if (now > retentionEndDate) {
        try {
          this.personalDataStore.delete(id);
          deleted++;

          logger.info('Expired personal data deleted', {
            id,
            dataSubjectId: personalData.dataSubjectId,
            retentionEndDate,
          });
        } catch (error) {
          errors.push(`Failed to delete expired data ${id}: ${error}`);
        }
      }
    }

    return { deleted, errors };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(): Promise<{
    summary: {
      totalPersonalDataRecords: number;
      totalDataSubjects: number;
      totalConsentRecords: number;
      activeConsents: number;
      withdrawnConsents: number;
      processingActivities: number;
      dataBreaches: number;
      openBreaches: number;
    };
    dataRetention: {
      expiringSoon: number; // Expiring within 30 days
      expired: number;
    };
    consent: {
      consentRate: number;
      withdrawalRate: number;
    };
    breaches: DataBreachIncident[];
  }> {
    const personalDataRecords = Array.from(this.personalDataStore.values());
    const consentRecords = Array.from(this.consentRecords.values());
    const breaches = Array.from(this.breachIncidents.values());

    // Calculate unique data subjects
    const dataSubjects = new Set(personalDataRecords.map(pd => pd.dataSubjectId));

    // Calculate consent metrics
    const activeConsents = consentRecords.filter(c => c.consentGiven && !c.withdrawnDate).length;
    const withdrawnConsents = consentRecords.filter(c => c.withdrawnDate).length;

    // Calculate retention metrics
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    let expiringSoon = 0;
    let expired = 0;

    for (const personalData of personalDataRecords) {
      const retentionEndDate = new Date(personalData.collectedAt);
      retentionEndDate.setDate(retentionEndDate.getDate() + personalData.retentionPeriod);

      if (retentionEndDate <= now) {
        expired++;
      } else if (retentionEndDate <= thirtyDaysFromNow) {
        expiringSoon++;
      }
    }

    // Calculate rates
    const consentRate = consentRecords.length > 0 ?
      (activeConsents / consentRecords.length) * 100 : 0;
    const withdrawalRate = consentRecords.length > 0 ?
      (withdrawnConsents / consentRecords.length) * 100 : 0;

    return {
      summary: {
        totalPersonalDataRecords: personalDataRecords.length,
        totalDataSubjects: dataSubjects.size,
        totalConsentRecords: consentRecords.length,
        activeConsents,
        withdrawnConsents,
        processingActivities: this.processingActivities.size,
        dataBreaches: breaches.length,
        openBreaches: breaches.filter(b => b.status === 'open' || b.status === 'investigating').length,
      },
      dataRetention: {
        expiringSoon,
        expired,
      },
      consent: {
        consentRate,
        withdrawalRate,
      },
      breaches: breaches.filter(b => b.status === 'open' || b.status === 'investigating'),
    };
  }

  /**
   * Validate GDPR compliance
   */
  async validateCompliance(): Promise<{
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for expired data
    const { deleted } = await this.cleanupExpiredData();
    if (deleted > 0) {
      issues.push(`${deleted} expired personal data records found and cleaned up`);
      recommendations.push('Implement automated data retention cleanup');
    }

    // Check for unreported breaches
    const unreportedBreaches = await this.getBreachesRequiringNotification();
    if (unreportedBreaches.length > 0) {
      issues.push(`${unreportedBreaches.length} data breaches require supervisory authority notification`);
      recommendations.push('Report data breaches to supervisory authority within 72 hours');
    }

    // Check processing activities register
    if (this.processingActivities.size === 0) {
      issues.push('No processing activities registered');
      recommendations.push('Maintain a register of processing activities');
    }

    // Check for personal data without consent
    let dataWithoutConsent = 0;
    for (const personalData of this.personalDataStore.values()) {
      if (personalData.legalBasis === 'consent') {
        const hasConsent = await this.hasValidConsent(personalData.dataSubjectId, personalData.purpose);
        if (!hasConsent) {
          dataWithoutConsent++;
        }
      }
    }

    if (dataWithoutConsent > 0) {
      issues.push(`${dataWithoutConsent} personal data records lack valid consent`);
      recommendations.push('Ensure all consent-based processing has valid consent records');
    }

    return {
      compliant: issues.length === 0,
      issues,
      recommendations,
    };
  }
}

// Export singleton instance
export const gdprComplianceService = new GDPRComplianceService();
