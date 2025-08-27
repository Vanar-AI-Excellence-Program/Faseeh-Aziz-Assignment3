#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
}

async function runMigration() {
    console.log('Starting database migration to new normalized schema...');
    
    const sql = postgres(DATABASE_URL);
    const db = drizzle(sql);

    try {
        console.log('Executing migration SQL...');
        
        // Define the migration steps manually to ensure proper order
        const migrationSteps = [
            // Step 1: Drop the old messageBranches table if it exists
            `DROP TABLE IF EXISTS message_branches`,
            
            // Step 2: Create the new messageBranches table with composite primary key
            `CREATE TABLE message_branches (
              message_id TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
              branch_id TEXT NOT NULL REFERENCES chat_branches(id) ON DELETE CASCADE,
              user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
              created_at TIMESTAMP DEFAULT NOW() NOT NULL,
              updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
              PRIMARY KEY(message_id, branch_id)
            )`,
            
            // Step 3: Ensure we have a 'main' branch for each conversation
            `INSERT INTO chat_branches (id, user_id, conversation_id, branch_name, created_at, is_active)
            SELECT 
              'main_' || conversation_id,
              user_id,
              conversation_id,
              'Main',
              NOW(),
              true
            FROM (
              SELECT DISTINCT user_id, conversation_id 
              FROM chat_messages
            ) AS distinct_conversations
            ON CONFLICT (id) DO NOTHING`,
            
            // Step 4: Insert message-branch relationships for existing messages
            `INSERT INTO message_branches (message_id, branch_id, user_id, created_at, updated_at)
            SELECT 
              cm.id,
              'main_' || cm.conversation_id,
              cm.user_id,
              cm.created_at,
              NOW()
            FROM chat_messages cm
            ON CONFLICT (message_id, branch_id) DO NOTHING`,
            
            // Step 5: Add indexes for better performance
            `CREATE INDEX IF NOT EXISTS idx_message_branches_message_id ON message_branches(message_id)`,
            `CREATE INDEX IF NOT EXISTS idx_message_branches_branch_id ON message_branches(branch_id)`,
            `CREATE INDEX IF NOT EXISTS idx_message_branches_user_id ON message_branches(user_id)`
        ];
        
        for (let i = 0; i < migrationSteps.length; i++) {
            const statement = migrationSteps[i];
            try {
                console.log(`Executing step ${i + 1}/${migrationSteps.length}:`, statement.substring(0, 100) + '...');
                await sql.unsafe(statement);
                console.log(`✅ Step ${i + 1} completed successfully`);
            } catch (error) {
                console.error(`❌ Step ${i + 1} failed:`, error.message);
                console.error('Failed statement:', statement);
                throw error;
            }
        }
        
        console.log('✅ Migration completed successfully!');
        console.log('The database now uses the new normalized schema with messageBranches join table.');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

runMigration();
