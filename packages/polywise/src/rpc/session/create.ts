import dayjs from 'dayjs'
import { object, string } from 'zod'

import { addSession } from '../../db/services'
import { p } from '../../utils/trpc'

const input_type = object({
	title: string().optional()
})

export default p.input(input_type).mutation(async ({ input }) => {
	const title = input.title || `Session ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`

	return addSession({ title })
})
