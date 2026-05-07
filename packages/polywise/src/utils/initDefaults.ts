import path from 'path'
import { app } from '@core/consts'
import { preset_providers } from '@core/consts/providers'
import defaultSkillCreator from '@core/fst/agents/skill_creator/defaultSkill'
import { ensureWithValue } from '@core/utils'
import fs from 'fs-extra'

import { cron_path } from '../consts/app'

import type { AppConfig, ProviderConfig } from '@core/types'

const configs = ['config', 'providers']

export default async () => {
	for await (const name of configs) {
		const config_path = path.resolve(`${app.app_path}/${name}.json`)

		if (name === 'config') {
			const preset = preset_providers[0]
			const default_model = { provider: preset.name, model: preset.models[0].id }

			await ensureWithValue(config_path, {
				workspaces: [{ name: 'Default' }],
				current_workspace: 'Default',
				default_model,
				jina_api_key: '',
				mcp: { enabled: true },
				enable_triple: false,
				triple_model: default_model,
				enable_rewrite: false,
				rewrite_model: default_model
			} as AppConfig)
		}

		if (name === 'providers') {
			await ensureWithValue(config_path, { providers: preset_providers } as ProviderConfig)
		}
	}

	const skills_dir = path.resolve(app.app_path, 'skills')
	const tools_dir = path.resolve(app.app_path, 'tools')
	const patch_dir = path.resolve(app.app_path, 'patch')
	const cron_logs_dir = path.resolve(app.app_path, '.logs/cron')
	const skill_creator_dir = path.resolve(skills_dir, 'skill-creator')
	const skill_creator_path = path.resolve(skill_creator_dir, 'SKILL.md')

	await fs.ensureDir(skills_dir)
	await fs.ensureDir(tools_dir)
	await fs.ensureDir(patch_dir)
	await fs.ensureDir(cron_logs_dir)
	await fs.ensureDir(skill_creator_dir)

	if (!(await fs.pathExists(skill_creator_path))) {
		await fs.writeFile(skill_creator_path, defaultSkillCreator, 'utf8')
	}

	await ensureWithValue(cron_path, {
		version: 1,
		tasks: []
	})
}
