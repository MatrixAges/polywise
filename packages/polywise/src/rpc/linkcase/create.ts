import { addLink } from '@core/db/services'
import { object, string, unknown, url } from 'zod'

import { p } from '../../utils/trpc'

const input_type = object({
	url: url(),
	title: string().optional(),
	favicon: unknown().optional()
})

export default p.input(input_type).mutation(async ({ input }) => {
	const title = input.title?.trim() || input.url

	return addLink({
		url: input.url,
		title,
		favicon: (input.favicon as Uint8Array | ArrayBuffer | null | undefined) ?? undefined
	})
})
