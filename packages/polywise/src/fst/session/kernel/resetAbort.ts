import type Session from '../index'

export default (s: Session) => {
	s.abort_controller = new AbortController()
}
