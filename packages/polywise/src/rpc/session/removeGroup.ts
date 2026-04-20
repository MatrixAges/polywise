import { number, object } from 'zod'

import { p } from '../../utils/trpc'
import { readGroupList, writeGroupList } from './utils'

const input_type = object({ group_index: number().int().min(0) })

export default p.input(input_type).mutation(async ({ input }) => {
	const group_list = await readGroupList()

	if (!group_list[input.group_index]) {
		return null
	}

	const next_group_list = group_list.filter((_, index) => index !== input.group_index)

	await writeGroupList(next_group_list)

	return next_group_list
})
