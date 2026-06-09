import path from 'path'
import { app } from '@core/consts'
import fs from 'fs-extra'

import { normalizeAgentTools } from './agentTool'

export interface AgentSkillBinding {
	skill_id: string
	enabled: boolean
}

export interface AgentRuntimeConfig {
	tools: Array<ReturnType<typeof normalizeAgentTools>[number]>
	skills: Array<AgentSkillBinding>
}

export interface AgentRuntimeConfigState {
	exists: boolean
	has_skills: boolean
	has_tools: boolean
	config: AgentRuntimeConfig
}

const default_agent_runtime_config: AgentRuntimeConfig = {
	tools: [],
	skills: []
}

const normalizeAgentSkillBindings = (value: unknown) => {
	if (!Array.isArray(value)) {
		return [] as Array<AgentSkillBinding>
	}

	const binding_map = new Map<string, AgentSkillBinding>()

	for (const item of value) {
		if (!item || typeof item !== 'object' || Array.isArray(item)) {
			continue
		}

		const target = item as Record<string, unknown>
		const skill_id = typeof target.skill_id === 'string' ? target.skill_id.trim() : ''

		if (!skill_id) {
			continue
		}

		binding_map.set(skill_id, {
			skill_id,
			enabled: target.enabled !== false
		})
	}

	return Array.from(binding_map.values())
}

const normalizeAgentRuntimeConfig = (value: unknown): AgentRuntimeConfig => {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return default_agent_runtime_config
	}

	const target = value as Record<string, unknown>

	return {
		tools: normalizeAgentTools(target.tools),
		skills: normalizeAgentSkillBindings(target.skills)
	}
}

export const getAgentConfigPath = (agent_id: string) => path.resolve(app.agents_path, agent_id, 'config.json')

export const readAgentRuntimeConfig = async (agent_id: string): Promise<AgentRuntimeConfigState> => {
	const config_path = getAgentConfigPath(agent_id)
	const exists = await fs.pathExists(config_path)

	if (!exists) {
		return {
			exists: false,
			has_skills: false,
			has_tools: false,
			config: default_agent_runtime_config
		}
	}

	const raw = await fs.readJson(config_path, { throws: false })
	const target = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}

	return {
		exists: true,
		has_skills: Object.prototype.hasOwnProperty.call(target, 'skills'),
		has_tools: Object.prototype.hasOwnProperty.call(target, 'tools'),
		config: normalizeAgentRuntimeConfig(target)
	}
}

export const writeAgentRuntimeConfig = async (args: { agent_id: string; config: AgentRuntimeConfig }) => {
	const { agent_id, config } = args
	const config_path = getAgentConfigPath(agent_id)

	await fs.ensureDir(path.dirname(config_path))
	await fs.writeJson(config_path, config, { spaces: 4 })

	return config
}

export const patchAgentRuntimeConfig = async (args: { agent_id: string; patch: Partial<AgentRuntimeConfig> }) => {
	const { agent_id, patch } = args
	const current = await readAgentRuntimeConfig(agent_id)
	const next = normalizeAgentRuntimeConfig({
		...current.config,
		...(Object.prototype.hasOwnProperty.call(patch, 'tools') ? { tools: patch.tools } : {}),
		...(Object.prototype.hasOwnProperty.call(patch, 'skills') ? { skills: patch.skills } : {})
	})

	return writeAgentRuntimeConfig({ agent_id, config: next })
}

export { normalizeAgentRuntimeConfig, normalizeAgentSkillBindings }
