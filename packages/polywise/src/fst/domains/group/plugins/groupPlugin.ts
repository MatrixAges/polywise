import path from 'path'
import { app } from '@core/consts'

import defaultSync from '../../../session/caps/sync/defaultSync'
import groupExec from '../exec/groupExec'
import buildMemberPrompt from '../hooks/buildMemberPrompt'
import buildMemberTools from '../hooks/buildMemberTools'
import initGroupRuntime from '../hooks/initGroupRuntime'
import getGroupAgents from '../related/getGroupAgents'
import loadFolders from '../related/loadFolders'
import clearGroupTasks from '../store/clearGroupTasks'
import getGroupContext from '../store/getGroupContext'
import getGroupState from '../store/getGroupState'
import getGroupTasks from '../store/getGroupTasks'
import setGroupContext from '../store/setGroupContext'
import setGroupState from '../store/setGroupState'
import setGroupTasks from '../store/setGroupTasks'
import getGroupPayload from '../sync/getGroupPayload'
import getHydratedUiMessages from '../sync/getHydratedUiMessages'
import slugifyMount from '../utils/slugifyMount'

import type { EnvCap, Plugin, RelCap, StoreCap, SyncCap } from '../../../session/core/types'

const envCap: EnvCap = {
	scope: s => ({ type: 'group', id: s.group_id }),
	cwd: s => s.folders[0]?.path || s.project?.dir || s.files_dir,
	mounts: s => {
		if (!s.folders.length) {
			return []
		}

		const used = new Set<string>()

		return s.folders.slice(1).map((folder, index) => {
			const base = slugifyMount(folder.name || path.basename(folder.path) || `folder-${index + 2}`)
			let mountPoint = `/folders/${base}`
			let suffix = 2

			while (used.has(mountPoint)) {
				mountPoint = `/folders/${base}-${suffix}`
				suffix += 1
			}

			used.add(mountPoint)

			return {
				mountPoint,
				path: folder.path
			}
		})
	},
	contextDir: s => path.resolve(`${app.app_path}/groups/${s.group_id}/context.json`),
	stateDir: s => path.resolve(`${app.app_path}/groups/${s.group_id}/state.json`),
	contextHistoryDir: s => path.resolve(`${app.app_path}/groups/${s.group_id}/context_history`),
	hasTodoLink: async () => false
}

const storeCap: StoreCap = {
	getContext: getGroupContext as StoreCap['getContext'],
	setContext: setGroupContext as StoreCap['setContext'],
	getTasks: getGroupTasks as StoreCap['getTasks'],
	setTasks: setGroupTasks as StoreCap['setTasks'],
	clearTasks: clearGroupTasks as StoreCap['clearTasks'],
	getState: getGroupState as StoreCap['getState'],
	setState: setGroupState as StoreCap['setState']
}

const relCap: RelCap = {
	getAgents: getGroupAgents as RelCap['getAgents'],
	getOwnerAgent: async s => {
		s.owner_agent = null
	},
	getFolders: loadFolders
}

const syncCap: SyncCap = {
	getData: async s => ({
		...(await defaultSync.getData(s)),
		messages: getHydratedUiMessages(s) as any,
		group: getGroupPayload(s)
	})
}

const plugin: Plugin = {
	name: 'group',
	order: 20,
	match: d => d.tags.includes('group'),
	setup: () => ({
		name: 'group',
		env: envCap,
		store: storeCap,
		rel: relCap,
		sync: syncCap,
		exec: groupExec,
		hooks: {
			onInit: [initGroupRuntime],
			onMemberTools: [buildMemberTools],
			onMemberPrompt: [buildMemberPrompt]
		}
	})
}

export default plugin
