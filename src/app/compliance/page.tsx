import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, FileCheck, Users, Globe, Award, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Compliance - DataVault Pro',
  description: 'DataVault Pro compliance information - security, privacy, and regulatory compliance.',
};

const certifications = [
  {
    name: 'SOC 2 Type II',
    description: 'Security, availability, and confidentiality controls',
    status: 'Certified',
    icon: Shield,
  },
  {
    name: 'ISO 27001',
    description: 'Information security management system',
    status: 'In Progress',
    icon: Lock,
  },
  {
    name: 'GDPR Compliant',
    description: 'EU General Data Protection Regulation',
    status: 'Compliant',
    icon: FileCheck,
  },
  {
    name: 'CCPA Compliant',
    description: 'California Consumer Privacy Act',
    status: 'Compliant',
    icon: Users,
  },
];

const securityMeasures = [
  {
    category: 'Data Encryption',
    measures: [
      'AES-256 encryption for data at rest',
      'TLS 1.3 for data in transit',
      'End-to-end encryption for sensitive data',
      'Encrypted database backups',
    ],
  },
  {
    category: 'Access Controls',
    measures: [
      'Multi-factor authentication (MFA)',
      'Role-based access control (RBAC)',
      'Regular access reviews and audits',
      'Principle of least privilege',
    ],
  },
  {
    category: 'Infrastructure Security',
    measures: [
      'Network segmentation and firewalls',
      'Regular vulnerability assessments',
      'Intrusion detection systems',
      'Automated security monitoring',
    ],
  },
  {
    category: 'Operational Security',
    measures: [
      '24/7 security operations center',
      'Incident response procedures',
      'Regular employee security training',
      'Secure software development lifecycle',
    ],
  },
];

const privacyFrameworks = [
  {
    name: 'GDPR',
    region: 'European Union',
    description: 'Comprehensive data protection regulation covering EU residents',
    compliance: ['Data minimization', 'Consent management', 'Right to erasure', 'Data portability'],
  },
  {
    name: 'CCPA',
    region: 'California, USA',
    description: 'Privacy law giving California residents control over their personal information',
    compliance: ['Right to know', 'Right to delete', 'Right to opt-out', 'Non-discrimination'],
  },
  {
    name: 'PIPEDA',
    region: 'Canada',
    description: 'Personal Information Protection and Electronic Documents Act',
    compliance: ['Consent requirements', 'Purpose limitation', 'Data accuracy', 'Safeguards'],
  },
];

export default function CompliancePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Security & Compliance
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            At DataVault Pro, security and compliance are fundamental to everything we do.
            We maintain the highest standards to protect your data and ensure regulatory compliance
            across global jurisdictions.
          </p>
        </div>

        {/* Certifications */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Certifications & Compliance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications.map((cert, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <cert.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <CardTitle className="text-lg">{cert.name}</CardTitle>
                  <Badge
                    variant={cert.status === 'Certified' || cert.status === 'Compliant' ? 'default' : 'secondary'}
                    className="mx-auto"
                  >
                    {cert.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{cert.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Security Measures */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Security Framework</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityMeasures.map((category, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.measures.map((measure, measureIndex) => (
                      <li key={measureIndex} className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{measure}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Privacy Compliance */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Privacy Frameworks</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {privacyFrameworks.map((framework, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{framework.name}</CardTitle>
                    <Badge variant="outline">{framework.region}</Badge>
                  </div>
                  <CardDescription>{framework.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <h4 className="font-medium mb-3">Our Compliance:</h4>
                  <ul className="space-y-2">
                    {framework.compliance.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Data Processing */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Data Processing Principles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardHeader>
                <Globe className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle className="text-lg">Data Minimization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We collect and process only the data necessary for our services
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Lock className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle className="text-lg">Purpose Limitation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Data is used only for specified, explicit, and legitimate purposes
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle className="text-lg">Data Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We maintain accurate and up-to-date data with regular reviews
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Incident Response */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Incident Response & Business Continuity
            </CardTitle>
            <CardDescription>
              Our comprehensive approach to security incidents and business continuity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-medium mb-4">Incident Response</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 24/7 monitoring and alerting</li>
                  <li>• Defined escalation procedures</li>
                  <li>• Rapid containment and remediation</li>
                  <li>• Transparent customer communication</li>
                  <li>• Post-incident review and improvement</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-4">Business Continuity</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Multi-region infrastructure deployment</li>
                  <li>• Automated backups and disaster recovery</li>
                  <li>• Regular business continuity testing</li>
                  <li>• 99.9% uptime SLA commitment</li>
                  <li>• Emergency communication procedures</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendor Management */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle>Third-Party Risk Management</CardTitle>
            <CardDescription>
              How we ensure our vendors and partners meet our security standards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Vendor Assessment Process</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  All third-party vendors undergo rigorous security and compliance assessments:
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <li>• Security questionnaire completion</li>
                  <li>• Certification and audit review</li>
                  <li>• Data processing agreement execution</li>
                  <li>• Regular re-assessment cycles</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Security & Compliance Inquiries</CardTitle>
            <CardDescription>
              Have questions about our security practices or need compliance documentation?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                For security-related questions, compliance documentation, or to report a security issue:
              </p>
              <div className="bg-muted p-6 rounded-lg">
                <p><strong>Security Team</strong></p>
                <p>Email: security@datavaultpro.com</p>
                <p>For urgent security matters: Call +1 (555) 123-4567</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
