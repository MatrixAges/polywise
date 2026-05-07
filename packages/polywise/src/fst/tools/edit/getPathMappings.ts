import type Session from '../../session'

export default (s: Session) => {
	const path_mappings = {} as Record<string, string>

	if (s.skills_dir) {
		path_mappings['/skills'] = s.skills_dir
	}

	return path_mappings
}
