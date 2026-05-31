import { boolean, enum as Enum, number, object, string } from 'zod'

import { p } from '../../utils/trpc'
import { linkcase_schedule_interval_units, updateLinkcaseSchedule } from './scheduler'

const input_type = object({
	id: string(),
	enabled: boolean().optional(),
	count: number().int().min(1).max(10).optional(),
	interval_value: number().int().min(1).optional(),
	interval_unit: Enum(linkcase_schedule_interval_units).optional(),
	auto_remove_dead_links: boolean().optional(),
	extract_concurrency: number().int().min(1).max(10).optional()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/linkcase/updateSchedule',
			description: 'Run Update Schedule'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const { id, ...rest } = input

		return updateLinkcaseSchedule(id, rest)
	})
