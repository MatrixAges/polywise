import { useEffect, useRef } from 'react'

import type { DependencyList } from 'react'

export default (deps: DependencyList) => {
	const container = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const el = container.current

		if (!el) return

		const timer = setTimeout(() => {
			el.scrollTo({
				top: el.scrollHeight,
				behavior: 'smooth'
			})
		}, 120)

		return () => clearTimeout(timer)
	}, deps)

	return container
}
