import { streams } from './streams'
import { stopTimer } from './timer'

export default (session_id: string) => {
	streams.delete(session_id)

	if (streams.size === 0) {
		stopTimer()
	}
}
