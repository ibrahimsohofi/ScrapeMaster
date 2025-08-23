import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const successfulLogins = new Counter('successful_logins');
const scrapingJobsCreated = new Counter('scraping_jobs_created');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.05'],    // Error rate must be below 5%
    errors: ['rate<0.1'],              // Custom error rate must be below 10%
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TEST_USER = {
  email: 'admin@acme.com',
  password: 'password123'
};

// Login and get session token
function login() {
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
    email: TEST_USER.email,
    password: TEST_USER.password,
  }, {
    headers: { 'Content-Type': 'application/json' },
  });

  const success = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response has token': (r) => r.json('token') !== null,
  });

  if (success) {
    successfulLogins.add(1);
    return loginResponse.json('token');
  }

  errorRate.add(1);
  return null;
}

// Test scenarios
export default function () {
  const token = login();

  if (!token) {
    console.error('Failed to authenticate');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  group('API Health Checks', function () {
    const healthResponse = http.get(`${BASE_URL}/api/health`);
    check(healthResponse, {
      'health check status is 200': (r) => r.status === 200,
      'health check response time < 500ms': (r) => r.timings.duration < 500,
    });
    responseTime.add(healthResponse.timings.duration);
  });

  group('Dashboard API', function () {
    // Get dashboard stats
    const statsResponse = http.get(`${BASE_URL}/api/dashboard/stats`, { headers });
    check(statsResponse, {
      'dashboard stats status is 200': (r) => r.status === 200,
      'stats response has data': (r) => Object.keys(r.json()).length > 0,
    });

    // Get recent jobs
    const jobsResponse = http.get(`${BASE_URL}/api/dashboard/recent-jobs`, { headers });
    check(jobsResponse, {
      'recent jobs status is 200': (r) => r.status === 200,
      'jobs response is array': (r) => Array.isArray(r.json()),
    });
  });

  group('Scraper Management', function () {
    // List scrapers
    const listResponse = http.get(`${BASE_URL}/api/scrapers`, { headers });
    check(listResponse, {
      'list scrapers status is 200': (r) => r.status === 200,
      'scrapers list is array': (r) => Array.isArray(r.json()),
    });

    // Create new scraper
    const newScraper = {
      name: `Performance Test Scraper ${Date.now()}`,
      url: 'https://example.com',
      selectors: {
        title: 'h1',
        description: '.description'
      },
      schedule: '0 */6 * * *'
    };

    const createResponse = http.post(`${BASE_URL}/api/scrapers`, JSON.stringify(newScraper), { headers });
    const scraperCreated = check(createResponse, {
      'create scraper status is 201': (r) => r.status === 201,
      'create response has id': (r) => r.json('id') !== null,
    });

    if (scraperCreated) {
      scrapingJobsCreated.add(1);
      const scraperId = createResponse.json('id');

      // Test scraper
      const testResponse = http.post(`${BASE_URL}/api/scrapers/${scraperId}/run`, '{}', { headers });
      check(testResponse, {
        'test scraper status is 200': (r) => r.status === 200,
      });

      // Clean up - delete scraper
      const deleteResponse = http.del(`${BASE_URL}/api/scrapers/${scraperId}`, null, { headers });
      check(deleteResponse, {
        'delete scraper status is 200': (r) => r.status === 200,
      });
    }
  });

  group('Data Export API', function () {
    // Test data export functionality
    const exportRequest = {
      format: 'json',
      filters: {
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      }
    };

    const exportResponse = http.post(`${BASE_URL}/api/data/export`, JSON.stringify(exportRequest), { headers });
    check(exportResponse, {
      'export data status is 200': (r) => r.status === 200,
      'export response has download url': (r) => r.json('downloadUrl') !== null,
    });
  });

  group('AI Features', function () {
    // Test AI selector generation (if API key is available)
    const aiRequest = {
      url: 'https://example.com',
      description: 'Extract the main heading and article content'
    };

    const aiResponse = http.post(`${BASE_URL}/api/ai/generate-selectors`, JSON.stringify(aiRequest), { headers });

    // AI features might not be available in test environment
    check(aiResponse, {
      'AI selector generation responds': (r) => r.status === 200 || r.status === 503,
    });
  });

  group('User Management', function () {
    // Get user profile
    const profileResponse = http.get(`${BASE_URL}/api/users/me`, { headers });
    check(profileResponse, {
      'user profile status is 200': (r) => r.status === 200,
      'profile has user data': (r) => r.json('email') !== null,
    });
  });

  group('WebSocket Connection', function () {
    // Test WebSocket endpoint availability
    const wsResponse = http.get(`${BASE_URL}/api/ws`, { headers });
    check(wsResponse, {
      'websocket endpoint responds': (r) => r.status === 200 || r.status === 426, // 426 = Upgrade Required
    });
  });

  // Random sleep between 1-3 seconds to simulate user behavior
  sleep(Math.random() * 2 + 1);
}

// Test for specific scraping functionality under load
export function scrapingLoadTest() {
  const token = login();
  if (!token) return;

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Test scraper endpoint under load
  const testScraper = {
    url: 'https://httpbin.org/json',
    selectors: {
      origin: '.origin'
    }
  };

  const testResponse = http.post(`${BASE_URL}/api/scraper/test`, JSON.stringify(testScraper), { headers });
  check(testResponse, {
    'scraper test under load succeeds': (r) => r.status === 200,
    'scraper test response time acceptable': (r) => r.timings.duration < 5000,
  });
}

// Spike test configuration for stress testing
export const spikeTestOptions = {
  stages: [
    { duration: '30s', target: 100 }, // Spike to 100 users quickly
    { duration: '1m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Quick ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // More lenient during spike
    http_req_failed: ['rate<0.1'],     // Allow higher error rate during spike
  },
};

// Stress test configuration
export const stressTestOptions = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 150 },  // Ramp up to 150 users
    { duration: '5m', target: 150 },  // Stay at 150 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests under 3s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
  },
};

// Export different test configurations for CI/CD pipeline
export { spikeTestOptions, stressTestOptions };
