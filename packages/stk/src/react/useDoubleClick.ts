import { useRef } from 'react'
import { useMemoizedFn } from 'ahooks'

export default (callback: (...args: any) => any, delay = 300) => {
	const times = useRef(0)
	const timer = useRef<NodeJS.Timeout>(null)

	return useMemoizedFn((...args: any) => {
		times.current += 1

		clearTimeout(timer.current)

		timer.current = setTimeout(() => {
			times.current = 0
		}, delay)

		if (times.current === 2) {
			callback(...args)

			times.current = 0
		}
	})
}
