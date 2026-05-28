import type { GroupStateData } from '../types'

export default (): GroupStateData => ({
	archived_at: null,
	active_turn_id: null,
	write_lock: {
		agent_id: null,
		agent_name: null,
		acquired_at: null,
		reason: null
	},
	barrier: null,
	reply_queue: []
})
