import defaultEnv from '../caps/env/defaultEnv'
import defaultExec from '../caps/exec/defaultExec'
import defaultStore from '../caps/store/defaultStore'
import defaultSync from '../caps/sync/defaultSync'
import applyCap from './applyCap'
import resolveHooks from './resolveHooks'

import type Session from '../index'
import type { PluginSetup } from './types'

export default (s: Session, items: Array<PluginSetup>) => {
	s.caps = {
		env: defaultEnv,
		store: defaultStore,
		rel: {
			getAgents: s.getAgentsBase,
			getOwnerAgent: s.getOwnerAgentBase
		},
		sync: defaultSync,
		exec: defaultExec
	}
	const used = new Map()

	for (const item of items) {
		applyCap(s.caps, 'env', item.env, item.name, used)
		applyCap(s.caps, 'store', item.store, item.name, used)
		applyCap(s.caps, 'rel', item.rel, item.name, used)
		applyCap(s.caps, 'sync', item.sync, item.name, used)
		applyCap(s.caps, 'exec', item.exec, item.name, used)
	}

	s.hooks = resolveHooks(items)
}
