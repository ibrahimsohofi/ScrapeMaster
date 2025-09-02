import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - DataVault Pro',
  description: 'DataVault Pro Terms of Service - Legal terms and conditions for using our platform.',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto prose prose-gray dark:prose-invert">
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: January 15, 2024</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using ScrapeCloud's web scraping platform and services ("Services"),
          you agree to be bound by these Terms of Service ("Terms"). If you do not agree to
          these Terms, you may not use our Services.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          ScrapeCloud provides a cloud-based web scraping platform that allows users to extract
          data from websites through automated tools, APIs, and related services. Our Services
          include but are not limited to:
        </p>
        <ul>
          <li>Web scraping tools and infrastructure</li>
          <li>Data extraction and processing services</li>
          <li>API access and integrations</li>
          <li>Data export and storage capabilities</li>
          <li>Analytics and monitoring dashboards</li>
        </ul>

        <h2>3. User Accounts and Registration</h2>

        <h3>3.1 Account Creation</h3>
        <p>
          To use our Services, you must create an account and provide accurate, complete
          information. You are responsible for maintaining the confidentiality of your
          account credentials.
        </p>

        <h3>3.2 Account Security</h3>
        <p>
          You are solely responsible for all activities that occur under your account.
          You must immediately notify us of any unauthorized use of your account.
        </p>

        <h2>4. Acceptable Use Policy</h2>

        <h3>4.1 Permitted Uses</h3>
        <p>You may use our Services for legitimate business purposes, including:</p>
        <ul>
          <li>Market research and competitive analysis</li>
          <li>Price monitoring and comparison</li>
          <li>Content aggregation and curation</li>
          <li>Lead generation and contact information</li>
          <li>Academic and research purposes</li>
        </ul>

        <h3>4.2 Prohibited Uses</h3>
        <p>You may not use our Services to:</p>
        <ul>
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe on intellectual property rights</li>
          <li>Scrape personal data without proper consent</li>
          <li>Overload or disrupt target websites</li>
          <li>Bypass website security measures or access controls</li>
          <li>Scrape content protected by login credentials not owned by you</li>
          <li>Collect sensitive information (passwords, financial data, etc.)</li>
          <li>Use scraped data for spam or harassment</li>
          <li>Resell or redistribute our Services without authorization</li>
        </ul>

        <h2>5. Compliance and Legal Responsibility</h2>

        <h3>5.1 User Responsibility</h3>
        <p>
          You are solely responsible for ensuring that your use of our Services complies with:
        </p>
        <ul>
          <li>Applicable laws and regulations</li>
          <li>Website terms of service and robots.txt files</li>
          <li>Data protection and privacy laws (GDPR, CCPA, etc.)</li>
          <li>Intellectual property laws</li>
        </ul>

        <h3>5.2 Website Compliance</h3>
        <p>
          Before scraping any website, you must review and comply with the target website's
          terms of service, robots.txt file, and any applicable rate limiting or access restrictions.
        </p>

        <h2>6. Service Limitations and Usage Quotas</h2>

        <h3>6.1 Usage Limits</h3>
        <p>
          Your use of our Services is subject to usage quotas based on your subscription plan.
          These may include limits on:
        </p>
        <ul>
          <li>Number of requests per month</li>
          <li>Concurrent scraping sessions</li>
          <li>Data storage and retention</li>
          <li>API call rates</li>
        </ul>

        <h3>6.2 Service Availability</h3>
        <p>
          While we strive for high availability, we do not guarantee uninterrupted access
          to our Services. We may perform maintenance or updates that temporarily affect
          service availability.
        </p>

        <h2>7. Payment Terms and Billing</h2>

        <h3>7.1 Subscription Fees</h3>
        <p>
          Use of our Services requires payment of subscription fees as described in your
          chosen plan. Fees are billed in advance and are non-refundable except as
          required by law.
        </p>

        <h3>7.2 Payment Processing</h3>
        <p>
          You authorize us to charge your designated payment method for all fees. If
          payment fails, we may suspend or terminate your access to the Services.
        </p>

        <h3>7.3 Price Changes</h3>
        <p>
          We may modify our pricing with 30 days' notice. Continued use of the Services
          after a price change constitutes acceptance of the new pricing.
        </p>

        <h2>8. Intellectual Property Rights</h2>

        <h3>8.1 Our IP Rights</h3>
        <p>
          ScrapeCloud retains all rights, title, and interest in our Services, including
          all intellectual property rights. You may not copy, modify, or reverse engineer
          our Services.
        </p>

        <h3>8.2 Your Data</h3>
        <p>
          You retain ownership of data you provide to or collect through our Services.
          You grant us a limited license to process and store this data to provide our Services.
        </p>

        <h2>9. Privacy and Data Protection</h2>
        <p>
          Our collection and use of your information is governed by our
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>,
          which is incorporated into these Terms by reference.
        </p>

        <h2>10. Disclaimers and Limitation of Liability</h2>

        <h3>10.1 Service Disclaimers</h3>
        <p>
          Our Services are provided "as is" without warranties of any kind. We disclaim
          all warranties, express or implied, including but not limited to warranties of
          merchantability, fitness for a particular purpose, and non-infringement.
        </p>

        <h3>10.2 Limitation of Liability</h3>
        <p>
          To the maximum extent permitted by law, ScrapeCloud shall not be liable for any
          indirect, incidental, special, or consequential damages arising from your use
          of our Services.
        </p>

        <h2>11. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless ScrapeCloud from any claims, losses,
          or damages arising from your use of our Services or violation of these Terms.
        </p>

        <h2>12. Termination</h2>

        <h3>12.1 Termination by You</h3>
        <p>
          You may terminate your account at any time by canceling your subscription
          through your account settings.
        </p>

        <h3>12.2 Termination by Us</h3>
        <p>
          We may suspend or terminate your account if you violate these Terms or for
          any other reason with appropriate notice.
        </p>

        <h2>13. Governing Law and Dispute Resolution</h2>
        <p>
          These Terms are governed by the laws of the State of California. Any disputes
          shall be resolved through binding arbitration in San Francisco, California.
        </p>

        <h2>14. Changes to Terms</h2>
        <p>
          We may update these Terms from time to time. We will notify you of material
          changes via email or through our platform. Continued use after changes
          constitutes acceptance of the updated Terms.
        </p>

        <h2>15. Contact Information</h2>
        <p>
          If you have questions about these Terms, please contact us at:
        </p>
        <div className="not-prose bg-muted p-6 rounded-lg">
          <p><strong>ScrapeCloud Legal Team</strong></p>
          <p>Email: legal@scrapecloud.com</p>
          <p>Address: 123 Market St, Suite 400, San Francisco, CA 94105</p>
        </div>
      </div>
    </div>
  );
}
