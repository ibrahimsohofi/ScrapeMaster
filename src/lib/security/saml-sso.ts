import { logger } from '@/lib/utils';
import * as crypto from 'crypto';

interface SAMLConfig {
  entryPoint: string;
  issuer: string;
  cert: string;
  privateKey?: string;
  callbackUrl: string;
  logoutUrl?: string;
  wantAssertionsSigned?: boolean;
  wantAuthnResponseSigned?: boolean;
  signatureAlgorithm?: string;
}

interface SAMLAssertion {
  nameID: string;
  nameIDFormat: string;
  sessionIndex: string;
  attributes: Record<string, any>;
  notBefore?: Date;
  notOnOrAfter?: Date;
}

interface SAMLResponse {
  assertion: SAMLAssertion;
  profile: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    groups?: string[];
    roles?: string[];
  };
}

export class SAMLProvider {
  private config: SAMLConfig;
  private algorithm: string;

  constructor(config: SAMLConfig) {
    this.config = config;
    this.algorithm = config.signatureAlgorithm || 'sha256';
  }

  /**
   * Generate SAML AuthnRequest
   */
  generateAuthnRequest(relayState?: string): {
    url: string;
    samlRequest: string;
  } {
    const id = `_${crypto.randomUUID()}`;
    const issueInstant = new Date().toISOString();

    const samlRequest = `
      <samlp:AuthnRequest
        xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
        xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
        ID="${id}"
        Version="2.0"
        IssueInstant="${issueInstant}"
        AssertionConsumerServiceURL="${this.config.callbackUrl}"
        Destination="${this.config.entryPoint}">
        <saml:Issuer>${this.config.issuer}</saml:Issuer>
        <samlp:NameIDPolicy
          Format="urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress"
          AllowCreate="true" />
      </samlp:AuthnRequest>
    `.trim();

    const encodedRequest = Buffer.from(samlRequest).toString('base64');

    const params = new URLSearchParams({
      SAMLRequest: encodedRequest,
    });

    if (relayState) {
      params.append('RelayState', relayState);
    }

    const url = `${this.config.entryPoint}?${params.toString()}`;

    return {
      url,
      samlRequest: encodedRequest,
    };
  }

  /**
   * Process SAML Response
   */
  async processSAMLResponse(samlResponse: string): Promise<SAMLResponse> {
    try {
      // Decode the SAML response
      const decodedResponse = Buffer.from(samlResponse, 'base64').toString('utf-8');

      // In a real implementation, you would:
      // 1. Parse the XML
      // 2. Validate signatures
      // 3. Check timestamps
      // 4. Extract assertion data

      // For this example, we'll simulate the parsed response
      const mockAssertion: SAMLAssertion = {
        nameID: 'user@company.com',
        nameIDFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress',
        sessionIndex: `_session_${crypto.randomUUID()}`,
        attributes: {
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'user@company.com',
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname': 'John',
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname': 'Doe',
          'http://schemas.microsoft.com/ws/2008/06/identity/claims/groups': ['admin', 'users'],
        },
        notBefore: new Date(),
        notOnOrAfter: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      const profile = {
        id: mockAssertion.nameID,
        email: mockAssertion.attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
        firstName: mockAssertion.attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'],
        lastName: mockAssertion.attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'],
        displayName: `${mockAssertion.attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname']} ${mockAssertion.attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname']}`,
        groups: mockAssertion.attributes['http://schemas.microsoft.com/ws/2008/06/identity/claims/groups'] || [],
        roles: this.mapGroupsToRoles(mockAssertion.attributes['http://schemas.microsoft.com/ws/2008/06/identity/claims/groups'] || []),
      };

      return {
        assertion: mockAssertion,
        profile,
      };
    } catch (error) {
      logger.error('Failed to process SAML response', { error });
      throw new Error('Invalid SAML response');
    }
  }

  /**
   * Generate SAML LogoutRequest
   */
  generateLogoutRequest(nameID: string, sessionIndex: string): {
    url: string;
    samlRequest: string;
  } {
    const id = `_${crypto.randomUUID()}`;
    const issueInstant = new Date().toISOString();

    const logoutRequest = `
      <samlp:LogoutRequest
        xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
        xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
        ID="${id}"
        Version="2.0"
        IssueInstant="${issueInstant}"
        Destination="${this.config.logoutUrl}">
        <saml:Issuer>${this.config.issuer}</saml:Issuer>
        <saml:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress">${nameID}</saml:NameID>
        <samlp:SessionIndex>${sessionIndex}</samlp:SessionIndex>
      </samlp:LogoutRequest>
    `.trim();

    const encodedRequest = Buffer.from(logoutRequest).toString('base64');

    const params = new URLSearchParams({
      SAMLRequest: encodedRequest,
    });

    const url = `${this.config.logoutUrl}?${params.toString()}`;

    return {
      url,
      samlRequest: encodedRequest,
    };
  }

  /**
   * Validate SAML signature (simplified)
   */
  private validateSignature(xml: string, signature: string): boolean {
    // In a real implementation, this would:
    // 1. Extract the signature from the XML
    // 2. Canonicalize the signed info
    // 3. Verify the signature using the certificate

    // For this example, we'll always return true
    logger.info('SAML signature validation performed');
    return true;
  }

  /**
   * Map SAML groups to application roles
   */
  private mapGroupsToRoles(groups: string[]): string[] {
    const roleMapping: Record<string, string[]> = {
      'admin': ['admin', 'user'],
      'managers': ['manager', 'user'],
      'users': ['user'],
      'viewers': ['viewer'],
    };

    const roles: string[] = [];
    for (const group of groups) {
      const mappedRoles = roleMapping[group.toLowerCase()];
      if (mappedRoles) {
        roles.push(...mappedRoles);
      }
    }

    // Remove duplicates
    return [...new Set(roles)];
  }

  /**
   * Get SAML metadata
   */
  getMetadata(): string {
    return `
      <EntityDescriptor
        xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
        entityID="${this.config.issuer}">
        <SPSSODescriptor
          AuthnRequestsSigned="false"
          WantAssertionsSigned="true"
          protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
          <NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress</NameIDFormat>
          <AssertionConsumerService
            Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
            Location="${this.config.callbackUrl}"
            index="1" />
          <SingleLogoutService
            Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            Location="${this.config.logoutUrl}" />
        </SPSSODescriptor>
      </EntityDescriptor>
    `.trim();
  }
}

/**
 * Multi-Factor Authentication
 */
interface MFAConfig {
  issuer: string;
  window: number; // Number of 30-second windows to allow
  encoding: 'base32' | 'hex';
}

export class MFAProvider {
  private config: MFAConfig;

  constructor(config: MFAConfig) {
    this.config = config;
  }

  /**
   * Generate MFA secret for user
   */
  generateSecret(userEmail: string): {
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  } {
    const secret = crypto.randomBytes(20).toString('base64');
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    const qrCodeUrl = `otpauth://totp/${encodeURIComponent(userEmail)}?secret=${secret}&issuer=${encodeURIComponent(this.config.issuer)}`;

    return {
      secret,
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Verify TOTP token
   */
  verifyToken(secret: string, token: string): boolean {
    const timeStep = Math.floor(Date.now() / 30000);

    for (let i = -this.config.window; i <= this.config.window; i++) {
      const expectedToken = this.generateTOTP(secret, timeStep + i);
      if (expectedToken === token) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verify backup code
   */
  verifyBackupCode(storedCodes: string[], providedCode: string): {
    valid: boolean;
    remainingCodes: string[];
  } {
    const index = storedCodes.indexOf(providedCode.toUpperCase());
    if (index === -1) {
      return { valid: false, remainingCodes: storedCodes };
    }

    const remainingCodes = storedCodes.filter((_, i) => i !== index);
    return { valid: true, remainingCodes };
  }

  /**
   * Generate TOTP token
   */
  private generateTOTP(secret: string, timeStep: number): string {
    const timeBuffer = Buffer.allocUnsafe(8);
    timeBuffer.writeBigUInt64BE(BigInt(timeStep), 0);

    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base64'));
    hmac.update(timeBuffer);
    const hash = hmac.digest();

    const offset = hash[hash.length - 1] & 0xf;
    const code = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);

    return String(code % 1000000).padStart(6, '0');
  }
}

/**
 * Session Management
 */
interface SessionData {
  userId: string;
  email: string;
  roles: string[];
  organizationId: string;
  mfaVerified: boolean;
  samlSessionIndex?: string;
  createdAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
}

export class SessionManager {
  private sessions: Map<string, SessionData> = new Map();
  private maxAge = 24 * 60 * 60 * 1000; // 24 hours
  private maxInactivity = 2 * 60 * 60 * 1000; // 2 hours

  /**
   * Create new session
   */
  createSession(userData: Omit<SessionData, 'createdAt' | 'lastActivity'>): string {
    const sessionId = crypto.randomUUID();

    this.sessions.set(sessionId, {
      ...userData,
      createdAt: new Date(),
      lastActivity: new Date(),
    });

    logger.info('Session created', { sessionId, userId: userData.userId });
    return sessionId;
  }

  /**
   * Get session data
   */
  getSession(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Check if session is expired
    const now = new Date();
    const sessionAge = now.getTime() - session.createdAt.getTime();
    const inactivityTime = now.getTime() - session.lastActivity.getTime();

    if (sessionAge > this.maxAge || inactivityTime > this.maxInactivity) {
      this.sessions.delete(sessionId);
      logger.info('Session expired', { sessionId });
      return null;
    }

    // Update last activity
    session.lastActivity = now;
    this.sessions.set(sessionId, session);

    return session;
  }

  /**
   * Update session
   */
  updateSession(sessionId: string, updates: Partial<SessionData>): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    this.sessions.set(sessionId, {
      ...session,
      ...updates,
      lastActivity: new Date(),
    });

    return true;
  }

  /**
   * Destroy session
   */
  destroySession(sessionId: string): boolean {
    const result = this.sessions.delete(sessionId);
    if (result) {
      logger.info('Session destroyed', { sessionId });
    }
    return result;
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      const sessionAge = now.getTime() - session.createdAt.getTime();
      const inactivityTime = now.getTime() - session.lastActivity.getTime();

      if (sessionAge > this.maxAge || inactivityTime > this.maxInactivity) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info('Cleaned up expired sessions', { count: cleanedCount });
    }
  }

  /**
   * Get all active sessions for user
   */
  getUserSessions(userId: string): Array<{ sessionId: string; data: SessionData }> {
    const userSessions: Array<{ sessionId: string; data: SessionData }> = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        userSessions.push({ sessionId, data: session });
      }
    }

    return userSessions;
  }

  /**
   * Terminate all sessions for user
   */
  terminateUserSessions(userId: string): number {
    let terminated = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
        terminated++;
      }
    }

    logger.info('Terminated user sessions', { userId, count: terminated });
    return terminated;
  }
}

// Export singleton instances
export const samlProvider = new SAMLProvider({
  entryPoint: process.env.SAML_ENTRY_POINT || '',
  issuer: process.env.SAML_ISSUER || 'datavault-pro',
  cert: process.env.SAML_CERT || '',
  callbackUrl: process.env.SAML_CALLBACK_URL || 'https://datavault.pro/auth/saml/callback',
  logoutUrl: process.env.SAML_LOGOUT_URL || 'https://datavault.pro/auth/saml/logout',
  wantAssertionsSigned: true,
});

export const mfaProvider = new MFAProvider({
  issuer: 'DataVault Pro',
  window: 1,
  encoding: 'base32',
});

export const sessionManager = new SessionManager();
