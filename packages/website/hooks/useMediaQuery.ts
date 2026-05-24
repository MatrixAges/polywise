import { useEffect, useState } from 'react'
import { useMemoizedFn } from '@website/hooks/ahooks'

export default (query: string) => {
	const [value, setValue] = useState(false)

	const onChange = useMemoizedFn(e => setValue(e.matches))

	useEffect(() => {
		const result = window.matchMedia(query)

		result.addEventListener('change', onChange)

		setValue(result.matches)

		return () => result.removeEventListener('change', onChange)
	}, [query])

	return value
}
