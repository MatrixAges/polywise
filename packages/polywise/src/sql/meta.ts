import { SCHEMA_META } from '../consts'

export const sql_create_schema_meta = `CREATE SCHEMA IF NOT EXISTS ${SCHEMA_META};`

export const sql_create_table_schema_version = `
  CREATE TABLE IF NOT EXISTS ${SCHEMA_META}.schema_version (
    id SERIAL PRIMARY KEY,
    version INTEGER NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`

export const sql_get_current_version = `SELECT version FROM ${SCHEMA_META}.schema_version ORDER BY id DESC LIMIT 1`

export const sql_insert_version = `INSERT INTO ${SCHEMA_META}.schema_version (version) VALUES ($1)`
