import dayjs from 'dayjs'
import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { readGroupList, writeGroupList } from './utils'

const input_type = object({ name: string().optional() })

export default p.input(input_type).mutation(async ({ input }) => {
	const timestamp = Date.now()
	const group_list = await readGroupList()
	const name = input.name || `Group ${dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')}`
	const next_group_list = [
		...group_list,
		{
			name,
			created_at: timestamp,
			updated_at: timestamp,
			items: []
		}
	]

	await writeGroupList(next_group_list)

	return next_group_list
})
