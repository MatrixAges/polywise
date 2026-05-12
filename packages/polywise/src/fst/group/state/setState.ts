import fs from 'fs-extra'

import type Group from '../index'

export default async (s: Group) => {
	await fs.writeJSON(
		s.state_dir,
		{
			archived_at: s.archived_at,
			active_turn_id: s.active_turn_id,
			write_lock: s.write_lock,
			barrier: s.barrier
		},
		{ spaces: 4 }
	)
}
