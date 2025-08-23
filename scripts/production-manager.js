#!/usr/bin/env node

/**
 * DataVault Pro - Production Infrastructure Manager CLI
 *
 * This script provides command-line interface for managing production infrastructure
 * including monitoring, SSL certificates, backups, and disaster recovery.
 *
 * Usage:
 *   node scripts/production-manager.js <command> [options]
 *
 * Commands:
 *   status           - Get overall system status
 *   health           - Perform health check
 *   ssl              - Manage SSL certificates
 *   backup           - Manage backups and restore
 *   monitoring       - Configure monitoring and alerts
 *   deploy           - Manage deployments
 *   maintenance      - Enter/exit maintenance mode
 */

const axios = require('axios');

// Simple CLI argument parser
function parseArgs(args) {
  const result = { command: '', options: {}, flags: [] };
  let i = 2; // Skip node and script name

  if (args[i] && !args[i].startsWith('-')) {
    result.command = args[i];
    i++;
  }

  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        result.options[key] = args[i + 1];
        i += 2;
      } else {
        result.flags.push(key);
        i++;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        result.options[key] = args[i + 1];
        i += 2;
      } else {
        result.flags.push(key);
        i++;
      }
    } else {
      i++;
    }
  }

  return result;
}

// Console colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

function log(message, color = 'white') {
  console.log(colors[color] + message + colors.reset);
}

function success(message) {
  log('✓ ' + message, 'green');
}

function error(message) {
  log('✗ ' + message, 'red');
}

function warning(message) {
  log('⚠ ' + message, 'yellow');
}

function info(message) {
  log('ℹ ' + message, 'blue');
}

// Configuration
const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';
const ENDPOINTS = {
  infrastructure: `${API_BASE}/infrastructure/production`,
  ssl: `${API_BASE}/infrastructure/ssl`,
  backup: `${API_BASE}/infrastructure/backup`,
  monitoring: `${API_BASE}/infrastructure/monitoring`
};

async function apiRequest(url, options = {}) {
  try {
    const response = await axios({
      url,
      timeout: 30000,
      ...options
    });
    return response.data;
  } catch (err) {
    if (err.response) {
      throw new Error(`API Error: ${err.response.data.message || err.response.statusText}`);
    } else if (err.request) {
      throw new Error('Network Error: Unable to connect to the API');
    } else {
      throw new Error(`Request Error: ${err.message}`);
    }
  }
}

// Command implementations
async function showStatus(options) {
  info('Checking system status...');

  try {
    const status = await apiRequest(ENDPOINTS.infrastructure);

    if (options.json || options.j) {
      console.log(JSON.stringify(status, null, 2));
    } else {
      log('\n📊 System Status Report\n', 'cyan');
      log(`Status: ${status.status === 'operational' ? '✓ Operational' : '✗ Issues Detected'}`,
          status.status === 'operational' ? 'green' : 'red');
      log(`Environment: ${status.environment}`, 'cyan');
      log(`Domain: ${status.domain}`, 'cyan');
      log(`Initialized: ${status.initialized ? 'Yes' : 'No'}`, status.initialized ? 'green' : 'red');
      log(`Timestamp: ${status.timestamp}`, 'gray');
    }

  } catch (err) {
    error('Failed to get system status: ' + err.message);
    process.exit(1);
  }
}

async function performHealthCheck(options) {
  info('Performing health check...');

  try {
    const health = await apiRequest(`${ENDPOINTS.infrastructure}?endpoint=health`);
    const healthCheck = await apiRequest(ENDPOINTS.infrastructure, {
      method: 'POST',
      data: { action: 'health-check' }
    });

    log('\n🏥 Health Check Report\n', 'cyan');
    log(`Overall Health: ${healthCheck.healthy ? '✓ Healthy' : '✗ Unhealthy'}`,
        healthCheck.healthy ? 'green' : 'red');
    log(`Environment: ${health.environment}`, 'cyan');
    log(`Timestamp: ${health.timestamp}`, 'gray');

    if (options.detailed || options.d) {
      if (health.components) {
        log('\n📋 Component Status:', 'cyan');
        Object.entries(health.components).forEach(([component, status]) => {
          log(`  ${component}: ${status ? '✓ OK' : '✗ Issues'}`, status ? 'green' : 'red');
        });
      }
    }

  } catch (err) {
    error('Health check failed: ' + err.message);
    process.exit(1);
  }
}

async function manageSSL(options) {
  try {
    if (options.list || options.l) {
      info('Retrieving SSL certificates...');
      const data = await apiRequest(ENDPOINTS.ssl);

      log('\n🔒 SSL Certificates\n', 'cyan');
      if (data.certificates && data.certificates.length > 0) {
        data.certificates.forEach(cert => {
          const statusColor = cert.status === 'valid' ? 'green' :
                            cert.status === 'expiring' ? 'yellow' : 'red';
          log(`${cert.domain}: ${cert.status} (expires: ${new Date(cert.validTo).toLocaleDateString()})`, statusColor);
        });
      } else {
        info('No SSL certificates found');
      }

      if (data.systemStatus) {
        log('\n📊 SSL System Status:', 'cyan');
        log(`Total Certificates: ${data.systemStatus.totalCertificates}`);
        log(`Valid: ${data.systemStatus.validCertificates}`, 'green');
        log(`Expiring: ${data.systemStatus.expiringCertificates}`, 'yellow');
        log(`Expired: ${data.systemStatus.expiredCertificates}`, 'red');
      }

    } else if (options.status || options.s) {
      const domain = options.status || options.s;
      info(`Checking certificate status for ${domain}...`);
      const cert = await apiRequest(`${ENDPOINTS.ssl}?domain=${domain}`);

      log(`\n🔒 Certificate Status: ${domain}\n`, 'cyan');
      log(`Status: ${cert.status === 'valid' ? '✓ Valid' : '✗ ' + cert.status}`,
          cert.status === 'valid' ? 'green' : 'red');
      log(`Issuer: ${cert.issuer}`);
      log(`Valid From: ${new Date(cert.validFrom).toLocaleDateString()}`);
      log(`Valid To: ${new Date(cert.validTo).toLocaleDateString()}`);
      log(`Auto Renewal: ${cert.autoRenewal ? 'Enabled' : 'Disabled'}`,
          cert.autoRenewal ? 'green' : 'red');

    } else if (options.renew || options.r) {
      const domain = options.renew || options.r;
      info(`Renewing certificate for ${domain}...`);
      await apiRequest(ENDPOINTS.ssl, {
        method: 'POST',
        data: {
          action: 'renew-certificate',
          domain: domain
        }
      });
      success(`Certificate renewed for ${domain}`);

    } else {
      error('Please specify an action. Available options: --list, --status <domain>, --renew <domain>');
    }

  } catch (err) {
    error('SSL operation failed: ' + err.message);
    process.exit(1);
  }
}

async function manageBackup(options) {
  try {
    if (options.list || options.l) {
      info('Retrieving backup jobs...');
      const data = await apiRequest(`${ENDPOINTS.backup}?endpoint=jobs`);

      log('\n💾 Backup Jobs\n', 'cyan');
      log(`Total: ${data.total}, Active: ${data.active}, Completed: ${data.completed}, Failed: ${data.failed}\n`, 'blue');

      if (data.jobs && data.jobs.length > 0) {
        data.jobs.slice(-10).forEach(job => { // Show last 10 jobs
          const statusColor = job.status === 'completed' ? 'green' :
                            job.status === 'running' ? 'blue' :
                            job.status === 'failed' ? 'red' : 'yellow';
          const size = job.size ? `(${(job.size / 1024 / 1024).toFixed(2)}MB)` : '';
          log(`${job.id}: ${job.status} ${job.strategy.type} ${size}`, statusColor);
        });
      } else {
        info('No backup jobs found');
      }

    } else if (options.health || options.h) {
      info('Checking backup system health...');
      const health = await apiRequest(`${ENDPOINTS.backup}?endpoint=health`);

      log('\n💾 Backup System Health\n', 'cyan');
      console.log(JSON.stringify(health, null, 2));

    } else if (options.create || options.c) {
      const strategy = options.create === true ? 'manual' : options.create;
      info(`Creating ${strategy} backup...`);

      const result = await apiRequest(ENDPOINTS.backup, {
        method: 'POST',
        data: {
          action: 'create-backup',
          strategy
        }
      });

      success(`Backup created successfully (Job ID: ${result.jobId})`);

    } else if (options.restore) {
      // Ask for confirmation
      process.stdout.write(`Are you sure you want to restore from backup ${options.restore}? This will overwrite current data. (y/N): `);

      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => rl.question('', resolve));
      rl.close();

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        warning('Restore operation cancelled');
        return;
      }

      info(`Restoring from backup ${options.restore}...`);

      await apiRequest(ENDPOINTS.backup, {
        method: 'POST',
        data: {
          action: 'restore-backup',
          backupId: options.restore
        }
      });

      success(`Restore initiated from backup ${options.restore}`);

    } else {
      error('Please specify an action. Available options: --list, --create [strategy], --restore <backupId>, --health');
    }

  } catch (err) {
    error('Backup operation failed: ' + err.message);
    process.exit(1);
  }
}

async function manageDeploy(options) {
  try {
    if (options.update || options.u) {
      // Ask for confirmation
      process.stdout.write('Are you sure you want to deploy to production? (y/N): ');

      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => rl.question('', resolve));
      rl.close();

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        warning('Deployment cancelled');
        return;
      }

      info('Deploying production update...');

      await apiRequest(ENDPOINTS.infrastructure, {
        method: 'POST',
        data: { action: 'deploy-update' }
      });

      success('Production deployment initiated successfully');
      info('Monitor the deployment progress in your monitoring dashboard');

    } else {
      error('Please specify --update to deploy.');
    }

  } catch (err) {
    error('Deployment failed: ' + err.message);
    process.exit(1);
  }
}

async function manageMaintenance(options) {
  try {
    if (options.enable || options.e) {
      // Ask for confirmation
      process.stdout.write('Are you sure you want to enable emergency maintenance mode? (y/N): ');

      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => rl.question('', resolve));
      rl.close();

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        warning('Maintenance mode activation cancelled');
        return;
      }

      info('Activating emergency maintenance mode...');

      await apiRequest(ENDPOINTS.infrastructure, {
        method: 'POST',
        data: { action: 'emergency-maintenance' }
      });

      success('Emergency maintenance mode activated');
      warning('System is now in maintenance mode. Users will see maintenance page.');

    } else {
      error('Please specify --enable to activate maintenance mode.');
    }

  } catch (err) {
    error('Maintenance operation failed: ' + err.message);
    process.exit(1);
  }
}

async function manageMonitoring(options) {
  try {
    if (options['test-alert'] || options.t) {
      info('Sending test alert...');

      await apiRequest(ENDPOINTS.infrastructure, {
        method: 'POST',
        data: { action: 'send-test-alert' }
      });

      success('Test alert sent successfully');
      info('Check your configured notification channels for the test alert');

    } else if (options.metrics || options.m) {
      info('Retrieving system metrics...');
      const metrics = await apiRequest(`${ENDPOINTS.infrastructure}?endpoint=metrics`);

      log('\n📈 System Metrics\n', 'cyan');
      log(`Uptime: ${Math.floor(metrics.uptime / 3600)}h ${Math.floor((metrics.uptime % 3600) / 60)}m`);
      log(`Memory: ${(metrics.memory.rss / 1024 / 1024).toFixed(2)}MB RSS, ${(metrics.memory.heapUsed / 1024 / 1024).toFixed(2)}MB Heap`);
      log(`Timestamp: ${metrics.timestamp}`, 'gray');

    } else {
      error('Please specify an action. Available options: --test-alert, --metrics');
    }

  } catch (err) {
    error('Monitoring operation failed: ' + err.message);
    process.exit(1);
  }
}

function showHelp() {
  log('\n🚀 DataVault Pro - Production Infrastructure Manager CLI\n', 'cyan');
  log('Usage: node scripts/production-manager.js <command> [options]');
  log('\nCommands:');
  log('  status              Get overall system status');
  log('  health              Perform health check');
  log('  ssl                 Manage SSL certificates');
  log('  backup              Manage backups and disaster recovery');
  log('  monitoring          Configure monitoring and alerts');
  log('  deploy              Manage deployments');
  log('  maintenance         Enter/exit maintenance mode');
  log('\nOptions:');
  log('  --help, -h          Show this help message');
  log('  --json, -j          Output as JSON (status command)');
  log('  --detailed, -d      Show detailed information (health command)');
  log('\nExamples:');
  log('  node scripts/production-manager.js status --json');
  log('  node scripts/production-manager.js ssl --list');
  log('  node scripts/production-manager.js backup --create manual');
  log('  node scripts/production-manager.js deploy --update');
  log('');
}

// Main execution
async function main() {
  const args = parseArgs(process.argv);

  if (args.flags.includes('help') || args.flags.includes('h') || !args.command) {
    showHelp();
    return;
  }

  switch (args.command) {
    case 'status':
      await showStatus(args.options);
      break;
    case 'health':
      await performHealthCheck(args.options);
      break;
    case 'ssl':
      await manageSSL(args.options);
      break;
    case 'backup':
      await manageBackup(args.options);
      break;
    case 'deploy':
      await manageDeploy(args.options);
      break;
    case 'maintenance':
      await manageMaintenance(args.options);
      break;
    case 'monitoring':
      await manageMonitoring(args.options);
      break;
    default:
      error(`Unknown command: ${args.command}`);
      showHelp();
      process.exit(1);
  }
}

// Run the CLI
main().catch(err => {
  error(err.message);
  process.exit(1);
});
