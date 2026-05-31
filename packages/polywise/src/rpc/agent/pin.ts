import { boolean, object, string } from 'zod'

import { p } from '../../utils/trpc'
import { readPinList, writePinList } from './utils'

const input_type = object({
	agent_id: string(),
	id: string(),
	value: boolean()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/pin',
			description: 'Set the pinned state of one session inside an agent-specific session list.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const pin_list = await readPinList(input.agent_id)
		const next_pin_list = input.value
			? [
					{
						id: input.id,
						pin_at: Date.now()
					},
					...pin_list.filter(item => item.id !== input.id)
				]
			: pin_list.filter(item => item.id !== input.id)

		await writePinList({ agent_id: input.agent_id, pin_list: next_pin_list })

		return await readPinList(input.agent_id)
	})
