export const sql_create_schema_meta = `CREATE SCHEMA IF NOT EXISTS meta;`

export const sql_create_table_schema_version = `
  CREATE TABLE IF NOT EXISTS meta.schema_version (
    id SERIAL PRIMARY KEY,
    version INTEGER NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`

export const sql_get_current_version = `SELECT version FROM meta.schema_version ORDER BY id DESC LIMIT 1`

export const sql_insert_version = `INSERT INTO meta.schema_version (version) VALUES ($1)`
