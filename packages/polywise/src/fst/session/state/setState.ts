import fs from 'fs-extra'

import type Index from '../index'

export default async (s: Index) => {
	await fs.writeJSON(
		s.state_dir,
		{
			archived_at: s.archived_at
		},
		{ spaces: 4 }
	)
}
