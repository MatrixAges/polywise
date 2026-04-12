import type Index from '../index'

export interface StreamInfo {
	session: Index
	start_time: number
	last_check_time: number
	message: any
}
