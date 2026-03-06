import { useEffect, useState } from 'react'

export default <T>(val: T, delay: number) => {
	const [delayed_val, setDelayedVal] = useState(val)

	useEffect(() => {
		const timer_id = setTimeout(() => {
			setDelayedVal(val)
		}, delay)

		return () => clearTimeout(timer_id)
	}, [val, delay])

	return delayed_val
}
