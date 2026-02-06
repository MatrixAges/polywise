import { singleton } from 'tsyringe'

import { ChainEmitter, processResults, getRandomId } from './utils'
import type Polywise from './Polywise'
import type { CortexProcessArgs, WorkingMemory, Step } from './types/cortex'
import type { Knowledge, Action, FinalQueryResult } from './types/polywise'

@singleton()
export default class Cortex {
	private poly: Polywise | null = null
	private working_memory: Map<string, WorkingMemory> = new Map()

	init(poly: Polywise) {
		this.poly = poly
	}

	async process(args: CortexProcessArgs): Promise<FinalQueryResult> {
		if (!this.poly) throw new Error('Cortex not initialized')

		const { cot_depth = 0 } = args

		// Fast path: No CoT or simple query
		if (cot_depth <= 0) {
			return await this.executeFastPath(args)
		}

		// CoT Path: Iterative Planning
		const emitter = new ChainEmitter()
		const task_id = getRandomId()

		// Initialize Working Memory
		const wm: WorkingMemory = {
			original_goal: args.query,
			steps: [],
			accumulated_knowledges: [],
			accumulated_actions: [],
			context_embedding: [],
			history_ids: new Set()
		}

		this.working_memory.set(task_id, wm)

		// Step 0: Initial Search (Base Context) - Executed immediately
		const initial_data = await this.executeStep(args, args.query, wm)
		this.updateMemory(wm, initial_data)

		// Start the async planning loop (fire and forget)
		this.runPlanningLoop(task_id, args, emitter, wm) // Pass wm directly

		// Return the initial structure (Step 0 results) with the emitter
		const { knowledges, actions, metadata } = await processResults(
			args.query,
			initial_data.knowledges,
			initial_data.actions,
			this.poly.pipeline
		)

		return {
			knowledges,
			actions,
			metadata,
			cot: emitter
		}
	}

	private async executeFastPath(args: CortexProcessArgs): Promise<FinalQueryResult> {
		if (!this.poly) throw new Error('Cortex not initialized')

		const {
			query,
			recall_depth,
			search_limit,
			rerank_limit,
			stimulate_on_recall,
			habit_threshold,
			idol_id,
			root_ids,
			metrics_ids
		} = args

		const query_embedding = ((await this.poly.pipeline.embed(query)) as number[]) || []
		const emitter = new ChainEmitter()

		const { knowledges: initial_knowledges, actions: initial_actions } = await this.poly.executeSingleSearch({
			query,
			recall_depth,
			search_limit,
			rerank_limit,
			stimulate_on_recall,
			idol_id: idol_id ?? undefined,
			root_ids: root_ids ?? undefined,
			metrics_ids: metrics_ids ?? undefined
		})

		await this.poly.handleHabitReaction({
			query,
			query_embedding,
			initial_actions,
			habit_threshold: habit_threshold ?? 0.8
		})

		const {
			knowledges: k_strings,
			actions: a_strings,
			metadata
		} = await processResults(query, initial_knowledges, initial_actions, this.poly.pipeline)

		const result = {
			knowledges: k_strings,
			actions: a_strings,
			metadata,
			cot: (emitter.finish({ knowledges: k_strings, actions: a_strings, metadata }) as any) || emitter
		}

		return result
	}

	private async runPlanningLoop(
		task_id: string,
		args: CortexProcessArgs,
		emitter: ChainEmitter,
		wm: WorkingMemory
	) {
		if (!this.poly) return

		const { cot_depth = 1 } = args

		try {
			// Iterative Steps
			for (let i = 0; i < cot_depth; i++) {
				if (!emitter.isActiveStatus()) break

				// 1. Plan Next Step
				const next_query = await this.planNextStep(wm)

				if (next_query === 'DONE') break

				// 2. Execute Step
				const step_data = await this.executeStep(args, next_query, wm)

				// 3. Update Memory
				this.updateMemory(wm, step_data)

				// 4. Emit Progress
				if (step_data.knowledges.length > 0 || step_data.actions.length > 0) {
					await this.emitProgress(emitter, step_data.knowledges, step_data.actions, next_query)
				}
			}

			// Finalize
			const { knowledges, actions, metadata } = await processResults(
				wm.original_goal,
				wm.accumulated_knowledges,
				wm.accumulated_actions,
				this.poly.pipeline
			)

			emitter.finish({ knowledges, actions, metadata })
		} catch (error) {
			console.error('Cortex Planning Error:', error)
			// Fallback: Return what we have
			const { knowledges, actions, metadata } = await processResults(
				wm.original_goal,
				wm.accumulated_knowledges,
				wm.accumulated_actions,
				this.poly.pipeline
			)
			emitter.finish({ knowledges, actions, metadata })
		} finally {
			this.working_memory.delete(task_id)
		}
	}

	private async planNextStep(wm: WorkingMemory): Promise<string> {
		if (!this.poly) return 'DONE'

		const history = wm.steps
			.map(s => `Thought: ${s.thought}\nQuery: ${s.query}\nResult: ${s.result_summary}`)
			.join('\n---\n')

		const prompt = `Goal: "${wm.original_goal}"
History:
${history}

Task: Determine the single next search query needed to deepen understanding.
If sufficient information is gathered, reply "DONE".
Reply with ONLY the query or "DONE".

Next Query:`

		const decision = await this.poly.pipeline.decide(prompt, { max_new_tokens: 30, temperature: 0.3 })
		const query = decision.trim().split('\n')[0].replace(/"/g, '')

		return query.length < 3 ? 'DONE' : query
	}

	private async executeStep(
		args: CortexProcessArgs,
		query: string,
		wm: WorkingMemory
	): Promise<{ step: Step; knowledges: Knowledge[]; actions: Action[] }> {
		if (!this.poly) throw new Error('Polywise lost')

		const { recall_depth, search_limit, rerank_limit, stimulate_on_recall, idol_id, root_ids, metrics_ids } =
			args

		const { knowledges, actions } = await this.poly.executeSingleSearch({
			query,
			recall_depth,
			search_limit,
			rerank_limit,
			stimulate_on_recall,
			idol_id,
			root_ids,
			metrics_ids
		})

		// Filter duplicates
		const new_knowledges = knowledges.filter(k => !wm.history_ids.has(k.id))
		const new_actions = actions.filter(a => !wm.history_ids.has(a.id))

		// Summarize results for the Planner
		const top_results = [...new_knowledges, ...new_actions].slice(0, 3)
		const summary =
			top_results.length > 0
				? top_results.map(r => r.content.slice(0, 100)).join('... ')
				: 'No new relevant information found.'

		const step: Step = {
			id: Date.now(),
			thought: `Searching for: ${query}`,
			query,
			result_summary: summary
		}

		return { step, knowledges: new_knowledges, actions: new_actions }
	}

	private updateMemory(wm: WorkingMemory, data: { step: Step; knowledges: Knowledge[]; actions: Action[] }) {
		wm.steps.push(data.step)
		wm.accumulated_knowledges.push(...data.knowledges)
		wm.accumulated_actions.push(...data.actions)

		data.knowledges.forEach(k => wm.history_ids.add(k.id))
		data.actions.forEach(a => wm.history_ids.add(a.id))
	}

	private async emitProgress(emitter: ChainEmitter, knowledges: Knowledge[], actions: Action[], query: string) {
		if (!this.poly) return

		const {
			knowledges: k_strings,
			actions: a_strings,
			metadata
		} = await processResults(query, knowledges, actions, this.poly.pipeline)

		if (emitter.isActiveStatus()) {
			emitter.emit({ knowledges: k_strings, actions: a_strings, metadata })
		}
	}
}
