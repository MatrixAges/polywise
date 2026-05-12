import { group_folder } from '@core/db/schema'
import { addGroupFolder, getGroupFolders, removeGroupFolder, setGroupFolder } from '@core/db/services'
import { and, eq } from 'drizzle-orm'
import { array, object, string } from 'zod'

import { p } from '../../utils/trpc'

const input_type = object({
	id: string(),
	folder_paths: array(string())
})

export default p.input(input_type).mutation(async ({ input }) => {
	const current = await getGroupFolders({
		where: eq(group_folder.group_id, input.id)
	})

	const current_map = new Map(current.map(item => [item.path, item]))
	const next_paths = new Set(input.folder_paths)

	for (const item of current) {
		if (!next_paths.has(item.path)) {
			await removeGroupFolder(and(eq(group_folder.group_id, input.id), eq(group_folder.path, item.path))!)
		}
	}

	for (const [index, folder_path] of input.folder_paths.entries()) {
		const existing = current_map.get(folder_path)

		if (existing) {
			await setGroupFolder(and(eq(group_folder.group_id, input.id), eq(group_folder.path, folder_path))!, {
				order: index
			})
		} else {
			await addGroupFolder(input.id, folder_path, index)
		}
	}

	return getGroupFolders({
		where: eq(group_folder.group_id, input.id)
	})
})
