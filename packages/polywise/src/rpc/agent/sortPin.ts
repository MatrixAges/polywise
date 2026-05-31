import { number, object, string } from 'zod'

import { arrayMove } from '../../utils'
import { p } from '../../utils/trpc'
import { readPinList, writePinList } from './utils'

const input_type = object({
	agent_id: string(),
	from: number().int(),
	to: number().int()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/sortPin',
			description: 'Reorder the pinned sessions inside one agent-specific session list.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const pin_list = await readPinList(input.agent_id)

		if (!pin_list[input.from] || input.to < 0 || input.to > pin_list.length - 1) {
			return pin_list
		}

		const next_pin_list = arrayMove({ list: pin_list, from: input.from, to: input.to }).map((item, index) => ({
			...item,
			pin_at: Date.now() - index
		}))

		await writePinList({ agent_id: input.agent_id, pin_list: next_pin_list })

		return next_pin_list
	})
