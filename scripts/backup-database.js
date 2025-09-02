#!/usr/bin/env node

/**
 * Database Backup Script for DataVault Pro
 * Supports both SQLite and PostgreSQL databases
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const config = {
  backup: {
    directory: path.join(__dirname, '../backups'),
    retention: {
      daily: 7,    // Keep 7 daily backups
      weekly: 4,   // Keep 4 weekly backups
      monthly: 12, // Keep 12 monthly backups
    },
  },
  database: {
    type: process.env.DATABASE_URL?.startsWith('postgresql') ? 'postgresql' : 'sqlite',
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },
  encryption: {
    enabled: process.env.BACKUP_ENCRYPTION === 'true',
    key: process.env.BACKUP_ENCRYPTION_KEY,
  },
};

// Ensure backup directory exists
function ensureBackupDirectory() {
  if (!fs.existsSync(config.backup.directory)) {
    fs.mkdirSync(config.backup.directory, { recursive: true });
    console.log(`✅ Created backup directory: ${config.backup.directory}`);
  }
}

// Generate backup filename with timestamp
function generateBackupFilename(type = 'backup') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dbType = config.database.type;
  return `datavault-${type}-${dbType}-${timestamp}`;
}

// SQLite backup
async function backupSQLite() {
  try {
    console.log('🔄 Starting SQLite backup...');

    const dbPath = config.database.url.replace('file:', '');
    const backupFile = path.join(
      config.backup.directory,
      `${generateBackupFilename()}.db`
    );

    // Check if source database exists
    if (!fs.existsSync(dbPath)) {
      throw new Error(`Source database not found: ${dbPath}`);
    }

    // Copy database file
    fs.copyFileSync(dbPath, backupFile);

    // Verify backup
    const sourceStats = fs.statSync(dbPath);
    const backupStats = fs.statSync(backupFile);

    if (sourceStats.size !== backupStats.size) {
      throw new Error('Backup verification failed: file sizes do not match');
    }

    console.log(`✅ SQLite backup completed: ${backupFile}`);
    console.log(`📊 Backup size: ${(backupStats.size / 1024 / 1024).toFixed(2)} MB`);

    return {
      success: true,
      file: backupFile,
      size: backupStats.size,
      type: 'sqlite',
    };

  } catch (error) {
    console.error('❌ SQLite backup failed:', error.message);
    throw error;
  }
}

// PostgreSQL backup
async function backupPostgreSQL() {
  try {
    console.log('🔄 Starting PostgreSQL backup...');

    const backupFile = path.join(
      config.backup.directory,
      `${generateBackupFilename()}.sql`
    );

    // Extract connection details from DATABASE_URL
    const dbUrl = new URL(config.database.url);
    const pgDumpCommand = [
      'pg_dump',
      `--host=${dbUrl.hostname}`,
      `--port=${dbUrl.port || 5432}`,
      `--username=${dbUrl.username}`,
      `--dbname=${dbUrl.pathname.slice(1)}`,
      '--verbose',
      '--clean',
      '--no-owner',
      '--no-privileges',
      `--file=${backupFile}`,
    ].join(' ');

    // Set password environment variable
    const env = { ...process.env };
    if (dbUrl.password) {
      env.PGPASSWORD = dbUrl.password;
    }

    // Execute pg_dump
    const { stdout, stderr } = await execAsync(pgDumpCommand, { env });

    if (stderr && !stderr.includes('NOTICE')) {
      console.warn('⚠️ pg_dump warnings:', stderr);
    }

    // Verify backup file was created
    if (!fs.existsSync(backupFile)) {
      throw new Error('Backup file was not created');
    }

    const backupStats = fs.statSync(backupFile);

    console.log(`✅ PostgreSQL backup completed: ${backupFile}`);
    console.log(`📊 Backup size: ${(backupStats.size / 1024 / 1024).toFixed(2)} MB`);

    return {
      success: true,
      file: backupFile,
      size: backupStats.size,
      type: 'postgresql',
    };

  } catch (error) {
    console.error('❌ PostgreSQL backup failed:', error.message);
    throw error;
  }
}

// Encrypt backup file
async function encryptBackup(backupPath) {
  if (!config.encryption.enabled || !config.encryption.key) {
    return backupPath;
  }

  try {
    console.log('🔐 Encrypting backup...');

    const encryptedPath = `${backupPath}.enc`;
    const encryptCommand = `openssl enc -aes-256-cbc -salt -in "${backupPath}" -out "${encryptedPath}" -k "${config.encryption.key}"`;

    await execAsync(encryptCommand);

    // Remove unencrypted file
    fs.unlinkSync(backupPath);

    console.log(`✅ Backup encrypted: ${encryptedPath}`);
    return encryptedPath;

  } catch (error) {
    console.error('❌ Backup encryption failed:', error.message);
    throw error;
  }
}

// Clean old backups based on retention policy
function cleanOldBackups() {
  try {
    console.log('🧹 Cleaning old backups...');

    const files = fs.readdirSync(config.backup.directory)
      .filter(file => file.startsWith('datavault-backup-'))
      .map(file => ({
        name: file,
        path: path.join(config.backup.directory, file),
        mtime: fs.statSync(path.join(config.backup.directory, file)).mtime,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    const now = new Date();
    const cutoffs = {
      daily: new Date(now - config.backup.retention.daily * 24 * 60 * 60 * 1000),
      weekly: new Date(now - config.backup.retention.weekly * 7 * 24 * 60 * 60 * 1000),
      monthly: new Date(now - config.backup.retention.monthly * 30 * 24 * 60 * 60 * 1000),
    };

    let deleted = 0;

    files.forEach((file, index) => {
      let shouldDelete = false;

      // Keep all backups from the last 7 days
      if (file.mtime < cutoffs.daily) {
        // For older backups, apply weekly retention
        if (file.mtime < cutoffs.weekly) {
          // For very old backups, apply monthly retention
          if (file.mtime < cutoffs.monthly) {
            shouldDelete = true;
          } else {
            // Keep one backup per week
            const weeksSinceBackup = Math.floor((now - file.mtime) / (7 * 24 * 60 * 60 * 1000));
            const weeksToKeep = Math.floor((now - cutoffs.weekly) / (7 * 24 * 60 * 60 * 1000));
            if (weeksSinceBackup > weeksToKeep) {
              shouldDelete = true;
            }
          }
        }
      }

      if (shouldDelete) {
        fs.unlinkSync(file.path);
        deleted++;
        console.log(`🗑️ Deleted old backup: ${file.name}`);
      }
    });

    console.log(`✅ Cleanup completed. Deleted ${deleted} old backups.`);

  } catch (error) {
    console.error('❌ Backup cleanup failed:', error.message);
  }
}

// Main backup function
async function performBackup() {
  try {
    console.log('🚀 Starting database backup process...');
    console.log(`📋 Database type: ${config.database.type}`);
    console.log(`📁 Backup directory: ${config.backup.directory}`);

    ensureBackupDirectory();

    let backupResult;

    if (config.database.type === 'postgresql') {
      backupResult = await backupPostgreSQL();
    } else {
      backupResult = await backupSQLite();
    }

    // Encrypt backup if enabled
    if (config.encryption.enabled) {
      const encryptedPath = await encryptBackup(backupResult.file);
      backupResult.file = encryptedPath;
      backupResult.encrypted = true;
    }

    // Clean old backups
    cleanOldBackups();

    console.log('🎉 Backup process completed successfully!');

    return backupResult;

  } catch (error) {
    console.error('💥 Backup process failed:', error.message);
    process.exit(1);
  }
}

// CLI handling
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'backup':
      performBackup();
      break;

    case 'cleanup':
      cleanOldBackups();
      break;

    default:
      console.log(`
📦 DataVault Pro Database Backup Tool

Usage:
  node backup-database.js backup   - Perform database backup
  node backup-database.js cleanup  - Clean old backups

Environment Variables:
  DATABASE_URL              - Database connection string
  BACKUP_ENCRYPTION         - Enable backup encryption (true/false)
  BACKUP_ENCRYPTION_KEY     - Encryption key for backups

Examples:
  # Perform backup
  DATABASE_URL="file:./dev.db" node backup-database.js backup

  # Perform encrypted backup
  DATABASE_URL="postgresql://user:pass@host:5432/db" \\
  BACKUP_ENCRYPTION=true \\
  BACKUP_ENCRYPTION_KEY="your-secret-key" \\
  node backup-database.js backup
      `);
  }
}

module.exports = {
  performBackup,
  cleanOldBackups,
  config,
};
