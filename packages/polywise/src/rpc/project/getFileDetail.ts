import { project } from '@core/db/schema'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { getProjects } from '../../db/services'
import { p } from '../../utils/trpc'
import readProjectFile from './utils/readProjectFile'

const input_type = object({ project_id: string(), file_path: string() })

export default p.input(input_type).query(async ({ input }) => {
	const projects = await getProjects({ where: eq(project.id, input.project_id) })
	const project_item = projects[0]

	return readProjectFile(project_item.dir, input.file_path)
})
