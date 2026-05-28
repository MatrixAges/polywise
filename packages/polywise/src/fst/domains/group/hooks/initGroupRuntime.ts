import path from 'path'
import { app } from '@core/consts'
import { group, group_session } from '@core/db/schema'
import { getGroup, getSessionGroup } from '@core/db/services'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'

import loadFolders from '../related/loadFolders'
import getDefaultGroupState from '../store/getDefaultGroupState'

import type Session from '../../../session'
import type { InitState } from '../../../session/core/types'

export default async (runtime: Session, state: InitState) => {
	if (state.phase !== 'before') {
		return state
	}

	runtime.group_id = state.args.group_id || runtime.descriptor.groupId || ''

	if (!runtime.group_id) {
		const relation = await getSessionGroup(eq(group_session.session_id, runtime.id))

		if (!relation) {
			throw new Error(`Group session relation not found for session ${runtime.id}`)
		}

		runtime.group_id = relation.group.id
	}

	const target = await getGroup(eq(group.id, runtime.group_id))

	if (!target) {
		throw new Error(`Group ${runtime.group_id} not found`)
	}

	runtime.group = target

	const defaultState = getDefaultGroupState()
	runtime.write_lock = { ...defaultState.write_lock }
	runtime.barrier = null
	runtime.reply_queue = []
	runtime.active_turn_id = null

	await loadFolders(runtime)
	await fs.ensureDir(path.resolve(`${app.app_path}/groups/${runtime.group_id}`))
	await fs.ensureDir(runtime.context_history_dir)

	return state
}
