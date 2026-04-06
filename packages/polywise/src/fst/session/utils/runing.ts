import type Index from '../index'

export default async (s: Index, v: boolean) => {
	s.session.is_runing = v

	await s.updateSession({ is_runing: v })
}
