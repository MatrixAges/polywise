import fs from 'fs-extra'

import type Index from '../index'

export default async (s: Index) => {
	await fs.writeJSON(
		s.state_dir,
		{
			archived_at: s.archived_at,
			running_since: s.running_since
		},
		{ spaces: 4 }
	)
}
