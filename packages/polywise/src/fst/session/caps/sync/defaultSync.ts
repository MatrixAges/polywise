import type { ChatEventRes } from '../../../types'
import type { SyncCap } from '../../core/types'

const defaultSync: SyncCap = {
	getData: async s =>
		({
			session: s.session,
			messages: s.ui_messages,
			context: s.context,
			archived_at: s.archived_at,
			has_older: s.ui_has_older,
			has_newer: s.ui_has_newer,
			permission: s.permission,
			mode: s.mode,
			audit_mode: s.audit_mode,
			runtime_config: {
				disable_map: s.disable_map,
				mode: s.mode,
				audit_mode: s.audit_mode,
				enable_sub_agent: s.enable_sub_agent,
				sub_agent_keys: s.sub_agent_keys,
				enable_agent_tool: s.enable_agent_tool,
				agent_ids: s.agent_ids
			}
		}) satisfies ChatEventRes['data']
}

export default defaultSync
