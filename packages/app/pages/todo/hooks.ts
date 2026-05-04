import { useEffect, useRef, useState } from 'react'
import dayjs from 'dayjs'
import scrollIntoView from 'smooth-scroll-into-view-if-needed'

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

interface IUseAutoFocusArgs {
	selected: boolean
	status: string | undefined
	overlay?: boolean
}

export const useAutoFocus = (args: IUseAutoFocusArgs) => {
	const { selected, status, overlay = false } = args
	const ref_node = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		if (overlay) return
		if (!selected) return
		if (!status) return
		if (!ref_node.current) return

		scrollIntoView(ref_node.current, {
			behavior: 'smooth',
			block: 'center',
			inline: 'center'
		})
	}, [overlay, selected, status])

	return ref_node
}
