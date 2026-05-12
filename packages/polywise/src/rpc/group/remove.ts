import path from 'path'
import { app } from '@core/consts'
import { group } from '@core/db/schema'
import { removeGroup } from '@core/db/services'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'
import { string } from 'zod'

import { p } from '../../utils/trpc'

export default p.input(string()).mutation(async ({ input }) => {
	const removed = await removeGroup(eq(group.id, input))

	if (removed) {
		await fs.remove(path.resolve(app.app_path, 'groups', input))
	}

	return removed
})
