import path from 'path'
import { app } from '@core/consts'
import { preset_providers } from '@core/consts/providers'
import defaultSkillCreator from '@core/fst/agents/skill_creator/defaultSkill'
import { default_fetch_fallback_chain } from '@core/types'
import { ensureWithValue } from '@core/utils'
import fs from 'fs-extra'

import { cron_path, pipeline_path, pthink_path, rewire_dir, temp_dir } from '../consts/app'

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
				page_bridge_enabled: false,
				prompt_full_inject: false,
				jina_api_key: '',
				bookmark_auto_clean: false,
				agent_export_dir: '',
				enbale_webfetch_chain: false,
				fetch_fallback_chain: [...default_fetch_fallback_chain],
				mcp: { enabled: true },
				enable_triple: false,
				triple_model: default_model,
				enable_rewrite: false,
				rewrite_model: default_model,
				rewire: {
					enabled: true,
					tick_ms: 120000,
					idle_grace_ms: 30 * 60 * 1000,
					replay_window_ms: 24 * 60 * 60 * 1000,
					max_groups_per_cycle: 20,
					max_edge_creations_per_cycle: 40,
					max_edge_prunes_per_cycle: 40,
					hot_node_degree_limit: 14,
					cold_node_degree_limit: 2,
					monitor_ms: 60000
				},
				pthink: {
					enabled: true,
					idle_grace_ms: 20 * 60 * 1000,
					review_cooldown_ms: 15 * 60 * 1000,
					min_messages: 60,
					max_messages: 60,
					max_articles_per_run: 4,
					skill_generation_enabled: true,
					tool_generation_enabled: true
				},
				report: {
					enabled: true,
					daily_enabled: true,
					daily_time: '21:00',
					weekly_enabled: false,
					weekly_weekday: 'sun',
					weekly_time: '21:00',
					monthly_enabled: false,
					monthly_mode: 'last_day',
					monthly_time: '21:00',
					yearly_enabled: false,
					yearly_mode: 'last_day',
					yearly_time: '21:00'
				},
				auth: {
					enabled: false
				}
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
	const pipeline_logs_dir = path.resolve(app.app_path, '.logs/pipeline')
	const skill_creator_dir = path.resolve(skills_dir, 'skill-creator')
	const skill_creator_path = path.resolve(skill_creator_dir, 'SKILL.md')

	await fs.ensureDir(skills_dir)
	await fs.ensureDir(tools_dir)
	await fs.ensureDir(patch_dir)
	await fs.ensureDir(temp_dir)
	await fs.ensureDir(cron_logs_dir)
	await fs.ensureDir(pipeline_logs_dir)
	await fs.ensureDir(rewire_dir)
	await fs.ensureDir(skill_creator_dir)

	if (!(await fs.pathExists(skill_creator_path))) {
		await fs.writeFile(skill_creator_path, defaultSkillCreator, 'utf8')
	}

	await ensureWithValue(cron_path, {
		version: 1,
		tasks: []
	})

	await ensureWithValue(pipeline_path, {})
	await ensureWithValue(pthink_path, {
		running: false,
		last_run_at: null,
		last_report_at: null,
		last_review_at: null,
		last_status: 'idle',
		last_error: null,
		last_reason: null,
		last_summary: null,
		boot_at: Date.now(),
		last_foreground_at: Date.now(),
		last_visit_at: Date.now(),
		report_history: [],
		trigger_last_fired: {}
	})
}
