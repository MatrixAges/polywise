import { PGlite } from '@electric-sql/pglite'

export class PolywiseEngine {
	private db: PGlite | null = null

	async initDB(dataDir?: string) {
		this.db = new PGlite(dataDir, {
			relaxedDurability: true
		})
	}

	async exec(sql: string) {
		if (!this.db) throw new Error('DB not initialized')
		await this.db.exec(sql)
	}

	async query(sql: string, params?: any[]) {
		if (!this.db) throw new Error('DB not initialized')
		const res = await this.db.query(sql, params)
		return JSON.parse(JSON.stringify(res.rows))
	}

	async tick(threshold: number) {
		if (!this.db) throw new Error('DB not initialized')
		await this.db.exec(`
      WITH incoming_signals AS (
        SELECT 
          e.target_id, 
          SUM(n.activation * e.weight / (e.distance + 0.1)) as total_input
        FROM brain.edges e
        JOIN brain.nodes n ON e.source_id = n.id
        WHERE n.activation > 0
        GROUP BY e.target_id
      )
      UPDATE brain.nodes
      SET potential = LEAST(potential + COALESCE((SELECT total_input FROM incoming_signals WHERE incoming_signals.target_id = brain.nodes.id), 0), 2.0);

      UPDATE brain.nodes
      SET 
        activation = CASE WHEN potential > ${threshold} THEN 1.0 ELSE 0.0 END,
        potential = CASE WHEN potential > ${threshold} THEN 0.0 ELSE potential * 0.9 END,
        last_fired_at = CASE WHEN potential > ${threshold} THEN CURRENT_TIMESTAMP ELSE last_fired_at END;

      UPDATE brain.edges e
      SET weight = CASE 
        WHEN (SELECT activation FROM brain.nodes WHERE id = e.source_id) > 0 
             AND (SELECT activation FROM brain.nodes WHERE id = e.target_id) > 0 
        THEN LEAST(weight + (0.2 * e.learning_rate), 5.0)
        ELSE GREATEST(weight - (0.001 / e.decay_resistance), 0.1)
      END;

      UPDATE brain.edges
      SET distance = GREATEST(1.0 / (weight + 0.1), 0.2);
    `)
	}
}
