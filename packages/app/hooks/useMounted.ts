import { useEffect, useState } from 'react'

export default (timeout?: number) => {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		if (timeout) {
			const timer = setTimeout(() => setMounted(true), timeout)

			return () => clearTimeout(timer)
		} else {
			setMounted(true)
		}
	}, [timeout])

	return mounted
}
