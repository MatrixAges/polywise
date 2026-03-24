import { useRef, useState } from 'react'
import { useMemoizedFn } from 'ahooks'

export default (time: number = 450) => {
	const [loading, setLoading] = useState(false)
	const timer = useRef<NodeJS.Timeout>(null)

	const click = useMemoizedFn(() => {
		if (timer.current) clearTimeout(timer.current)

		setLoading(true)

		timer.current = setTimeout(() => {
			setLoading(false)
		}, time)
	})

	return { loading, click }
}
