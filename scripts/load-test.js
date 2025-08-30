#!/usr/bin/env node

/**
 * Enterprise-Scale Load Testing for DataVault Pro
 * Tests the platform under various high-traffic scenarios
 */

const http = require('http');
const https = require('https');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
    baseUrl: process.env.TARGET_URL || 'https://localhost:3000',
    maxConcurrentUsers: parseInt(process.env.MAX_USERS) || 1000,
    testDuration: parseInt(process.env.TEST_DURATION) || 300, // 5 minutes
    rampUpTime: parseInt(process.env.RAMP_UP_TIME) || 60, // 1 minute
    workers: parseInt(process.env.WORKERS) || require('os').cpus().length,
    scenarios: {
        login: { weight: 20, endpoint: '/api/auth/login' },
        dashboard: { weight: 30, endpoint: '/dashboard' },
        createScraper: { weight: 15, endpoint: '/api/scrapers' },
        runScraper: { weight: 20, endpoint: '/api/scrapers/{id}/run' },
        exportData: { weight: 10, endpoint: '/api/data/export' },
        apiHealth: { weight: 5, endpoint: '/api/health' }
    }
};

// Test results tracking
const results = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
    responseTimes: [],
    errorCodes: {},
    throughput: 0,
    concurrentUsers: 0,
    startTime: null,
    endTime: null
};

class LoadTester {
    constructor() {
        this.workers = [];
        this.activeUsers = 0;
        this.testRunning = false;
        this.results = { ...results };
        this.logFile = path.join(__dirname, '../logs', `load-test-${Date.now()}.log`);

        // Ensure logs directory exists
        const logsDir = path.dirname(this.logFile);
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        console.log(logMessage.trim());
        fs.appendFileSync(this.logFile, logMessage);
    }

    async startTest() {
        this.log('🚀 Starting enterprise-scale load test for DataVault Pro');
        this.log(`Configuration: ${JSON.stringify(config, null, 2)}`);

        this.results.startTime = Date.now();
        this.testRunning = true;

        // Start workers
        for (let i = 0; i < config.workers; i++) {
            await this.startWorker(i);
        }

        // Ramp up users gradually
        await this.rampUpUsers();

        // Run test for specified duration
        await this.runTestDuration();

        // Collect results and generate report
        await this.collectResults();
        this.generateReport();
    }

    async startWorker(workerId) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(__filename, {
                workerData: { workerId, config }
            });

            worker.on('message', (message) => {
                this.handleWorkerMessage(message);
            });

            worker.on('error', (error) => {
                this.log(`❌ Worker ${workerId} error: ${error.message}`);
                reject(error);
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    this.log(`⚠️ Worker ${workerId} exited with code ${code}`);
                }
            });

            this.workers.push(worker);
            this.log(`✅ Worker ${workerId} started`);
            resolve();
        });
    }

    async rampUpUsers() {
        this.log(`📈 Ramping up to ${config.maxConcurrentUsers} users over ${config.rampUpTime} seconds`);

        const usersPerSecond = config.maxConcurrentUsers / config.rampUpTime;
        const rampUpInterval = 1000; // 1 second

        for (let second = 0; second < config.rampUpTime; second++) {
            const usersToAdd = Math.floor(usersPerSecond);

            for (let i = 0; i < usersToAdd; i++) {
                this.addUser();
            }

            await this.sleep(rampUpInterval);
            this.log(`👥 Active users: ${this.activeUsers}`);
        }

        // Add any remaining users
        while (this.activeUsers < config.maxConcurrentUsers) {
            this.addUser();
        }

        this.log(`🎯 Reached target of ${config.maxConcurrentUsers} concurrent users`);
    }

    addUser() {
        if (this.activeUsers < config.maxConcurrentUsers) {
            const workerId = this.activeUsers % this.workers.length;
            this.workers[workerId].postMessage({
                type: 'addUser',
                userId: this.activeUsers
            });
            this.activeUsers++;
        }
    }

    async runTestDuration() {
        this.log(`⏱️ Running test for ${config.testDuration} seconds`);
        await this.sleep(config.testDuration * 1000);
        this.testRunning = false;

        // Signal all workers to stop
        this.workers.forEach(worker => {
            worker.postMessage({ type: 'stop' });
        });
    }

    handleWorkerMessage(message) {
        switch (message.type) {
            case 'result':
                this.updateResults(message.data);
                break;
            case 'error':
                this.log(`❌ Worker error: ${message.error}`);
                break;
            case 'status':
                // Periodic status updates from workers
                break;
        }
    }

    updateResults(data) {
        this.results.totalRequests++;

        if (data.success) {
            this.results.successfulRequests++;
        } else {
            this.results.failedRequests++;
            this.results.errorCodes[data.statusCode] =
                (this.results.errorCodes[data.statusCode] || 0) + 1;
        }

        // Update response time statistics
        this.results.responseTimes.push(data.responseTime);
        this.results.minResponseTime = Math.min(this.results.minResponseTime, data.responseTime);
        this.results.maxResponseTime = Math.max(this.results.maxResponseTime, data.responseTime);
    }

    async collectResults() {
        this.log('📊 Collecting results from workers...');
        this.results.endTime = Date.now();

        // Wait for workers to finish
        await Promise.all(this.workers.map(worker => {
            return new Promise(resolve => {
                worker.on('exit', resolve);
                worker.terminate();
            });
        }));

        // Calculate statistics
        this.calculateStatistics();
    }

    calculateStatistics() {
        const testDurationMs = this.results.endTime - this.results.startTime;
        const testDurationSec = testDurationMs / 1000;

        // Calculate average response time
        if (this.results.responseTimes.length > 0) {
            this.results.averageResponseTime =
                this.results.responseTimes.reduce((sum, time) => sum + time, 0) /
                this.results.responseTimes.length;
        }

        // Calculate throughput (requests per second)
        this.results.throughput = this.results.totalRequests / testDurationSec;

        // Calculate percentiles
        const sortedTimes = this.results.responseTimes.sort((a, b) => a - b);
        this.results.p50 = this.getPercentile(sortedTimes, 50);
        this.results.p90 = this.getPercentile(sortedTimes, 90);
        this.results.p95 = this.getPercentile(sortedTimes, 95);
        this.results.p99 = this.getPercentile(sortedTimes, 99);

        // Calculate success rate
        this.results.successRate = (this.results.successfulRequests / this.results.totalRequests) * 100;
    }

    getPercentile(sortedArray, percentile) {
        const index = Math.floor((percentile / 100) * sortedArray.length);
        return sortedArray[index] || 0;
    }

    generateReport() {
        const testDurationSec = (this.results.endTime - this.results.startTime) / 1000;

        const report = `
🎯 DataVault Pro Enterprise Load Test Report
============================================

📋 Test Configuration:
- Target URL: ${config.baseUrl}
- Max Concurrent Users: ${config.maxConcurrentUsers}
- Test Duration: ${config.testDuration} seconds
- Ramp-up Time: ${config.rampUpTime} seconds
- Workers: ${config.workers}

📊 Results Summary:
- Total Requests: ${this.results.totalRequests.toLocaleString()}
- Successful Requests: ${this.results.successfulRequests.toLocaleString()}
- Failed Requests: ${this.results.failedRequests.toLocaleString()}
- Success Rate: ${this.results.successRate.toFixed(2)}%
- Throughput: ${this.results.throughput.toFixed(2)} req/sec
- Test Duration: ${testDurationSec.toFixed(2)} seconds

⏱️ Response Times:
- Average: ${this.results.averageResponseTime.toFixed(2)}ms
- Minimum: ${this.results.minResponseTime}ms
- Maximum: ${this.results.maxResponseTime}ms
- 50th Percentile: ${this.results.p50}ms
- 90th Percentile: ${this.results.p90}ms
- 95th Percentile: ${this.results.p95}ms
- 99th Percentile: ${this.results.p99}ms

❌ Error Breakdown:
${Object.entries(this.results.errorCodes)
    .map(([code, count]) => `- HTTP ${code}: ${count} requests`)
    .join('\n') || '- No errors'}

🏆 Performance Assessment:
${this.assessPerformance()}

📈 Recommendations:
${this.generateRecommendations()}
        `;

        this.log(report);

        // Save detailed report to file
        const reportFile = path.join(path.dirname(this.logFile), `load-test-report-${Date.now()}.txt`);
        fs.writeFileSync(reportFile, report);
        this.log(`📄 Detailed report saved to: ${reportFile}`);
    }

    assessPerformance() {
        let assessment = [];

        if (this.results.successRate >= 99.9) {
            assessment.push('✅ Excellent reliability (>99.9% success rate)');
        } else if (this.results.successRate >= 99) {
            assessment.push('✅ Good reliability (>99% success rate)');
        } else {
            assessment.push('⚠️ Poor reliability (<99% success rate)');
        }

        if (this.results.averageResponseTime <= 200) {
            assessment.push('✅ Excellent response time (<200ms average)');
        } else if (this.results.averageResponseTime <= 500) {
            assessment.push('✅ Good response time (<500ms average)');
        } else {
            assessment.push('⚠️ Slow response time (>500ms average)');
        }

        if (this.results.throughput >= 1000) {
            assessment.push('✅ High throughput (>1000 req/sec)');
        } else if (this.results.throughput >= 500) {
            assessment.push('✅ Moderate throughput (>500 req/sec)');
        } else {
            assessment.push('⚠️ Low throughput (<500 req/sec)');
        }

        return assessment.join('\n');
    }

    generateRecommendations() {
        let recommendations = [];

        if (this.results.successRate < 99) {
            recommendations.push('- Investigate and fix causes of request failures');
            recommendations.push('- Consider implementing circuit breakers');
        }

        if (this.results.averageResponseTime > 500) {
            recommendations.push('- Optimize application performance');
            recommendations.push('- Consider adding more application instances');
            recommendations.push('- Review database query performance');
        }

        if (this.results.throughput < 500) {
            recommendations.push('- Scale horizontally by adding more servers');
            recommendations.push('- Optimize load balancer configuration');
        }

        if (this.results.p99 > 2000) {
            recommendations.push('- Investigate performance bottlenecks for slow requests');
            recommendations.push('- Consider implementing request timeouts');
        }

        return recommendations.length > 0 ? recommendations.join('\n') : '- System performance is within acceptable ranges';
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Worker thread code
if (!isMainThread) {
    const { workerId, config } = workerData;
    const users = new Map();
    let running = true;

    parentPort.on('message', async (message) => {
        switch (message.type) {
            case 'addUser':
                await addUser(message.userId);
                break;
            case 'stop':
                running = false;
                break;
        }
    });

    async function addUser(userId) {
        users.set(userId, { id: userId, active: true });
        simulateUser(userId);
    }

    async function simulateUser(userId) {
        while (running && users.get(userId)?.active) {
            const scenario = selectScenario();
            await executeScenario(scenario, userId);

            // Random delay between requests (1-5 seconds)
            const delay = Math.random() * 4000 + 1000;
            await sleep(delay);
        }
    }

    function selectScenario() {
        const scenarios = Object.entries(config.scenarios);
        const totalWeight = scenarios.reduce((sum, [, scenario]) => sum + scenario.weight, 0);
        const random = Math.random() * totalWeight;

        let currentWeight = 0;
        for (const [name, scenario] of scenarios) {
            currentWeight += scenario.weight;
            if (random <= currentWeight) {
                return { name, ...scenario };
            }
        }

        return scenarios[0][1]; // Fallback
    }

    async function executeScenario(scenario, userId) {
        const startTime = Date.now();

        try {
            const result = await makeRequest(scenario.endpoint, userId);
            const responseTime = Date.now() - startTime;

            parentPort.postMessage({
                type: 'result',
                data: {
                    success: result.success,
                    responseTime,
                    statusCode: result.statusCode,
                    scenario: scenario.name,
                    userId
                }
            });
        } catch (error) {
            const responseTime = Date.now() - startTime;

            parentPort.postMessage({
                type: 'result',
                data: {
                    success: false,
                    responseTime,
                    statusCode: 0,
                    scenario: scenario.name,
                    userId,
                    error: error.message
                }
            });
        }
    }

    async function makeRequest(endpoint, userId) {
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint, config.baseUrl);
            const isHttps = url.protocol === 'https:';
            const httpModule = isHttps ? https : http;

            const options = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname + url.search,
                method: 'GET',
                headers: {
                    'User-Agent': `LoadTest-Worker-${workerId}-User-${userId}`,
                    'Accept': 'application/json',
                    'Connection': 'keep-alive'
                },
                timeout: 30000,
                rejectUnauthorized: false // For testing with self-signed certificates
            };

            const req = httpModule.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        success: res.statusCode >= 200 && res.statusCode < 400,
                        statusCode: res.statusCode,
                        data
                    });
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Main execution
if (isMainThread) {
    const tester = new LoadTester();

    process.on('SIGINT', () => {
        console.log('\n🛑 Stopping load test...');
        process.exit(0);
    });

    tester.startTest().catch(error => {
        console.error('❌ Load test failed:', error);
        process.exit(1);
    });
}
