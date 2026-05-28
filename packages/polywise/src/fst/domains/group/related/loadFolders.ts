import { group } from '@core/db/schema'
import { getGroup } from '@core/db/services'
import { eq } from 'drizzle-orm'

import type Session from '../../../session'

export default async (s: Session) => {
	const next = await getGroup(eq(group.id, s.group_id))

	if (next) {
		s.group = next
	}

	s.folders = s.group?.folders ?? []

	return s.folders
}
