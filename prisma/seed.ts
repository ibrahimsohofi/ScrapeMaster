import { PrismaClient, OutputFormat, ScraperStatus, Engine } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      plan: 'PRO',
      isActive: true,
    },
  });

  console.log('✅ Created organization:', organization.name);

  // Create test admin user
  const hashedPassword = await bcrypt.hash('password123', 12);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      hashedPassword: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'ADMIN',
      isVerified: true,
      organizationId: organization.id,
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create test regular user
  const regularUser = await prisma.user.create({
    data: {
      email: 'user@acme.com',
      hashedPassword: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'USER',
      isVerified: true,
      organizationId: organization.id,
    },
  });

  console.log('✅ Created regular user:', regularUser.email);

  // Create test API key
  const apiKey = 'sk_dev_test-api-key-123';
  const apiKeyHash = await bcrypt.hash(apiKey, 12);
  await prisma.apiKey.create({
    data: {
      name: 'Development API Key',
      key: apiKey,
      hashedKey: apiKeyHash,
      permissions: ['jobs:read', 'jobs:write', 'data:read', 'data:export'],
      organizationId: organization.id,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
  });

  console.log('✅ Created API key');

  // Create test scrapers
  const scrapers = [
    {
      name: 'Product Price Scraper',
      description: 'Scrape product prices from e-commerce websites',
      url: 'https://example-store.com/products',
      engine: Engine.PLAYWRIGHT,
      selectors: {
        title: '.product-title',
        price: '.price',
        description: '.product-description',
        image: '.product-image img',
      },
      settings: {
        waitTime: 1000,
        retries: 3,
      },
      schedule: {
        cron: '0 */6 * * *',
        enabled: true,
      },
      outputFormat: OutputFormat.JSON,
      status: ScraperStatus.ACTIVE,
      organizationId: organization.id,
    },
    {
      name: 'News Headlines Scraper',
      description: 'Extract latest news headlines and articles',
      url: 'https://example-news.com',
      engine: Engine.JSDOM,
      selectors: {
        headline: 'h1, .headline',
        author: '.author',
        date: '.publish-date',
        content: '.article-content',
      },
      settings: {
        waitTime: 500,
        retries: 2,
      },
      schedule: {
        cron: '0 */1 * * *',
        enabled: true,
      },
      outputFormat: OutputFormat.JSON,
      status: ScraperStatus.ACTIVE,
      organizationId: organization.id,
    },
  ];

  for (const scraperData of scrapers) {
    const scraper = await prisma.scraper.create({
      data: scraperData,
    });

    console.log('✅ Created scraper:', scraper.name);
  }

  // Create webhook
  await prisma.webhook.create({
    data: {
      name: 'Slack Notifications',
      url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
      events: ['job.completed', 'job.failed'],
      secret: 'webhook-secret-123',
      organizationId: organization.id,
    },
  });

  console.log('✅ Created webhook');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
