import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the new schema tables exist
    const schemaCheck = {
      messageTable: {
        hasBranchId: false,
        hasChunkCitations: false,
        hasParentMessageId: false
      },
      branchTable: {
        exists: false,
        hasData: false
      },
      conversationDocumentsTable: {
        exists: false
      },
      messageBranchesTable: {
        exists: false
      }
    };

    try {
      // Check if message table has new columns
      const messageColumns = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'message' 
        AND table_schema = 'public'
      `);
      
      schemaCheck.messageTable.hasBranchId = messageColumns.some((col: any) => col.column_name === 'branchId');
      schemaCheck.messageTable.hasChunkCitations = messageColumns.some((col: any) => col.column_name === 'chunkCitations');
      schemaCheck.messageTable.hasParentMessageId = messageColumns.some((col: any) => col.column_name === 'parentMessageId');

      // Check if branch table exists
      const branchTable = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'branch'
        )
      `);
      schemaCheck.branchTable.exists = branchTable[0]?.exists || false;

      if (schemaCheck.branchTable.exists) {
        // Check if branch table has data
        const branchCount = await db.execute(sql`SELECT COUNT(*) as count FROM branch`);
        schemaCheck.branchTable.hasData = (branchCount[0]?.count || 0) > 0;
      }

      // Check if conversationDocuments table exists
      const convDocTable = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'conversationDocuments'
        )
      `);
      schemaCheck.conversationDocumentsTable.exists = convDocTable[0]?.exists || false;

      // Check if messageBranches table exists
      const msgBranchTable = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'messageBranches'
        )
      `);
      schemaCheck.messageBranchesTable.exists = msgBranchTable[0]?.exists || false;

    } catch (error) {
      console.error('Error checking schema:', error);
    }

    return json({
      success: true,
      schema: schemaCheck,
      message: schemaCheck.branchTable.exists 
        ? 'New schema is available' 
        : 'New schema not available - run migration 0008_add_rag_persistence.sql first'
    });

  } catch (error) {
    console.error('Error in schema check:', error);
    return json({ 
      error: 'Failed to check schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
