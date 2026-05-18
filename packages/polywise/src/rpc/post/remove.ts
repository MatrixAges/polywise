import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { removePostById } from './utils'

export default p.input(object({ id: string() })).mutation(async ({ input }) => {
	const post = await removePostById(input.id)

	if (!post) {
		return { ok: true }
	}

	return { ok: true }
})
