#!/usr/bin/env node

/**
 * Database Migration Script for Tree Support
 * This script adds the parentId column to the message table for Git-like branching
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

async function migrateTreeSupport() {
  console.log('🌳 Starting Tree Support Migration...');
  
  let sql;
  try {
    // Connect to database
    sql = postgres(DATABASE_URL);
    const db = drizzle(sql);
    
    console.log('✅ Connected to database');
    
    // Read migration SQL
    const migrationPath = join(process.cwd(), 'migrations', 'add-tree-support.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📖 Migration SQL loaded');
    
    // Execute migration
    console.log('🚀 Executing migration...');
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the column was added
    const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'message' 
      AND column_name = 'parentId'
    `;
    
    if (result.length > 0) {
      console.log('✅ parentId column verified in message table');
    } else {
      console.error('❌ parentId column not found after migration');
      process.exit(1);
    }
    
    // Check existing messages
    const messageCount = await sql`SELECT COUNT(*) as count FROM message`;
    console.log(`📊 Total messages in database: ${messageCount[0].count}`);
    
    // Update existing messages to have no parent (root messages)
    const updateResult = await sql`
      UPDATE message 
      SET "parentId" = NULL 
      WHERE "parentId" IS NULL
    `;
    console.log(`🔄 Updated ${updateResult.count} messages to be root messages`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migration
migrateTreeSupport()
  .then(() => {
    console.log('🎉 Tree support migration completed successfully!');
    console.log('🌿 Your chat app now supports Git-like branching conversations!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
