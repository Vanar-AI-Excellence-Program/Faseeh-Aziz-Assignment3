# Database Schema Migration Guide

## Overview

This migration updates the database schema from the old structure (with `branchId` directly in `chatMessages`) to a new normalized structure using a proper join table (`messageBranches`).

## New Schema Benefits

✅ **Proper Normalization**: Uses join table for many-to-many relationships  
✅ **No Data Duplication**: Messages stored once, assigned to multiple branches  
✅ **Better Performance**: Optimized queries with proper indexes  
✅ **Data Integrity**: Foreign key constraints prevent orphaned records  
✅ **Flexible Branching**: Messages can belong to multiple branches simultaneously  

## Migration Steps

### 1. Backup Your Database (IMPORTANT!)

```bash
# Create a backup before migration
pg_dump your_database_name > backup_before_migration.sql
```

### 2. Run the Migration

```bash
# Run the migration script
pnpm db:migrate:schema
```

### 3. Verify the Migration

```bash
# Check database structure
pnpm db:check
```

## What the Migration Does

### Before Migration
```sql
-- Old structure
chat_messages:
- id, user_id, conversation_id, branch_id, parent_message_id, ...
```

### After Migration
```sql
-- New structure
chat_messages:
- id, user_id, conversation_id, parent_message_id, ... (no branch_id)

message_branches (join table):
- id, message_id, branch_id, conversation_id, user_id, ...

chat_branches:
- id, user_id, conversation_id, parent_branch_id, branch_name, ...
```

## Migration Process Details

1. **Creates new `messageBranches` table** with proper constraints
2. **Migrates existing data** from `chatMessages.branchId` to join table
3. **Creates main branches** for each conversation if they don't exist
4. **Removes `branchId` column** from `chatMessages` table
5. **Adds performance indexes** for optimal query performance

## API Changes

The following APIs have been updated to work with the new schema:

- `/api/chat/messages` - Now uses joins to get messages by branch
- `/api/chat/branches` - Updated to work with join table
- `/api/chat/branches/messages` - Uses joins for branch-specific messages
- `/api/chat/branches/save-message` - Creates message and assigns to branch

## Frontend Changes

The frontend has been updated to:
- Load messages with proper branch structure
- Handle circular navigation between branches
- Maintain branch relationships across page reloads

## Rollback Plan

If you need to rollback:

1. **Restore from backup**:
   ```bash
   psql your_database_name < backup_before_migration.sql
   ```

2. **Revert code changes** to use the old schema

## Verification

After migration, verify that:

1. **Messages load correctly** in the chat interface
2. **Branch navigation works** (Previous/Next buttons)
3. **Branch creation works** when editing messages
4. **Page reloads preserve** branch structure

## Troubleshooting

### Common Issues

1. **Migration fails**: Check that you have proper database permissions
2. **Messages not loading**: Verify the new API endpoints are working
3. **Branch navigation broken**: Check that branch data is properly migrated

### Debug Commands

```bash
# Check database structure
pnpm db:studio

# Check migration status
pnpm db:check

# View logs for debugging
tail -f logs/app.log
```

## Support

If you encounter issues during migration:

1. Check the migration logs for specific error messages
2. Verify your database connection and permissions
3. Ensure all dependencies are up to date
4. Contact support with specific error details

---

**Note**: This migration is irreversible once completed. Always backup your database before running the migration.
