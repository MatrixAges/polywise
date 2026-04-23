import { object, string } from 'zod'

import { addTodo } from '../../db/services'
import { addProjectTodo } from '../../db/services/externals/project_todo'
import { p } from '../../utils/trpc'

const input_type = object({ project_id: string(), title: string() })

export default p.input(input_type).mutation(async ({ input }) => {
	const todo = await addTodo({
		title: input.title,
		description: null,
		status: 'draft',
		order: Date.now()
	})

	if (!todo) {
		return null
	}

	await addProjectTodo(input.project_id, todo.id)

	return todo
})
