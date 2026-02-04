import type { PGlite } from '@electric-sql/pglite'
import { injectable } from 'tsyringe'
import dayjs from 'dayjs'

import type Pipeline from './Pipeline'
import { sql_memory } from './sql'
import { LONG_TERM_CAPACITY, PRIORITY_WEIGHTS, TIME_DECAY_HALFLIFE_DAYS } from './consts'
import type { FiltersArgs, Knowledge } from './types'

@injectable()
export default class Memory {
	private db: PGlite | null = null
	private pipeline: Pipeline | null = null

	init(db: PGlite, pipeline: Pipeline) {
		this.db = db
		this.pipeline = pipeline
	}

	async getLongMemory(args: FiltersArgs = {}) {
		const { idol_id, root_ids, metrics_ids } = args

		const rows = (await this.queryRaw(sql_memory.sql_get_long_memory, [
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null
		])) as { content: string }[]

		if (rows.length > 0) {
			await this.exec(sql_memory.sql_update_long_term_access, [
				idol_id ?? null,
				root_ids ?? null,
				metrics_ids ?? null
			])
		}

		return rows.map(r => r.content).join('\n')
	}

	async saveLongTerm(content: string, args: FiltersArgs = {}) {
		if (!this.pipeline) return

		const { idol_id, root_ids, metrics_ids } = args
		const embedding = (await this.pipeline.embed(content)) as number[]

		const count_res = (await this.queryRaw(sql_memory.sql_get_long_term_count)) as { count: number }[]

		if (count_res[0].count >= LONG_TERM_CAPACITY) {
			await this.exec(sql_memory.sql_delete_oldest_long_term)
		}

		await this.queryRaw(sql_memory.sql_insert_long_term, [
			content,
			embedding ? `[${embedding.join(',')}]` : null,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null
		])
	}

	async getDailyMemory(timestamp: string, args: FiltersArgs = {}) {
		const { idol_id, root_ids, metrics_ids } = args

		const current = (
			await this.queryRaw(sql_memory.sql_get_diary, [
				timestamp,
				idol_id ?? null,
				root_ids ?? null,
				metrics_ids ?? null
			])
		)[0]

		const prev = (
			await this.queryRaw(sql_memory.sql_get_prev_diary, [
				timestamp,
				idol_id ?? null,
				root_ids ?? null,
				metrics_ids ?? null
			])
		)[0]

		const next = (
			await this.queryRaw(sql_memory.sql_get_next_diary, [
				timestamp,
				idol_id ?? null,
				root_ids ?? null,
				metrics_ids ?? null
			])
		)[0]

		return { current, prev, next }
	}

	async saveDiary(content: string, timestamp: string, args: FiltersArgs = {}) {
		if (!this.pipeline) return

		const { idol_id, root_ids, metrics_ids } = args
		const embedding = (await this.pipeline.embed(content)) as number[]

		await this.queryRaw(sql_memory.sql_insert_diary, [
			content,
			embedding ? `[${embedding.join(',')}]` : null,
			timestamp,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null
		])
	}

	async search(query: string, args: FiltersArgs = {}, limit = 5) {
		if (!this.pipeline) return []

		const { idol_id, root_ids, metrics_ids } = args
		const embedding = (await this.pipeline.embed(query)) as number[]

		if (!embedding) return []

		const vector_str = `[${embedding.join(',')}]`

		const lt_results = (await this.queryRaw(sql_memory.sql_search_long_term, [
			vector_str,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null,
			limit
		])) as any[]

		const diary_results = (await this.queryRaw(sql_memory.sql_search_diary, [
			vector_str,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null,
			limit
		])) as any[]

		const knowledges: Knowledge[] = []

		for (const r of lt_results) {
			knowledges.push({
				id: r.id,
				content: r.content,
				rerankScore: 0,
				relevanceScore: r.similarity * PRIORITY_WEIGHTS.long_term,
				memoryStrength: r.similarity,
				combinedScore: 0,
				source: 'long_term' as any,
				stimulated: false,
				metadata: { last_accessed_at: r.last_accessed_at }
			})
		}

		for (const r of diary_results) {
			const decay = this.calculateTimeDecay(r.timestamp)

			knowledges.push({
				id: r.id,
				content: r.content,
				rerankScore: 0,
				relevanceScore: r.similarity * PRIORITY_WEIGHTS.diary * decay,
				memoryStrength: r.similarity,
				combinedScore: 0,
				source: 'diary' as any,
				stimulated: false,
				metadata: { timestamp: r.timestamp }
			})
		}

		return knowledges
	}

	private calculateTimeDecay(timestamp: string | Date) {
		const days = dayjs().diff(dayjs(timestamp), 'day')
		return Math.pow(0.5, days / TIME_DECAY_HALFLIFE_DAYS)
	}

	private async exec(sql_str: string, params?: any[]) {
		if (!this.db) return
		if (params) {
			await this.db.query(sql_str, params)
		} else {
			await this.db.exec(sql_str)
		}
	}

	private async queryRaw(sql_str: string, params?: any[]) {
		if (!this.db) return []
		const res = params ? await this.db.query(sql_str, params) : await this.db.query(sql_str)
		return JSON.parse(JSON.stringify(res.rows))
	}

	off() {
		this.db = null
		this.pipeline = null
	}
}
