import { app } from '../consts'

/**
 * Creates the metadata schema.
 * Role: Initializes namespace for system metadata.
 */
export const sql_create_schema_meta = `CREATE SCHEMA IF NOT EXISTS ${app.schema_meta};`

/**
 * Creates the schema version table.
 * Role: Tracks the current database migration state to ensure compatibility.
 */
export const sql_create_table_schema_version = `
  CREATE TABLE IF NOT EXISTS ${app.schema_meta}.schema_version (
    id SERIAL PRIMARY KEY,
    version INTEGER NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`

/**
 * Retrieves the latest applied schema version.
 * Role: Used during initialization to determine which migrations need to be run.
 */
export const sql_get_current_version = `
  SELECT version
  FROM ${app.schema_meta}.schema_version
  ORDER BY id DESC
  LIMIT 1
`

/**
 * Records a newly applied schema version.
 * Role: Updates the system state after a successful migration.
 */
export const sql_insert_version = `
  INSERT INTO ${app.schema_meta}.schema_version (version)
  VALUES ($1)
`

/**
 * Creates the stats table.
 * Role: Stores system counters and runtime metadata.
 */
export const sql_create_table_stats = `
  CREATE TABLE IF NOT EXISTS ${app.schema_meta}.stats (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`

/**
 * Begins a transaction.
 * Role: Ensures a group of SQL operations execute atomically.
 */
export const sql_begin = `BEGIN`

/**
 * Commits a transaction.
 * Role: Finalizes all SQL changes in current transaction.
 */
export const sql_commit = `COMMIT`

/**
 * Rolls back a transaction.
 * Role: Reverts all SQL changes in current transaction.
 */
export const sql_rollback = `ROLLBACK`
