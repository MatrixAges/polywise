import { session } from '@core/db/schema'
import { getSessions } from '@core/db/services'
import { desc, notInArray } from 'drizzle-orm'
import { number, object } from 'zod'

import { p } from '../../utils/trpc'
import { readGroupList } from './utils'

const input_type = object({ page: number().int().min(0) })

const session_page_size = 10

export default p.input(input_type).query(async ({ input }) => {
	const group_list = await readGroupList()
	const group_session_id_list = group_list.flatMap(item => item.items)

	return getSessions({
		where: group_session_id_list.length ? notInArray(session.id, group_session_id_list) : undefined,
		orderBy: desc(session.created_at),
		limit: session_page_size,
		offset: input.page * session_page_size
	})
})
