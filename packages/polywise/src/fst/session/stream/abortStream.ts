import { syncTodoSessionStatusBySessionId } from '@core/db/services'

import type Index from '../index'

export default async (s: Index) => {
	s.manual_abort = true

	await s.runing(false)
	await syncTodoSessionStatusBySessionId({
		session_id: s.id,
		from_status_list: ['processing'],
		to_status: 'canceled'
	})

	s.abort_controller.abort()
}
