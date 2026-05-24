import { useLayoutEffect, useState } from 'react'
import { getComputedStyleValue } from '@website/utils'
import { debounce } from 'lodash-es'

export default (getTargetElement: () => HTMLElement, attr?: 'width' | 'height') => {
	const [size, setSize] = useState(() => {
		const el = getTargetElement()

		if (!el) return
		if (attr) return getComputedStyleValue(el, attr)

		return {
			width: getComputedStyleValue(el, 'width'),
			height: getComputedStyleValue(el, 'height')
		}
	})

	useLayoutEffect(() => {
		const el = getTargetElement()

		if (!el) return

		const resizeObserver = new ResizeObserver(
			debounce(
				(entries: Array<ResizeObserverEntry>) => {
					entries.forEach(entry => {
						const { clientWidth, clientHeight } = entry.target

						if (attr) {
							if (attr === 'width') setSize(clientWidth)
							if (attr === 'height') setSize(clientHeight)
						} else {
							setSize({ width: clientWidth, height: clientHeight })
						}
					})
				},
				300,
				{ leading: true }
			)
		)

		resizeObserver.observe(el)

		return () => resizeObserver.disconnect()
	}, [])

	return size
}
