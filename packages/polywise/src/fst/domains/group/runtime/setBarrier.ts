import type Session from '../../../session'
import type { GroupBarrierState } from '../types'

export default async (s: Session, barrier: GroupBarrierState | null) => {
	s.barrier = barrier

	await s.setState()
	s.sync()
}
