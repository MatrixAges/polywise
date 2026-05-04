import { useEffect, useState } from 'react'
import dayjs from 'dayjs'

import { getDurationTime } from '@/utils'

export const useRuningTime = (
	is_running: boolean,
	running_since: Date | null | undefined,
	running_done: Date | null | undefined
) => {
	const [running_time, setRuningTime] = useState<number>(0)

	useEffect(() => {
		if (!running_since) return
		if (!is_running) return setRuningTime(dayjs(running_done).valueOf() - dayjs(running_since).valueOf())

		const timer = setInterval(() => {
			setRuningTime(Date.now() - dayjs(running_since).valueOf())
		}, 1000)

		return () => clearInterval(timer)
	}, [is_running, running_since, running_done])

	return running_time > 0 ? getDurationTime(running_time) : ''
}
