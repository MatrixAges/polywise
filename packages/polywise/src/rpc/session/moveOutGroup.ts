import { number, object, string } from 'zod'

import { p } from '../../utils/trpc'
import { readGroupList, writeGroupList } from './utils'

const input_type = object({ id: string(), group_index: number().int().min(0) })

export default p.input(input_type).mutation(async ({ input }) => {
	const group_list = await readGroupList()
	const target_group = group_list[input.group_index]

	if (!target_group) {
		return null
	}

	const next_group_list = group_list.map((item, index) => {
		if (index !== input.group_index) {
			return item
		}

		return {
			...item,
			items: item.items.filter(session_id => session_id !== input.id),
			updated_at: Date.now()
		}
	})

	await writeGroupList(next_group_list)

	return next_group_list
})
