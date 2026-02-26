/**
 * Begins a transaction.
 * Role: Ensures a group of SQL operations execute atomically.
 */
export const sql_tx_begin = `BEGIN`

/**
 * Commits a transaction.
 * Role: Finalizes all SQL changes in current transaction.
 */
export const sql_tx_commit = `COMMIT`

/**
 * Rolls back a transaction.
 * Role: Reverts all SQL changes in current transaction.
 */
export const sql_tx_rollback = `ROLLBACK`
