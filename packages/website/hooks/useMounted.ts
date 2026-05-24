import { useLayoutEffect, useState } from 'react'

export default () => {
	const [mounted, setMounted] = useState(false)

	useLayoutEffect(() => {
		setMounted(true)
	}, [])

	return mounted
}
