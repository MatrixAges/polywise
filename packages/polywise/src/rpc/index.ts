import { r } from '../utils/trpc'
import agent from './agent'
import article from './article'
import auth from './auth'
import file from './file'
import group from './group'
import heartbeat from './heartbeat'
import home from './home'
import im from './im'
import linkcase from './linkcase'
import llama from './llama'
import notification from './notification'
import oauthProvider from './oauthProvider'
import pipeline from './pipeline'
import post from './post'
import project from './project'
import provider from './provider'
import remove from './remove'
import report from './report'
import restart from './restart'
import save from './save'
import search from './search'
import session from './session'
import setActive from './setActive'
import skill from './skill'
import sniffer from './sniffer'
import stop from './stop'
import test from './test'
import todo from './todo'
import tool from './tool'
import update from './update'
import upgrade from './upgrade'
import version from './version'

import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

export const router = r({
	auth,
	agent,
	article,
	group,
	home,
	im,
	file,
	linkcase,
	post,
	project,
	skill,
	tool,
	todo,
	session,
	sniffer,
	provider,
	report,
	pipeline,
	notification,
	oauthProvider,
	llama,
	heartbeat,
	search,
	save,
	stop,
	restart,
	upgrade,
	setActive,
	test,
	update,
	remove,
	version
})

export type Router = typeof router
export type RouterInputs = inferRouterInputs<Router>
export type RouterOutputs = inferRouterOutputs<Router>
