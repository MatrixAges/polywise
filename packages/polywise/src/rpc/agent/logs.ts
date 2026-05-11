import path from 'path'
import dayjs from 'dayjs'
import fs from 'fs-extra'

import { getAgentSkillLogDirPath, getAgentToolLogDirPath } from './utils'

export const agent_log_page_size = 10

export type AgentLogKind = 'tools' | 'skills'
export type AgentLogStatus = 'success' | 'error'

interface AgentLogEntryBase {
	created_at: number
	input: unknown
	output: unknown
	session_id: string
	status: AgentLogStatus
}

export interface AgentToolLogEntry extends AgentLogEntryBase {
	tool_name: string
}

export interface AgentSkillLogEntry extends AgentLogEntryBase {
	action: string
	skill_name: string
}

const log_file_regex = /^(\d{4}-\d{2}-\d{2})\.jsonl$/
const max_depth = 6
const max_string_length = 4000
const max_array_length = 50
const max_object_keys = 50

const getLogDirPath = (agent_id: string, kind: AgentLogKind) => {
	return kind === 'tools' ? getAgentToolLogDirPath(agent_id) : getAgentSkillLogDirPath(agent_id)
}

const getLogFilePath = (agent_id: string, kind: AgentLogKind, date: string) => {
	return path.resolve(getLogDirPath(agent_id, kind), `${date}.jsonl`)
}

const truncateString = (value: string) => {
	if (value.length <= max_string_length) {
		return value
	}

	return `${value.slice(0, max_string_length)}... [truncated ${value.length - max_string_length} chars]`
}

const sanitizeLogValue = (value: unknown, depth = 0, seen = new WeakSet<object>()): unknown => {
	if (value === null || value === undefined) return value ?? '[undefined]'
	if (depth >= max_depth) return '[truncated]'

	if (typeof value === 'string') return truncateString(value)
	if (typeof value === 'number' || typeof value === 'boolean') return value
	if (typeof value === 'bigint') return value.toString()
	if (typeof value === 'symbol') return value.toString()
	if (typeof value === 'function') return '[function]'

	if (value instanceof Date) {
		return value.toISOString()
	}

	if (value instanceof Error) {
		return {
			name: value.name,
			message: value.message,
			stack: value.stack ? truncateString(value.stack) : ''
		}
	}

	if (ArrayBuffer.isView(value)) {
		const target = value as { byteLength?: number; length?: number; constructor?: { name?: string } }

		return {
			type: target.constructor?.name || 'TypedArray',
			length: target.byteLength ?? target.length ?? 0
		}
	}

	if (Array.isArray(value)) {
		const normalized = value.slice(0, max_array_length).map(item => sanitizeLogValue(item, depth + 1, seen))

		if (value.length > max_array_length) {
			normalized.push(`[+${value.length - max_array_length} more items]`)
		}

		return normalized
	}

	if (typeof value === 'object') {
		if (seen.has(value as object)) {
			return '[circular]'
		}

		seen.add(value as object)

		const entries = Object.entries(value as Record<string, unknown>)
		const normalized = entries.slice(0, max_object_keys).reduce(
			(total, [key, item]) => {
				total[key] = sanitizeLogValue(item, depth + 1, seen)

				return total
			},
			{} as Record<string, unknown>
		)

		if (entries.length > max_object_keys) {
			normalized.__truncated_keys__ = entries.length - max_object_keys
		}

		return normalized
	}

	return String(value)
}

const appendAgentLog = async (args: {
	agent_id?: string | null
	entry: AgentToolLogEntry | AgentSkillLogEntry
	kind: AgentLogKind
}) => {
	const { agent_id, entry, kind } = args

	if (!agent_id) return

	const date = dayjs().format('YYYY-MM-DD')
	const file_path = getLogFilePath(agent_id, kind, date)

	await fs.ensureDir(path.dirname(file_path))
	await fs.appendFile(file_path, JSON.stringify(entry) + '\n', 'utf8')
}

const readAvailableDates = async (log_dir: string) => {
	if (!(await fs.pathExists(log_dir))) {
		return [] as Array<string>
	}

	const files = await fs.readdir(log_dir)

	return files
		.map(file_name => file_name.match(log_file_regex)?.[1] || '')
		.filter(Boolean)
		.sort((a, b) => b.localeCompare(a))
}

const readLogItems = async <T>(file_path: string) => {
	if (!(await fs.pathExists(file_path))) {
		return [] as Array<T>
	}

	const content = await fs.readFile(file_path, 'utf8')

	return content
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean)
		.reduce((total, line) => {
			try {
				total.push(JSON.parse(line) as T)
			} catch {}

			return total
		}, [] as Array<T>)
		.reverse()
}

export const appendAgentToolLog = async (args: {
	agent_id?: string | null
	input: unknown
	output: unknown
	session_id: string
	status: AgentLogStatus
	tool_name: string
}) => {
	const entry: AgentToolLogEntry = {
		created_at: Date.now(),
		tool_name: args.tool_name,
		session_id: args.session_id,
		status: args.status,
		input: sanitizeLogValue(args.input),
		output: sanitizeLogValue(args.output)
	}

	await appendAgentLog({
		agent_id: args.agent_id,
		kind: 'tools',
		entry
	})
}

export const appendAgentSkillLog = async (args: {
	action: string
	agent_id?: string | null
	input: unknown
	output: unknown
	session_id: string
	skill_name?: string
	status: AgentLogStatus
}) => {
	const entry: AgentSkillLogEntry = {
		created_at: Date.now(),
		action: args.action,
		skill_name: args.skill_name || '',
		session_id: args.session_id,
		status: args.status,
		input: sanitizeLogValue(args.input),
		output: sanitizeLogValue(args.output)
	}

	await appendAgentLog({
		agent_id: args.agent_id,
		kind: 'skills',
		entry
	})
}

export const readAgentLogPage = async <T>(args: {
	agent_id: string
	date?: string
	kind: AgentLogKind
	page: number
}) => {
	const log_dir = getLogDirPath(args.agent_id, args.kind)
	const available_dates = await readAvailableDates(log_dir)
	const date = args.date || available_dates[0] || dayjs().format('YYYY-MM-DD')
	const items = await readLogItems<T>(getLogFilePath(args.agent_id, args.kind, date))
	const offset = (args.page - 1) * agent_log_page_size

	return {
		available_dates,
		date,
		has_more: offset + agent_log_page_size < items.length,
		items: items.slice(offset, offset + agent_log_page_size),
		page: args.page,
		page_size: agent_log_page_size,
		total: items.length
	}
}
