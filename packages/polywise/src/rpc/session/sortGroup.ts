import { number, object } from 'zod'

import arrayMove from '../../utils/arrayMove'
import { p } from '../../utils/trpc'
import { readGroupList, writeGroupList } from './utils'

const input_type = object({ from: number().int().min(0), to: number().int().min(0) })

export default p.input(input_type).mutation(async ({ input }) => {
	const group_list = await readGroupList()

	if (!group_list[input.from] || input.to > group_list.length - 1) {
		return null
	}

	const next_group_list = arrayMove({ list: group_list, from: input.from, to: input.to })

	await writeGroupList(next_group_list)

	return next_group_list
})
