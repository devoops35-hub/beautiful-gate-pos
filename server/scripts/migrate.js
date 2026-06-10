#!/usr/bin/env node

/**
 * Database Migration Script
 * Handles schema updates and data migrations
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = path.resolve(__dirname, '../pos.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
});

// Promisify database operations
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

/**
 * Migration 1: Add role column to users table
 */
const migration_001_add_role_to_users = async () => {
  console.log('Running migration: Add role column to users...');
  try {
    // Check if column exists
    const result = await dbGet("PRAGMA table_info(users)");
    
    // Try to add column
    try {
      await dbRun('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "user"');
      console.log('✓ Added role column to users table');
    } catch (e) {
      if (e.message.includes('duplicate column')) {
        console.log('✓ Role column already exists');
      } else {
        throw e;
      }
    }

    // Set default role for existing users
    await dbRun('UPDATE users SET role = "user" WHERE role IS NULL');
    console.log('✓ Set default role for existing users');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  }
};

/**
 * Migration 2: Add isActive and lastLoginAt columns
 */
const migration_002_add_user_tracking_fields = async () => {
  console.log('Running migration: Add user tracking fields...');
  try {
    // Add isActive column
    try {
      await dbRun('ALTER TABLE users ADD COLUMN isActive BOOLEAN DEFAULT 1');
      console.log('✓ Added isActive column');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        throw e;
      }
      console.log('✓ isActive column already exists');
    }

    // Add lastLoginAt column
    try {
      await dbRun('ALTER TABLE users ADD COLUMN lastLoginAt DATETIME');
      console.log('✓ Added lastLoginAt column');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        throw e;
      }
      console.log('✓ lastLoginAt column already exists');
    }
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  }
};

/**
 * Migration 3: Create refresh_tokens table
 */
const migration_003_create_refresh_tokens_table = async () => {
  console.log('Running migration: Create refresh_tokens table...');
  try {
    await dbRun(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        _id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expiresAt DATETIME NOT NULL,
        revokedAt DATETIME,
        ipAddress TEXT,
        userAgent TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(_id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Created refresh_tokens table');

    // Create indices
    try {
      await dbRun(`
        CREATE INDEX IF NOT EXISTS idx_refresh_user_active 
        ON refresh_tokens(userId, revokedAt)
      `);
      console.log('✓ Created index on refresh_tokens');
    } catch (e) {
      if (!e.message.includes('already exists')) {
        throw e;
      }
    }
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  }
};

/**
 * Migration 4: Create audit_logs table
 */
const migration_004_create_audit_logs_table = async () => {
  console.log('Running migration: Create audit_logs table...');
  try {
    await dbRun(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        _id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        resourceId INTEGER,
        oldValue TEXT,
        newValue TEXT,
        details TEXT,
        ipAddress TEXT,
        userAgent TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(_id) ON DELETE SET NULL
      )
    `);
    console.log('✓ Created audit_logs table');

    // Create indices
    try {
      await dbRun(`
        CREATE INDEX IF NOT EXISTS idx_audit_user_date 
        ON audit_logs(userId, createdAt DESC)
      `);
      console.log('✓ Created index idx_audit_user_date');
    } catch (e) {
      if (!e.message.includes('already exists')) {
        throw e;
      }
    }

    try {
      await dbRun(`
        CREATE INDEX IF NOT EXISTS idx_audit_resource 
        ON audit_logs(resource, resourceId)
      `);
      console.log('✓ Created index idx_audit_resource');
    } catch (e) {
      if (!e.message.includes('already exists')) {
        throw e;
      }
    }
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  }
};

/**
 * Migration 5: Create migrations table to track completed migrations
 */
const migration_005_create_migrations_table = async () => {
  console.log('Running migration: Create migrations table...');
  try {
    await dbRun(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        executedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created migrations table');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  }
};

/**
 * Run all migrations
 */
const runMigrations = async () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║        Running Database Migrations      ║');
  console.log('╚════════════════════════════════════════╝\n');

  const migrations = [
    { name: '001_add_role_to_users', fn: migration_001_add_role_to_users },
    { name: '002_add_user_tracking_fields', fn: migration_002_add_user_tracking_fields },
    { name: '003_create_refresh_tokens_table', fn: migration_003_create_refresh_tokens_table },
    { name: '004_create_audit_logs_table', fn: migration_004_create_audit_logs_table },
    { name: '005_create_migrations_table', fn: migration_005_create_migrations_table },
  ];

  try {
    for (const migration of migrations) {
      try {
        await migration.fn();
        
        // Record migration
        try {
          await dbRun(
            'INSERT INTO migrations (name) VALUES (?)',
            [migration.name]
          );
        } catch (e) {
          // Migration already recorded, skip
        }
      } catch (error) {
        console.error(`\n✗ Migration ${migration.name} failed:`, error.message);
        throw error;
      }
    }

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║     All migrations completed! ✓        ║');
    console.log('╚════════════════════════════════════════╝\n');

    db.close();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration process failed');
    db.close();
    process.exit(1);
  }
};

// Run migrations
runMigrations();
