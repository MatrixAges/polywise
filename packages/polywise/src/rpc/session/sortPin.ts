import { number, object } from 'zod'

import { arrayMove } from '../../utils'
import { p } from '../../utils/trpc'
import { readPinList, writePinList } from './utils'

const input_type = object({ from: number().int(), to: number().int() })

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/session/sortPin',
			description: 'Run Sort Pin'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const pin_list = await readPinList()

		if (!pin_list[input.from] || input.to < 0 || input.to > pin_list.length - 1) {
			return pin_list
		}

		const next_pin_list = arrayMove({ list: pin_list, from: input.from, to: input.to }).map((item, index) => ({
			...item,
			pin_at: Date.now() - index
		}))

		await writePinList(next_pin_list)

		return next_pin_list
	})
