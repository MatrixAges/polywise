import fs from 'fs-extra'

import type Session from '../../../session'

export default async (s: Session) => {
	await fs.writeJSON(
		s.state_dir,
		{
			archived_at: s.archived_at,
			active_turn_id: s.active_turn_id,
			write_lock: s.write_lock,
			barrier: s.barrier,
			reply_queue: s.reply_queue
		},
		{ spaces: 4 }
	)
}
