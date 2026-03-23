import { r } from '../utils/trpc'
import file from './file'
import provider from './provider'
import remove from './remove'
import save from './save'
import search from './search'
import session from './session'
import setTask from './setTask'
import test from './test'
import update from './update'
import watchTasks from './watchTasks'

export const router = r({
	file,
	provider,
	save,
	search,
	test,
	watchTasks,
	setTask,
	update,
	remove,
	session
})

export type Router = typeof router
