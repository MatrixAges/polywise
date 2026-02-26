import { SCHEMA_META } from '../consts'

/**
 * Creates the metadata schema.
 * Role: Initializes namespace for system metadata.
 */
export const sql_create_schema_meta = `CREATE SCHEMA IF NOT EXISTS ${SCHEMA_META};`

/**
 * Creates the schema version table.
 * Role: Tracks the current database migration state to ensure compatibility.
 */
export const sql_create_table_schema_version = `
  CREATE TABLE IF NOT EXISTS ${SCHEMA_META}.schema_version (
    id SERIAL PRIMARY KEY,
    version INTEGER NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`

/**
 * Retrieves the latest applied schema version.
 * Role: Used during initialization to determine which migrations need to be run.
 */
export const sql_get_current_version = `SELECT version FROM ${SCHEMA_META}.schema_version ORDER BY id DESC LIMIT 1`

/**
 * Records a newly applied schema version.
 * Role: Updates the system state after a successful migration.
 */
export const sql_insert_version = `INSERT INTO ${SCHEMA_META}.schema_version (version) VALUES ($1)`
