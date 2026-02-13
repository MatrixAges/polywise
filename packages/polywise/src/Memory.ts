import dayjs from 'dayjs'
import { injectable } from 'tsyringe'

import {
	getClassifyPrompt,
	LONG_TERM_CAPACITY,
	LTM_DECAY_LAMBDA,
	PRIORITY_WEIGHTS,
	TIME_DECAY_HALFLIFE_DAYS
} from './consts'
import { sql_memory } from './sql'

import type Polywise from './Polywise'
import type { DataRows, FiltersArgs, Knowledge } from './types'

@injectable()
export default class Memory {
	private p: Polywise

	init(p: Polywise) {
		this.p = p
	}

	async getLongMemory(args: FiltersArgs = {}) {
		const { idol_id, root_ids, metrics_ids } = args

		const filters = [idol_id ?? null, root_ids ?? null, metrics_ids ?? null]

		const rows = (await this.queryRaw(sql_memory.sql_get_long_memory, filters)) as DataRows

		if (rows.length > 0) {
			await this.exec(sql_memory.sql_update_long_term_access, filters)
		}

		return rows.map(r => r.content).join('\n')
	}

	async saveLongTerm(content: string, args: FiltersArgs = {}) {
		const { idol_id, root_ids, metrics_ids } = args

		const embedding = (await this.p.pipeline.embed(content)) as Array<number>

		if (!embedding) return

		const vector_str = `[${embedding.join(',')}]`

		const similar = (await this.queryRaw(sql_memory.sql_find_similar_long_term, [vector_str, 0.8])) as DataRows

		if (similar.length > 0) {
			const existing_content = similar[0].content
			const prompt = getClassifyPrompt(existing_content, content)

			const decision = await this.p.pipeline.decide(prompt, { max_new_tokens: 5 })
			const normalized = decision.split('\n')[0].toUpperCase().trim()

			if (normalized.startsWith('DUPLICATE')) {
				await this.exec(sql_memory.sql_update_long_term_frequency, [similar[0].id])
				return
			}

			if (normalized.startsWith('UPDATE')) {
				await this.queryRaw(sql_memory.sql_update_long_term_content, [
					content,
					vector_str,
					similar[0].id
				])
				return
			}
		}

		const count_res = (await this.queryRaw(sql_memory.sql_get_long_term_count)) as Array<{ count: number }>

		if (count_res[0].count >= LONG_TERM_CAPACITY) {
			await this.exec(sql_memory.sql_delete_decayed_long_term, [LTM_DECAY_LAMBDA])
		}

		await this.queryRaw(sql_memory.sql_insert_long_term, [
			content,
			vector_str,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null
		])
	}

	async getDailyMemory(timestamp: string, args: FiltersArgs = {}) {
		const { idol_id, root_ids, metrics_ids } = args
		const filters = [timestamp, idol_id ?? null, root_ids ?? null, metrics_ids ?? null]

		const current = (await this.queryRaw(sql_memory.sql_get_diary, filters))[0]
		const prev = (await this.queryRaw(sql_memory.sql_get_prev_diary, filters))[0]
		const next = (await this.queryRaw(sql_memory.sql_get_next_diary, filters))[0]

		return { current, prev, next }
	}

	async saveDiary(content: string, timestamp: string, args: FiltersArgs = {}) {
		const { idol_id, root_ids, metrics_ids } = args
		const embedding = (await this.p.pipeline.embed(content)) as Array<number>

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
		const { idol_id, root_ids, metrics_ids } = args
		const embedding = (await this.p.pipeline.embed(query)) as Array<number>

		if (!embedding) return []

		const vector_str = `[${embedding.join(',')}]`
		const filters = [vector_str, idol_id ?? null, root_ids ?? null, metrics_ids ?? null, limit]

		const lt_results = (await this.queryRaw(sql_memory.sql_search_long_term, filters)) as Array<any>
		const diary_results = (await this.queryRaw(sql_memory.sql_search_diary, filters)) as Array<any>
		const knowledges: Array<Knowledge> = []

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

	private async exec(sql_str: string, params?: Array<any>) {
		if (params) {
			await this.p.db.query(sql_str, params)
		} else {
			await this.p.db.exec(sql_str)
		}
	}

	private async queryRaw(sql_str: string, params?: Array<any>) {
		const res = params ? await this.p.db.query(sql_str, params) : await this.p.db.query(sql_str)

		return JSON.parse(JSON.stringify(res.rows))
	}
}
