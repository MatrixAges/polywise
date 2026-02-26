import { app } from '../consts'

/**
 * Increments global input counter.
 * Role: Tracks ingestion/query volume for monitoring and adaptive logic.
 */
export const sql_increment_input_count = `
  INSERT INTO ${app.db.schema_meta}.stats (key, value)
  VALUES ('input_count', '1'::jsonb)
  ON CONFLICT (key) DO UPDATE SET value = to_jsonb(COALESCE((stats.value::text)::int, 0) + 1);
`

/**
 * Reads current global input counter.
 * Role: Monitoring and threshold-trigger logic.
 */
export const sql_get_input_count = `SELECT value FROM ${app.db.schema_meta}.stats WHERE key = 'input_count'`

/**
 * Resets global input counter.
 * Role: Counter window reset / maintenance.
 */
export const sql_reset_input_count = `
  INSERT INTO ${app.db.schema_meta}.stats (key, value)
  VALUES ('input_count', '0'::jsonb)
  ON CONFLICT (key) DO UPDATE SET value = '0'::jsonb;
`
