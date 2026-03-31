import type Index from '../index'

export default async (s: Index) => {
	await s.runing(false)

	s.abort_controller.abort()
}
