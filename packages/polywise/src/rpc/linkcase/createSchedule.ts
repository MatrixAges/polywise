import { boolean, enum as Enum, number, object } from 'zod'

import { p } from '../../utils/trpc'
import { createLinkcaseSchedule, linkcase_schedule_actions, linkcase_schedule_interval_units } from './scheduler'

const input_type = object({
	action: Enum(linkcase_schedule_actions),
	interval_value: number().int().min(1),
	interval_unit: Enum(linkcase_schedule_interval_units),
	count: number().int().min(1).max(10),
	auto_remove_dead_links: boolean()
})

export default p.input(input_type).mutation(async ({ input }) => createLinkcaseSchedule(input))
