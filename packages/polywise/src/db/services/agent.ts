import { config } from '@core/config'
import { preset_providers } from '@core/consts/providers'
import { normalizeAgentTools } from '@core/db/agentTool'
import { agent } from '@core/db/schema'
import { env } from '@core/env'
import { asc, SQL } from 'drizzle-orm'

import type { Agent, AgentInsert } from '@core/db'
import type { TableModel } from '@core/types'

interface ArgsGetAgents {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
}

const normalizeAgentRole = (value: unknown) => {
	if (typeof value !== 'string') {
		return ''
	}

	return value.trim().replace(/\s+/g, ' ')
}

const isValidAgentModel = (value: unknown): value is TableModel => {
	if (!value || typeof value !== 'object') {
		return false
	}

	const { provider, model } = value as Partial<TableModel>

	return typeof provider === 'string' && provider.trim() !== '' && typeof model === 'string' && model.trim() !== ''
}

export const getDefaultAgentModel = (): TableModel => {
	if (isValidAgentModel(config.default_model)) {
		return { ...config.default_model }
	}

	const preset = preset_providers[0]

	return {
		provider: preset.name,
		model: preset.models[0].id
	}
}

export const normalizeAgentModel = (value: unknown): TableModel => {
	if (!isValidAgentModel(value)) {
		return getDefaultAgentModel()
	}

	const next_value = value as TableModel

	return {
		...next_value,
		provider: next_value.provider.trim(),
		model: next_value.model.trim()
	}
}

const normalizeAgentValues = <T extends Partial<AgentInsert>>(values: T): T => {
	let next_values = values as Partial<AgentInsert>

	if ('model' in next_values) {
		next_values = {
			...next_values,
			model: normalizeAgentModel(next_values.model)
		}
	}

	if ('tools' in next_values) {
		next_values = {
			...next_values,
			tools: normalizeAgentTools(next_values.tools)
		}
	}

	if ('role' in next_values) {
		next_values = {
			...next_values,
			role: normalizeAgentRole(next_values.role)
		}
	}

	return next_values as T
}

const normalizeAgent = (row: Agent | undefined) => {
	if (!row) {
		return row
	}

	const next_row = {
		...row,
		model: normalizeAgentModel(row.model),
		tools: normalizeAgentTools(row.tools),
		role: normalizeAgentRole(row.role)
	}
	const photo = row.photo

	if (!photo) {
		return next_row
	}

	if (photo instanceof Uint8Array && photo.constructor === Uint8Array) {
		return next_row
	}

	if (photo instanceof Uint8Array) {
		return { ...next_row, photo: new Uint8Array(photo) }
	}

	if (photo instanceof ArrayBuffer) {
		return { ...next_row, photo: new Uint8Array(photo) }
	}

	return next_row
}

export const addAgent = async (values: AgentInsert) => {
	return env.db
		.insert(agent)
		.values(normalizeAgentValues(values))
		.returning()
		.then(res => normalizeAgent(res[0]))
}

export const getAgent = async (where: SQL) => {
	return env.db
		.select()
		.from(agent)
		.where(where)
		.limit(1)
		.then(res => normalizeAgent(res[0]))
}

export const getAgents = async (args: ArgsGetAgents = {}) => {
	const { where, orderBy = [asc(agent.order), asc(agent.created_at)], limit } = args

	let query = env.db.select().from(agent).$dynamic()

	if (where) query = query.where(where)

	if (orderBy) {
		const order_args = Array.isArray(orderBy) ? orderBy : [orderBy]

		query = query.orderBy(...order_args)
	}

	if (limit) query = query.limit(limit)

	return query.then(res => res.map(item => normalizeAgent(item) as Agent))
}

export const setAgent = async (where: SQL, values: Partial<AgentInsert>) => {
	return env.db
		.update(agent)
		.set(normalizeAgentValues(values))
		.where(where)
		.returning()
		.then(res => normalizeAgent(res[0]))
}

export const removeAgent = async (where: SQL) => {
	return env.db
		.delete(agent)
		.where(where)
		.returning()
		.then(res => normalizeAgent(res[0]))
}
