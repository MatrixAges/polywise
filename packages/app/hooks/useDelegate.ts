import { useLayoutEffect, useRef } from 'react'
import { useMemoizedFn } from 'ahooks'

import { checkParent } from '@/utils'

import type { DependencyList } from 'react'

export default <T extends HTMLElement>(
	callback: (attr_value: any, event: HTMLElementEventMap[keyof HTMLElementEventMap]) => void,
	options?: {
		attr?: string
		item_type?: string
		event_type?: string
		visible?: boolean
		duration?: number
		ignore_el?: string
		deps?: DependencyList
	}
) => {
	const {
		attr = 'data-key',
		item_type = 'div',
		event_type = 'click',
		visible = true,
		duration,
		ignore_el,
		deps = []
	} = options || {}

	const ref = useRef<HTMLDivElement>(null)

	const handler = useMemoizedFn((event: HTMLElementEventMap[keyof HTMLElementEventMap]) => {
		let target = event.target as HTMLElement | null

		if (target && ignore_el) {
			if (checkParent(target, ignore_el)) return
		}

		while (target && !target?.matches?.(`${item_type}[${attr}]`)) {
			target = target.parentNode as HTMLElement

			if (!target) return
		}

		if (target) {
			callback((target as T).getAttribute(attr)!, event)
		}
	})

	useLayoutEffect(() => {
		const listen = () => {
			const el = ref.current

			if (!el) return

			el.addEventListener(event_type, handler)

			return () => {
				el.removeEventListener(event_type, handler)
			}
		}

		if (!visible) return

		if (visible && duration) {
			setTimeout(() => {
				return listen()
			}, 180)
		} else {
			return listen()
		}
	}, [event_type, visible, ...deps])

	return ref
}
