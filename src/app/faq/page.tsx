import type { Metadata } from 'next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, HelpCircle, MessageCircle, Book, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FAQ - DataVault Pro',
  description: 'Frequently asked questions about DataVault Pro web scraping platform, pricing, features, and support.',
};

const faqCategories = [
  {
    name: 'Getting Started',
    icon: '🚀',
    questions: [
      {
        question: 'What is DataVault Pro?',
        answer: 'DataVault Pro is a cloud-based web scraping platform that allows you to extract structured data from websites without writing complex code. We provide tools, APIs, and infrastructure to make web scraping accessible to developers and businesses of all sizes.',
      },
      {
        question: 'How do I get started with DataVault Pro?',
        answer: 'Getting started is easy! Sign up for a free account, create your first scraper using our visual interface or API, configure your data selectors, and start extracting data. Our tutorials and documentation will guide you through the process step by step.',
      },
      {
        question: 'Do I need programming experience to use DataVault Pro?',
        answer: 'No! While programming knowledge can be helpful for advanced use cases, our visual scraper builder allows non-technical users to extract data using point-and-click interfaces. We also provide comprehensive APIs for developers who prefer coding.',
      },
      {
        question: 'What websites can I scrape?',
        answer: 'You can scrape most publicly accessible websites. However, you must respect website terms of service, robots.txt files, and applicable laws. We provide guidance on best practices and compliance to help you scrape responsibly.',
      },
    ],
  },
  {
    name: 'Technical Questions',
    icon: '⚙️',
    questions: [
      {
        question: 'How does DataVault Pro handle JavaScript-heavy websites?',
        answer: 'DataVault Pro uses advanced browser automation technology (Playwright) to fully render JavaScript content. This ensures we can extract data from modern single-page applications and dynamic websites that rely heavily on JavaScript.',
      },
      {
        question: 'Can DataVault Pro handle websites that require login?',
        answer: 'Yes, but only if you own the credentials or have explicit permission. You can configure authentication methods including cookies, headers, and form-based login. We strongly advise against scraping password-protected content without proper authorization.',
      },
      {
        question: 'What happens if a website blocks my scraper?',
        answer: 'We provide several anti-blocking features including proxy rotation, user-agent rotation, request delays, and CAPTCHA handling. Our infrastructure is designed to minimize detection while respecting website rate limits.',
      },
      {
        question: 'How accurate is the AI-powered selector generation?',
        answer: 'Our AI selector generation achieves 90%+ accuracy for most websites. It uses advanced computer vision and machine learning to identify data patterns. You can always review and refine the generated selectors for optimal results.',
      },
      {
        question: 'Can I schedule my scrapers to run automatically?',
        answer: 'Absolutely! You can schedule scrapers to run at specific intervals (hourly, daily, weekly, monthly) or trigger them via our API. We also support webhook notifications when scraping jobs complete.',
      },
    ],
  },
  {
    name: 'Pricing & Billing',
    icon: '💳',
    questions: [
      {
        question: 'How does DataVault Pro pricing work?',
        answer: 'Our pricing is based on usage - you pay for the number of requests, data points extracted, and additional features you use. We offer flexible plans from a free tier for testing to enterprise solutions for high-volume users.',
      },
      {
        question: 'What\'s included in the free plan?',
        answer: 'The free plan includes 1,000 requests per month, basic scraping features, email support, and access to our documentation. It\'s perfect for testing and small projects.',
      },
      {
        question: 'Do you offer annual discounts?',
        answer: 'Yes! Annual subscriptions receive a 20% discount compared to monthly billing. Enterprise customers can also negotiate custom pricing based on their specific needs and volume requirements.',
      },
      {
        question: 'What happens if I exceed my plan limits?',
        answer: 'You\'ll receive notifications as you approach your limits. You can either upgrade your plan or purchase additional usage credits. We don\'t automatically charge overages without your consent.',
      },
      {
        question: 'Can I cancel my subscription anytime?',
        answer: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access to your plan features until the end of your current billing period. No cancellation fees apply.',
      },
    ],
  },
  {
    name: 'Legal & Compliance',
    icon: '⚖️',
    questions: [
      {
        question: 'Is web scraping legal?',
        answer: 'Web scraping is generally legal for publicly available data, but you must comply with website terms of service, respect robots.txt, and follow applicable laws like GDPR and CCPA. We provide compliance guidance to help you scrape responsibly.',
      },
      {
        question: 'How does DataVault Pro ensure GDPR compliance?',
        answer: 'We\'re fully GDPR compliant with data processing agreements, encryption, access controls, and user rights management. We help you understand your obligations when scraping personal data and provide tools for compliance.',
      },
      {
        question: 'What if I accidentally scrape personal data?',
        answer: 'If you inadvertently collect personal data, immediately stop the scraper, delete the data, and review your targeting criteria. We provide data deletion tools and guidance on handling such situations responsibly.',
      },
      {
        question: 'Do you provide legal protection for users?',
        answer: 'While we provide guidance and best practices, users are responsible for ensuring their scraping activities comply with applicable laws and website terms. We recommend consulting legal counsel for specific compliance questions.',
      },
    ],
  },
  {
    name: 'API & Integration',
    icon: '🔗',
    questions: [
      {
        question: 'Do you provide an API?',
        answer: 'Yes! We offer a comprehensive RESTful API that allows you to create, manage, and run scrapers programmatically. Our API includes endpoints for job management, data export, and webhook configuration.',
      },
      {
        question: 'What programming languages do you support?',
        answer: 'Our API works with any language that can make HTTP requests. We provide official SDKs for Python, Node.js, PHP, and Go, plus code examples for many other languages.',
      },
      {
        question: 'Can I integrate DataVault Pro with my existing applications?',
        answer: 'Absolutely! Our API and webhooks make it easy to integrate with existing workflows. Popular integrations include Zapier, Make (Integromat), databases, cloud storage, and business intelligence tools.',
      },
      {
        question: 'Do you support real-time data streaming?',
        answer: 'We offer near real-time data delivery through webhooks and our streaming API. For truly real-time requirements, we can discuss custom solutions with enterprise customers.',
      },
      {
        question: 'What authentication methods do you support for the API?',
        answer: 'We use API key authentication for simplicity and security. Enterprise customers can also use OAuth 2.0 and custom authentication methods based on their requirements.',
      },
    ],
  },
  {
    name: 'Data & Export',
    icon: '📊',
    questions: [
      {
        question: 'In what formats can I export my data?',
        answer: 'We support multiple export formats including JSON, CSV, Excel (XLSX), XML, and direct database integrations. You can also access data through our API for custom processing.',
      },
      {
        question: 'How long do you store my scraped data?',
        answer: 'Data retention depends on your plan. Free tier: 7 days, Pro: 30 days, Enterprise: custom retention periods. You can export data anytime and configure automatic exports to your preferred storage.',
      },
      {
        question: 'Can I connect DataVault Pro directly to my database?',
        answer: 'Yes! We support direct integration with popular databases including PostgreSQL, MySQL, MongoDB, and data warehouses like Snowflake and BigQuery through our API and webhook system.',
      },
      {
        question: 'What\'s the maximum amount of data I can extract?',
        answer: 'There\'s no hard limit on data volume. Practical limits depend on your plan and the target website\'s capacity. For large-scale projects, we work with you to optimize performance and ensure reliable extraction.',
      },
      {
        question: 'How do you handle data quality and validation?',
        answer: 'We provide data validation rules, duplicate detection, format checking, and quality scoring. Our AI can also identify potential data issues and suggest improvements to your extraction rules.',
      },
    ],
  },
  {
    name: 'Support & Troubleshooting',
    icon: '🛠️',
    questions: [
      {
        question: 'What support options are available?',
        answer: 'We offer email support for all users, live chat for Pro+ customers, and dedicated support for Enterprise clients. We also have comprehensive documentation, tutorials, and an active community forum.',
      },
      {
        question: 'How quickly do you respond to support requests?',
        answer: 'Free tier: 48 hours, Pro: 12 hours, Enterprise: 4 hours for standard issues, 1 hour for critical issues. We also offer 24/7 emergency support for Enterprise customers.',
      },
      {
        question: 'My scraper stopped working. What should I do?',
        answer: 'First, check if the target website has changed. Review our status page for any service issues. Try re-running the scraper or updating your selectors. If problems persist, contact support with your scraper details.',
      },
      {
        question: 'Can you help me build a custom scraper?',
        answer: 'Yes! We offer professional services including custom scraper development, data processing consultation, and integration assistance. Contact our sales team to discuss your specific requirements.',
      },
      {
        question: 'Do you provide training or onboarding?',
        answer: 'We offer free onboarding sessions for new customers, comprehensive documentation, video tutorials, and paid training programs for teams. Enterprise customers receive dedicated onboarding support.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Find answers to common questions about DataVault Pro, web scraping best practices,
            and how to get the most out of our platform.
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search FAQ..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Card className="text-center cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="pt-6">
              <Book className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">Documentation</h3>
              <p className="text-sm text-muted-foreground">Complete guides</p>
            </CardContent>
          </Card>

          <Card className="text-center cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="pt-6">
              <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">Tutorials</h3>
              <p className="text-sm text-muted-foreground">Step-by-step guides</p>
            </CardContent>
          </Card>

          <Card className="text-center cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="pt-6">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">Community</h3>
              <p className="text-sm text-muted-foreground">Join discussions</p>
            </CardContent>
          </Card>

          <Card className="text-center cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="pt-6">
              <HelpCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">Contact Support</h3>
              <p className="text-sm text-muted-foreground">Get personal help</p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">{category.icon}</span>
                <h2 className="text-2xl font-bold">{category.name}</h2>
                <Badge variant="secondary">{category.questions.length} questions</Badge>
              </div>

              <Accordion type="single" collapsible className="space-y-2">
                {category.questions.map((faq, questionIndex) => (
                  <AccordionItem
                    key={questionIndex}
                    value={`${categoryIndex}-${questionIndex}`}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="text-left hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        {/* Still Need Help */}
        <Card className="mt-16 text-center">
          <CardHeader>
            <CardTitle>Still have questions?</CardTitle>
            <CardDescription>
              Can't find what you're looking for? Our support team is here to help.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">Contact Support</Button>
            <Button variant="outline" size="lg">Schedule a Demo</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
