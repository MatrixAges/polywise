import readSkillMap from './read'

import type Session from '../../session'

export default async (s: Session) => {
	return readSkillMap(s)
}
