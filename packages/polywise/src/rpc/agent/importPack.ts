import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { importAgentPack } from './pack'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/importPack',
			summary: 'Run Import Agent Pack'
		}
	})
	.input(
		object({
			file_path: string()
		})
	)
	.mutation(async ({ input }) => importAgentPack(input.file_path))
