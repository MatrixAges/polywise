import { project_session } from '@core/db/schema'
import { getSessionProject } from '@core/db/services'
import { eq } from 'drizzle-orm'

import type Index from '../index'

export default async (s: Index) => {
	const res = await getSessionProject({
		where: eq(project_session.session_id, s.id)
	})

	s.project = res[0]?.project ?? null
}
