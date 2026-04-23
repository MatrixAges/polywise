import { r } from '../utils/trpc'
import file from './file'
import heartbeat from './heartbeat'
import llama from './llama'
import project from './project'
import provider from './provider'
import remove from './remove'
import save from './save'
import search from './search'
import session from './session'
import setActive from './setActive'
import test from './test'
import update from './update'

export const router = r({
	file,
	project,
	session,
	provider,
	llama,

	heartbeat,
	save,
	search,
	setActive,
	test,
	update,
	remove
})

export type Router = typeof router
