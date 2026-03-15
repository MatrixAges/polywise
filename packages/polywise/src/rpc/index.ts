import { r } from '../utils/trpc'
import save from './save'
import test from './test'

export const router = r({
	test,
	save
})

export type Router = typeof router
