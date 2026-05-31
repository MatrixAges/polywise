import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { importAgentPack } from './pack'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/importPack',
			summary: 'Import agent pack',
			description:
				'Import an exported agent pack from a local archive path and recreate the agent with its packaged assets.'
		}
	})
	.input(
		object({
			file_path: string()
		})
	)
	.mutation(async ({ input }) => importAgentPack(input.file_path))
