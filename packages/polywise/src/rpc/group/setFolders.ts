import { group } from '@core/db/schema'
import { getGroup, setGroup } from '@core/db/services'
import { eq } from 'drizzle-orm'
import { array, object, string } from 'zod'

import { p } from '../../utils/trpc'

const folder_item_schema = object({
	name: string(),
	path: string()
})

const input_type = object({
	id: string(),
	folders: array(folder_item_schema)
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/group/setFolders',
			description: 'Replace the workspace folders mounted for a group.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		await setGroup(eq(group.id, input.id), {
			folders: input.folders
		})

		return getGroup(eq(group.id, input.id))
	})
