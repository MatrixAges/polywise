import { r } from '../utils/trpc'
import test from './test'

export const router = r({
	test
})

export type Router = typeof router
