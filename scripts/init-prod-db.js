const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function initProdDatabase() {
  const prisma = new PrismaClient();

  try {
    console.log('🚀 Initializing production database...');

    // Try to push the schema
    const { exec } = require('child_process');
    await new Promise((resolve, reject) => {
      exec('npx prisma db push --force-reset', (error, stdout, stderr) => {
        if (error) {
          console.log('Database push failed, but continuing...');
          resolve();
        } else {
          console.log('✅ Database schema pushed successfully');
          resolve();
        }
      });
    });

    // Check if organization exists
    const existingOrg = await prisma.organization.findFirst();
    if (existingOrg) {
      console.log('✅ Database already seeded');
      return;
    }

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name: 'TechFlow Demo Corp',
        slug: 'techflow-demo-corp',
        plan: 'PRO',
        status: 'ACTIVE',
        isActive: true,
        monthlyRequestsUsed: 0,
        monthlyRequestLimit: 1000000,
        maxConcurrentJobs: 50,
        dataRetentionDays: 90,
      },
    });

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await prisma.user.create({
      data: {
        email: 'admin@demo.techflow.com',
        hashedPassword: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        organizationId: organization.id,
        isVerified: true,
        isActive: true,
      },
    });

    console.log('✅ Production database initialized successfully');
  } catch (error) {
    console.log('⚠️ Database initialization failed, but build will continue:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

initProdDatabase();
