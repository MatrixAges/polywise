import type Index from '../index'

export default (s: Index) => {
	s.model_messages = s.model_messages.slice(4)
	s.ui_older_locked_by_archive = false
}
