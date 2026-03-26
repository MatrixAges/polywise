import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

import agent from './agent'
import node from './node'

export default sqliteTable(
	'edge',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		// Records "predicate/relation" in triples
		relation: text('relation').notNull(),
		// Foreign key: belongs to which agent
		agent_id: text('agent_id')
			.references(() => agent.id, { onDelete: 'cascade' })
			.notNull(),
		// Foreign key: source node
		source_id: text('source_id')
			.references(() => node.id, { onDelete: 'cascade' })
			.notNull(),
		// Foreign key: target node
		target_id: text('target_id')
			.references(() => node.id, { onDelete: 'cascade' })
			.notNull(),
		// Synaptic weight: Q-value in RL (determines signal transmission strength)
		weight: real('weight').default(1.0).notNull(),
		// Neuroplasticity: learning rate (higher value means faster weight change; can be used to freeze mature memories)
		growth: real('growth').default(1.0).notNull(),
		// Confidence (basis for RL exploration vs exploitation: low confidence encourages network to explore new paths)
		confidence: real('confidence').default(0.5).notNull(),
		// Distance from source node to target node
		distance: real('distance').default(1.0).notNull(),
		// Edge thickness, determines signal propagation speed
		bandwidth: real('bandwidth').default(1.0).notNull(),
		// Total number of times visited
		active_times: integer('active_times').default(1).notNull(),
		// Last time used for reasoning/wandering (for synaptic pruning/long-term depression)
		active_at: integer('active_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.notNull(),
		// Frozen state (core memory nodes, exempt from forgetting mechanism cleanup)
		is_frozen: integer('is_frozen', { mode: 'boolean' }).default(false).notNull(),

		created_at: integer('created_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.notNull()
	},
	t => [
		index('edge_agent_id_idx').on(t.agent_id),
		index('edge_source_idx').on(t.source_id),
		index('edge_target_idx').on(t.target_id),
		uniqueIndex('edge_source_target_idx').on(t.source_id, t.target_id),
		index('edge_created_at_idx').on(t.created_at)
	]
)
