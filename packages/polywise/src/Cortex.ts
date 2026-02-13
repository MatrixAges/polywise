import { injectable } from 'tsyringe'

import { ChainEmitter, processResults, getRandomId } from './utils'
import { getNextStepPrompt } from './consts'
import Polywise from './Polywise'

import type { CortexProcessArgs, WorkingMemory, Step } from './types/cortex'
import type { Knowledge, Action } from './types/polywise'

@injectable()
export default class Cortex {
	private p: Polywise
	private working_memory: Map<string, WorkingMemory> = new Map()

	init(p: Polywise) {
		this.p = p
	}

	async process(args: CortexProcessArgs) {
		const { cot_depth = 0, process } = args

		if (cot_depth <= 0) return await this.executeFastPath(args)

		const emitter = new ChainEmitter()
		const task_id = getRandomId()

		const wm: WorkingMemory = {
			original_goal: args.query,
			steps: [],
			accumulated_knowledges: [],
			accumulated_actions: [],
			context_embedding: [],
			history_ids: new Set()
		}

		this.working_memory.set(task_id, wm)

		if (process) {
			emitter.on((data, steps) => {
				process.emit(`CoT Step ${steps.length + 1}`, data)
			})
		}

		const initial_data = await this.executeStep(args, args.query, wm)

		this.updateMemory(wm, initial_data)
		this.runPlanningLoop(task_id, args, emitter, wm)

		args.process?.emit('planning_step', initial_data)

		const { knowledges, actions, metadata } = await processResults(
			args.query,
			initial_data.knowledges,
			initial_data.actions,
			this.p.pipeline
		)

		return {
			knowledges,
			actions,
			metadata,
			cot: emitter
		}
	}

	private async executeFastPath(args: CortexProcessArgs) {
		const {
			query,
			recall_depth,
			search_limit,
			rerank_limit,
			stimulate_on_recall,
			habit_threshold,
			idol_id,
			root_ids,
			metrics_ids,
			process
		} = args

		const query_embedding = ((await this.p.pipeline.embed(query)) as Array<number>) || []
		const emitter = new ChainEmitter()

		if (args.process) {
			emitter.on((_data, steps) => {
				args.process?.emit('cot', steps)
			})
		}

		const { knowledges: initial_knowledges, actions: initial_actions } = await this.p.executeSingleSearch({
			query,
			recall_depth,
			search_limit,
			rerank_limit,
			stimulate_on_recall,
			idol_id: idol_id ?? undefined,
			root_ids: root_ids ?? undefined,
			metrics_ids: metrics_ids ?? undefined,
			process
		})

		await this.p.handleHabitReaction({
			query,
			query_embedding,
			initial_actions,
			habit_threshold: habit_threshold ?? 0.8
		})

		const {
			knowledges: k_strings,
			actions: a_strings,
			metadata
		} = await processResults(query, initial_knowledges, initial_actions, this.p.pipeline)

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
		const { cot_depth = 1 } = args

		try {
			for (let i = 0; i < cot_depth; i++) {
				if (!emitter.isActiveStatus() || !this.p.db) break

				const next_query = await this.planNextStep(wm)

				if (next_query === 'DONE') break

				const step_data = await this.executeStep(args, next_query, wm)

				this.updateMemory(wm, step_data)

				args.process?.emit('planning_step', step_data)

				if (step_data.knowledges.length > 0 || step_data.actions.length > 0) {
					await this.emitProgress(emitter, step_data.knowledges, step_data.actions, next_query)
				}
			}

			const { knowledges, actions, metadata } = await processResults(
				wm.original_goal,
				wm.accumulated_knowledges,
				wm.accumulated_actions,
				this.p.pipeline
			)

			emitter.finish({ knowledges, actions, metadata })
		} catch (error) {
			console.error('Cortex Planning Error:', error)

			if (this.p.db) {
				const { knowledges, actions, metadata } = await processResults(
					wm.original_goal,
					wm.accumulated_knowledges,
					wm.accumulated_actions,
					this.p.pipeline
				)
				emitter.finish({ knowledges, actions, metadata })
			} else {
				emitter.finish({ knowledges: [], actions: [], metadata: {} as any })
			}
		} finally {
			this.working_memory.delete(task_id)
		}
	}

	private async planNextStep(wm: WorkingMemory): Promise<string> {
		const history = wm.steps
			.map(s => `Thought: ${s.thought}\nQuery: ${s.query}\nResult: ${s.result_summary}`)
			.join('\n---\n')

		const prompt = getNextStepPrompt(wm.original_goal, history)

		const decision = await this.p.pipeline.decide(prompt, { max_new_tokens: 30, temperature: 0.3 })

		const query = decision.trim().split('\n')[0].replace(/"/g, '')

		return query.length < 3 ? 'DONE' : query
	}

	private async executeStep(
		args: CortexProcessArgs,
		query: string,
		wm: WorkingMemory
	): Promise<{ step: Step; knowledges: Array<Knowledge>; actions: Array<Action> }> {
		const {
			recall_depth,
			search_limit,
			rerank_limit,
			stimulate_on_recall,
			idol_id,
			root_ids,
			metrics_ids,
			process
		} = args

		const { knowledges, actions } = await this.p.executeSingleSearch({
			query,
			recall_depth,
			search_limit,
			rerank_limit,
			stimulate_on_recall,
			idol_id,
			root_ids,
			metrics_ids,
			process
		})

		const new_knowledges = knowledges.filter(k => !wm.history_ids.has(k.id))
		const new_actions = actions.filter(a => !wm.history_ids.has(a.id))

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

	private updateMemory(
		wm: WorkingMemory,
		data: { step: Step; knowledges: Array<Knowledge>; actions: Array<Action> }
	) {
		wm.steps.push(data.step)
		wm.accumulated_knowledges.push(...data.knowledges)
		wm.accumulated_actions.push(...data.actions)

		data.knowledges.forEach(k => wm.history_ids.add(k.id))
		data.actions.forEach(a => wm.history_ids.add(a.id))
	}

	private async emitProgress(
		emitter: ChainEmitter,
		knowledges: Array<Knowledge>,
		actions: Array<Action>,
		query: string
	) {
		const {
			knowledges: k_strings,
			actions: a_strings,
			metadata
		} = await processResults(query, knowledges, actions, this.p.pipeline)

		if (emitter.isActiveStatus()) {
			emitter.emit({ knowledges: k_strings, actions: a_strings, metadata })
		}
	}
}
