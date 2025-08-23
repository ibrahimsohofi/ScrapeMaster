import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy - DataVault Pro',
  description: 'DataVault Pro Cookie Policy - How we use cookies and tracking technologies.',
};

export default function CookiesPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto prose prose-gray dark:prose-invert">
        <h1>Cookie Policy</h1>
        <p className="text-muted-foreground">Last updated: January 15, 2024</p>

        <h2>1. What Are Cookies?</h2>
        <p>
          Cookies are small text files that are placed on your device when you visit our website.
          They allow us to recognize your device and store information about your preferences or
          past actions to improve your experience with our services.
        </p>

        <h2>2. How We Use Cookies</h2>
        <p>
          DataVault Pro uses cookies and similar tracking technologies for the following purposes:
        </p>
        <ul>
          <li>Essential functionality and security</li>
          <li>User authentication and session management</li>
          <li>Analytics and performance monitoring</li>
          <li>Personalization and user preferences</li>
          <li>Marketing and advertising optimization</li>
        </ul>

        <h2>3. Types of Cookies We Use</h2>

        <h3>3.1 Essential Cookies</h3>
        <p>
          These cookies are necessary for our website to function properly and cannot be disabled:
        </p>

        <div className="not-prose">
          <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 mb-6">
            <thead>
              <tr className="bg-muted">
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Cookie Name</th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Purpose</th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-mono text-sm">session_token</td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">User authentication and session management</td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Session</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-mono text-sm">csrf_token</td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Security protection against CSRF attacks</td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Session</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-mono text-sm">preferences</td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Store user interface preferences</td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">1 year</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>3.2 Analytics Cookies</h3>
        <p>
          These cookies help us understand how users interact with our website and services:
        </p>

        <div className="not-prose">
          <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 mb-6">
            <thead>
              <tr className="bg-muted">
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Cookie Name</th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Purpose</th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-mono text-sm">_ga</td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Google Analytics - distinguish users</td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">2 years</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-mono text-sm">_ga_*</td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Google Analytics - session and campaign data</td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">2 years</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-mono text-sm">usage_analytics</td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Internal analytics for feature usage</td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">30 days</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>3.3 Marketing Cookies</h3>
        <p>
          These cookies are used to track visitors across websites for marketing purposes:
        </p>

        <div className="not-prose">
          <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 mb-6">
            <thead>
              <tr className="bg-muted">
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Cookie Name</th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Purpose</th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-mono text-sm">_fbp</td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Facebook Pixel for conversion tracking</td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">90 days</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-mono text-sm">marketing_source</td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Track marketing campaign effectiveness</td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">30 days</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>4. Third-Party Cookies</h2>
        <p>
          Some cookies are set by third-party services that appear on our pages. We use the
          following third-party services that may set cookies:
        </p>
        <ul>
          <li><strong>Google Analytics:</strong> Website analytics and user behavior tracking</li>
          <li><strong>Google Tag Manager:</strong> Managing marketing and analytics tags</li>
          <li><strong>Facebook Pixel:</strong> Conversion tracking and audience building</li>
          <li><strong>Intercom:</strong> Customer support and messaging</li>
          <li><strong>Stripe:</strong> Payment processing and fraud prevention</li>
        </ul>

        <h2>5. Cookie Duration</h2>

        <h3>5.1 Session Cookies</h3>
        <p>
          These cookies are temporary and are deleted when you close your browser. They are
          used for essential functionality like maintaining your login session.
        </p>

        <h3>5.2 Persistent Cookies</h3>
        <p>
          These cookies remain on your device for a set period or until you delete them.
          They help us remember your preferences and provide a better user experience.
        </p>

        <h2>6. Managing Your Cookie Preferences</h2>

        <h3>6.1 Browser Settings</h3>
        <p>
          Most web browsers allow you to control cookies through their settings. You can:
        </p>
        <ul>
          <li>View what cookies are stored on your device</li>
          <li>Delete existing cookies</li>
          <li>Block cookies from being set</li>
          <li>Set preferences for specific websites</li>
        </ul>

        <h3>6.2 Browser-Specific Instructions</h3>
        <ul>
          <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</li>
          <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
          <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
          <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
        </ul>

        <h3>6.3 Opt-Out Links</h3>
        <p>You can opt out of specific tracking services:</p>
        <ul>
          <li><a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Analytics Opt-out</a></li>
          <li><a href="https://www.facebook.com/help/568137493302217" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Facebook Pixel Opt-out</a></li>
        </ul>

        <h2>7. Impact of Disabling Cookies</h2>
        <p>
          Disabling cookies may affect your experience on our website:
        </p>
        <ul>
          <li>You may need to log in repeatedly</li>
          <li>Your preferences may not be saved</li>
          <li>Some features may not work properly</li>
          <li>We may not be able to provide personalized experiences</li>
        </ul>

        <h2>8. Updates to This Policy</h2>
        <p>
          We may update this Cookie Policy from time to time to reflect changes in our
          practices or applicable laws. We will notify you of any material changes by
          posting the updated policy on our website.
        </p>

        <h2>9. Contact Us</h2>
        <p>
          If you have questions about our use of cookies, please contact us at:
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
