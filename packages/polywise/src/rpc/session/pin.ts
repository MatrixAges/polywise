import { boolean, object, string } from 'zod'

import { p } from '../../utils/trpc'
import { readPinList, writePinList } from './utils'

const input_type = object({ id: string(), value: boolean() })

export default p.input(input_type).mutation(async ({ input }) => {
	const pin_list = await readPinList()
	const next_pin_list = input.value
		? [
				...pin_list.filter(item => item.id !== input.id),
				{
					id: input.id,
					pin_at: Date.now()
				}
			]
		: pin_list.filter(item => item.id !== input.id)

	await writePinList(next_pin_list)

	return await readPinList()
})
