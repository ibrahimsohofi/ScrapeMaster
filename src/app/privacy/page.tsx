import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - DataVault Pro',
  description: 'DataVault Pro Privacy Policy - How we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto prose prose-gray dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: January 15, 2024</p>

        <h2>1. Introduction</h2>
        <p>
          DataVault Pro ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
          explains how we collect, use, disclose, and safeguard your information when you use our web
          scraping platform and services.
        </p>

        <h2>2. Information We Collect</h2>

        <h3>2.1 Personal Information</h3>
        <p>We may collect the following personal information:</p>
        <ul>
          <li>Name and contact information (email address, phone number)</li>
          <li>Account credentials and authentication information</li>
          <li>Billing and payment information</li>
          <li>Company information (if applicable)</li>
        </ul>

        <h3>2.2 Usage Data</h3>
        <p>We automatically collect certain information about your use of our services:</p>
        <ul>
          <li>IP addresses and geolocation data</li>
          <li>Browser type and version</li>
          <li>Usage patterns and feature interactions</li>
          <li>API usage metrics and performance data</li>
          <li>Error logs and debugging information</li>
        </ul>

        <h3>2.3 Scraped Data</h3>
        <p>
          We may temporarily store data that you scrape using our platform for processing,
          quality assurance, and service improvement purposes. This data is handled according
          to your instructions and our data retention policies.
        </p>

        <h2>3. How We Use Your Information</h2>
        <p>We use your information for the following purposes:</p>
        <ul>
          <li>Providing and maintaining our web scraping services</li>
          <li>Processing payments and managing your account</li>
          <li>Communicating with you about our services</li>
          <li>Improving our platform and developing new features</li>
          <li>Detecting and preventing fraud and abuse</li>
          <li>Complying with legal obligations</li>
        </ul>

        <h2>4. Information Sharing and Disclosure</h2>

        <h3>4.1 Third-Party Service Providers</h3>
        <p>
          We may share your information with trusted third-party service providers who assist
          us in operating our platform, including:
        </p>
        <ul>
          <li>Cloud hosting and infrastructure providers</li>
          <li>Payment processing services</li>
          <li>Analytics and monitoring services</li>
          <li>Customer support platforms</li>
        </ul>

        <h3>4.2 Legal Requirements</h3>
        <p>
          We may disclose your information if required by law, court order, or government
          regulation, or if we believe disclosure is necessary to protect our rights or the
          rights of others.
        </p>

        <h3>4.3 Business Transfers</h3>
        <p>
          In the event of a merger, acquisition, or sale of assets, your information may be
          transferred as part of the transaction.
        </p>

        <h2>5. Data Security</h2>
        <p>
          We implement appropriate technical and organizational security measures to protect
          your information against unauthorized access, alteration, disclosure, or destruction:
        </p>
        <ul>
          <li>Encryption of data in transit and at rest</li>
          <li>Regular security audits and penetration testing</li>
          <li>Access controls and authentication mechanisms</li>
          <li>Employee training on data protection practices</li>
        </ul>

        <h2>6. Data Retention</h2>
        <p>
          We retain your personal information for as long as necessary to provide our services
          and fulfill the purposes outlined in this policy. Specific retention periods include:
        </p>
        <ul>
          <li>Account information: Retained while your account is active</li>
          <li>Usage logs: Retained for 12 months</li>
          <li>Scraped data: Processed and deleted according to your settings</li>
          <li>Billing records: Retained for 7 years for tax and accounting purposes</li>
        </ul>

        <h2>7. Your Rights and Choices</h2>
        <p>Depending on your location, you may have the following rights:</p>
        <ul>
          <li>Access to your personal information</li>
          <li>Correction of inaccurate information</li>
          <li>Deletion of your personal information</li>
          <li>Data portability</li>
          <li>Objection to processing</li>
          <li>Withdrawal of consent</li>
        </ul>

        <h2>8. Cookies and Tracking Technologies</h2>
        <p>
          We use cookies and similar tracking technologies to enhance your experience on our
          platform. For detailed information about our use of cookies, please see our
          <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a>.
        </p>

        <h2>9. International Data Transfers</h2>
        <p>
          Your information may be transferred to and processed in countries other than your
          own. We ensure appropriate safeguards are in place for such transfers, including
          standard contractual clauses and adequacy decisions.
        </p>

        <h2>10. Children's Privacy</h2>
        <p>
          Our services are not intended for children under 13 years of age. We do not
          knowingly collect personal information from children under 13.
        </p>

        <h2>11. Updates to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of material
          changes by email or through our platform. Your continued use of our services after
          such changes constitutes acceptance of the updated policy.
        </p>

        <h2>12. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy or our privacy practices, please
          contact us at:
        </p>
        <div className="not-prose bg-muted p-6 rounded-lg">
          <p><strong>DataVault Pro Privacy Team</strong></p>
          <p>Email: privacy@datavaultpro.com</p>
          <p>Address: 123 Market St, Suite 400, San Francisco, CA 94105</p>
        </div>
      </div>
    </div>
  );
}
