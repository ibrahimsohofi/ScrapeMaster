// For a production application, we would use a real database like PostgreSQL
// For now, we'll implement a simple in-memory database for demonstration purposes

import { type User, type Job, JobStatus, type Plan, type Subscription, type Organization, PlanType, UserRole, OrganizationStatus } from './types';

// In-memory database collections
const users: User[] = [];
const jobs: Job[] = [];
const subscriptions: Subscription[] = [];
const organizations: Organization[] = [];

// Initialize with some sample data
const initializeDb = () => {
  // Sample plans
  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      maxRequests: 1000,
      maxConcurrentScrapers: 1,
      dataRetentionDays: 7,
      features: ['Standard proxies', 'JSON & CSV exports', 'Community support'],
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 19,
      maxRequests: 50000,
      maxConcurrentScrapers: 3,
      dataRetentionDays: 30,
      features: [
        'Rotating proxies',
        'All export formats',
        'Email support',
        'Basic scheduling',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 59,
      maxRequests: 250000,
      maxConcurrentScrapers: 10,
      dataRetentionDays: 90,
      features: [
        'Premium proxies',
        'All export formats',
        'API access',
        'Priority support',
        'Advanced scheduling',
        'Custom scripts',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: null, // Custom pricing
      maxRequests: null, // Unlimited
      maxConcurrentScrapers: null, // Unlimited
      dataRetentionDays: 365,
      features: [
        'Enterprise proxies',
        'CAPTCHA solving',
        'Dedicated infrastructure',
        'Dedicated support manager',
        'Custom data retention',
        'Custom integrations',
        'SLA guarantees',
      ],
    },
  ];

  // Create a demo organization
  const demoOrg = createOrganization({
    name: 'Demo Organization',
    slug: 'demo-organization',
  });

  // Create a demo user
  const demoUser = createUser({
    email: 'demo@example.com',
    name: 'Demo User',
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xIa.H2FS6', // password: 'password123'
    organizationId: demoOrg.id,
  });

  // Create a subscription for the demo user
  const demoSubscription: Subscription = {
    id: '1',
    userId: demoUser.id,
    planId: 'pro',
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    cancelAtPeriodEnd: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  subscriptions.push(demoSubscription);

  // Create some sample jobs for the demo user
  const demoJob1 = createJob({
    organizationId: demoOrg.id,
    createdById: demoUser.id,
    name: 'Product Price Monitoring',
    url: 'https://example.com/products',
    selectors: {
      productName: '.product-name',
      price: '.product-price',
      availability: '.product-availability',
    },
    schedule: 'daily',
    nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
  });

  const demoJob2 = createJob({
    organizationId: demoOrg.id,
    createdById: demoUser.id,
    name: 'Competitor Analysis',
    url: 'https://competitor.example.com',
    selectors: {
      productName: '.product-title',
      price: '.price',
      features: '.feature-list li',
    },
    schedule: 'weekly',
    nextRun: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
  });

  // Update the first job to show it completed recently
  updateJob(demoJob1.id, {
    status: JobStatus.COMPLETED,
    lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    resultsUrl: 'https://storage.example.com/jobs/1/results.json',
  });
};

// Initialize the database
initializeDb();

// User operations
export const findUserById = (id: string): User | undefined => {
  return users.find(user => user.id === id);
};

export const findUserByEmail = (email: string): User | undefined => {
  return users.find(user => user.email === email);
};

export const findUserByApiKey = (apiKey: string): User | undefined => {
  return users.find(user => user.apiKey === apiKey);
};

export const createUser = (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'emailVerified' | 'lastLoginAt' | 'isActive' | 'role'>): User => {
  const newUser: User = {
    id: String(users.length + 1),
    role: UserRole.ADMIN, // First user in org is admin
    emailVerified: false,
    lastLoginAt: null,
    isActive: true,
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  users.push(newUser);
  return newUser;
};

export const updateUser = (id: string, userData: Partial<User>): User | null => {
  const userIndex = users.findIndex(user => user.id === id);

  if (userIndex === -1) {
    return null;
  }

  const updatedUser = {
    ...users[userIndex],
    ...userData,
    updatedAt: new Date(),
  };

  users[userIndex] = updatedUser;
  return updatedUser;
};

// Organization operations
export const findOrganizationById = (id: string): Organization | undefined => {
  return organizations.find(org => org.id === id);
};

export const findOrganizationBySlug = (slug: string): Organization | undefined => {
  return organizations.find(org => org.slug === slug);
};

export const createOrganization = (orgData: Pick<Organization, 'name' | 'slug'>): Organization => {
  const newOrganization: Organization = {
    id: String(organizations.length + 1),
    plan: PlanType.FREE,
    status: OrganizationStatus.ACTIVE,
    monthlyRequestLimit: 1000,
    monthlyRequestsUsed: 0,
    maxConcurrentJobs: 1,
    dataRetentionDays: 7,
    cancelAtPeriodEnd: false,
    subscriptionId: null,
    currentPeriodEnd: null,
    ...orgData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  organizations.push(newOrganization);
  return newOrganization;
};

export const updateOrganization = (id: string, orgData: Partial<Organization>): Organization | null => {
  const orgIndex = organizations.findIndex(org => org.id === id);

  if (orgIndex === -1) {
    return null;
  }

  const updatedOrganization = {
    ...organizations[orgIndex],
    ...orgData,
    updatedAt: new Date(),
  };

  organizations[orgIndex] = updatedOrganization;
  return updatedOrganization;
};

// Job operations
export const findJobById = (id: string): Job | undefined => {
  return jobs.find(job => job.id === id);
};

export const findJobsByUserId = (userId: string): Job[] => {
  return jobs.filter(job => job.createdById === userId);
};

export const createJob = (jobData: Omit<Job, 'id' | 'status' | 'lastRun' | 'resultsUrl' | 'createdAt' | 'updatedAt'>): Job => {
  const newJob: Job = {
    id: String(jobs.length + 1),
    status: JobStatus.PENDING,
    lastRun: null,
    resultsUrl: null,
    ...jobData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  jobs.push(newJob);
  return newJob;
};

export const updateJob = (id: string, jobData: Partial<Job>): Job | null => {
  const jobIndex = jobs.findIndex(job => job.id === id);

  if (jobIndex === -1) {
    return null;
  }

  const updatedJob = {
    ...jobs[jobIndex],
    ...jobData,
    updatedAt: new Date(),
  };

  jobs[jobIndex] = updatedJob;
  return updatedJob;
};

// Subscription operations
export const findSubscriptionByUserId = (userId: string): Subscription | undefined => {
  return subscriptions.find(subscription => subscription.userId === userId);
};

export const createSubscription = (subscriptionData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Subscription => {
  const newSubscription: Subscription = {
    id: String(subscriptions.length + 1),
    ...subscriptionData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  subscriptions.push(newSubscription);
  return newSubscription;
};

export const updateSubscription = (id: string, subscriptionData: Partial<Subscription>): Subscription | null => {
  const subscriptionIndex = subscriptions.findIndex(subscription => subscription.id === id);

  if (subscriptionIndex === -1) {
    return null;
  }

  const updatedSubscription = {
    ...subscriptions[subscriptionIndex],
    ...subscriptionData,
    updatedAt: new Date(),
  };

  subscriptions[subscriptionIndex] = updatedSubscription;
  return updatedSubscription;
};

// Export the database collections for direct access if needed
export const getDb = () => ({
  users,
  jobs,
  subscriptions,
  organizations,
});
