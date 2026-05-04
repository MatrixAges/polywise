import { useEffect, useState } from 'react'
import dayjs from 'dayjs'

import { getDurationTime } from '@/utils'

export const useRuningTime = (running_since: Date | null | undefined) => {
	const [running_time, setRuningTime] = useState<number>(0)

	useEffect(() => {
		if (!running_since) return

		const timer = setInterval(() => {
			setRuningTime(Date.now() - dayjs(running_since).valueOf())
		}, 1000)

		return () => clearInterval(timer)
	}, [running_since])

	return running_time > 0 ? getDurationTime(running_time) : ''
}
