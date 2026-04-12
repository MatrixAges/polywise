import type Index from '../index'

export default (s: Index) => {
	s.abort_controller = new AbortController()
}
