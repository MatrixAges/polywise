import type Index from '../index'

export default (s: Index) => {
	s.update_at = Date.now()
}
