import { r } from '../utils/trpc'
import file from './file'
import heartbeat from './heartbeat'
import llama from './llama'
import provider from './provider'
import remove from './remove'
import save from './save'
import search from './search'
import session from './session'
import setActive from './setActive'
import setTask from './setTask'
import test from './test'
import update from './update'
import watchTasks from './watchTasks'

export const router = r({
	file,
	session,
	provider,
	llama,

	heartbeat,
	save,
	search,
	setActive,
	test,
	watchTasks,
	setTask,
	update,
	remove
})

export type Router = typeof router
