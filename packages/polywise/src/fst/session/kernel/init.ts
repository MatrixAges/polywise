import fs from 'fs-extra'

import runHooks from '../hooks/runHooks'

import type { InitArgs } from '../../types'
import type Session from '../index'

export default async (s: Session, args: InitArgs & { group_id?: string }) => {
	const { id, event, is_cron, title } = args

	s.id = id
	s.event = event

	await runHooks(s, 'onInit', {
		args,
		phase: 'before'
	})

	await fs.ensureDir(s.session_dir)
	await fs.ensureDir(s.files_dir)
	await s.initSession(is_cron, title)
	await s.getOwnerAgent()
	await s.updateConfig()
	await s.getAgents()
	await s.loadSkillMap()
	await s.loadCustomToolsMap()

	if (s.caps.rel.getFolders) {
		await s.caps.rel.getFolders(s)
	}

	await runHooks(s, 'onInit', {
		args,
		phase: 'after'
	})

	return s.getData()
}
