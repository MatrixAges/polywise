import type Index from '../../session'

export interface StreamInfo {
	session: Index
	start_time: number
	last_check_time: number
	message: any
	recent_parts: Array<string>
	chaos_detected: boolean
}
