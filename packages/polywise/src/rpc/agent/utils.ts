import path from 'path'
import { app } from '@core/consts'
import fs from 'fs-extra'

import ensureArray from '../../utils/ensureArray'

export interface AgentSessionPinItem {
	id: string
	pin_at: number
}

export const getAgentDirPath = (agent_id: string) => path.resolve(app.agents_path, agent_id)
export const getAgentPinPath = (agent_id: string) => path.resolve(getAgentDirPath(agent_id), 'pin.json')
export const getAgentLogDirPath = (agent_id: string) => path.resolve(getAgentDirPath(agent_id), '.logs')
export const getAgentToolLogDirPath = (agent_id: string) => path.resolve(getAgentLogDirPath(agent_id), 'tools')
export const getAgentSkillLogDirPath = (agent_id: string) => path.resolve(getAgentLogDirPath(agent_id), 'skills')

const normalizePinList = (value: unknown) => {
	const now = Date.now()

	return ensureArray<unknown>(value)
		.map(item => {
			if (typeof item === 'string') {
				return {
					id: item,
					pin_at: now
				}
			}

			if (!item || typeof item !== 'object') {
				return null
			}

			const target = item as Record<string, unknown>
			const id = typeof target.id === 'string' ? target.id : ''
			const pin_at = typeof target.pin_at === 'number' ? target.pin_at : now

			if (!id) {
				return null
			}

			return { id, pin_at }
		})
		.filter((item): item is AgentSessionPinItem => item !== null)
}

export const readPinList = async (agent_id: string) => {
	const pin_path = getAgentPinPath(agent_id)

	try {
		const raw = await fs.readJson(pin_path, { throws: false })

		return normalizePinList(raw)
	} catch (error) {
		const parsed_error = error as NodeJS.ErrnoException

		if (parsed_error.code === 'ENOENT') {
			await fs.ensureDir(path.dirname(pin_path))
			await fs.writeJson(pin_path, [], { spaces: 4 })

			return []
		}

		return []
	}
}

export const writePinList = async (args: { agent_id: string; pin_list: Array<AgentSessionPinItem> }) => {
	const { agent_id, pin_list } = args
	const pin_map = new Map<string, AgentSessionPinItem>()

	pin_list.forEach(item => {
		pin_map.set(item.id, item)
	})

	await fs.writeJson(getAgentPinPath(agent_id), Array.from(pin_map.values()), { spaces: 4 })
}
