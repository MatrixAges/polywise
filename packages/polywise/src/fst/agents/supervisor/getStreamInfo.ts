import { streams } from './streams'

export default (session_id: string) => {
	return streams.get(session_id)
}
