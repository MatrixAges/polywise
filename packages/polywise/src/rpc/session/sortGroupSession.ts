import { number, object } from 'zod'

import arrayMove from '../../utils/arrayMove'
import { p } from '../../utils/trpc'
import { readGroupList, writeGroupList } from './utils'

const input_type = object({
	group_index: number().int().min(0),
	from: number().int().min(0),
	to: number().int().min(0)
})

export default p.input(input_type).mutation(async ({ input }) => {
	const group_list = await readGroupList()
	const target_group = group_list[input.group_index]

	if (!target_group || input.to > target_group.items.length - 1 || !target_group.items[input.from]) {
		return null
	}

	const next_group_list = group_list.map((item, index) => {
		if (index !== input.group_index) {
			return item
		}

		return {
			...item,
			items: arrayMove({ list: item.items, from: input.from, to: input.to }),
			updated_at: Date.now()
		}
	})

	await writeGroupList(next_group_list)

	return next_group_list
})
