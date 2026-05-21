import { enum as Enum, number, object, string } from 'zod'

import { getLinks } from '../../db/services'
import { p } from '../../utils/trpc'
import { getLinkcaseWhere, hydrateLinkcaseItems, linkcase_filter_types } from './utils'

const page_size = 10

const input_type = object({
	page: number().int().min(1).default(1),
	keyword: string().optional(),
	filter_type: Enum(linkcase_filter_types).optional()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/linkcase/query',
			summary: 'Read Query'
		}
	})
	.input(input_type)
	.query(async ({ input }) => {
		const where = getLinkcaseWhere({ keyword: input.keyword, filter_type: input.filter_type })
		const rows = await getLinks({
			where,
			limit: page_size + 1,
			offset: (input.page - 1) * page_size
		})
		const has_more = rows.length > page_size
		const items = has_more ? rows.slice(0, page_size) : rows

		return {
			items: await hydrateLinkcaseItems(items),
			has_more
		}
	})
