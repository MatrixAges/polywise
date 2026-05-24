'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { DependencyList, EffectCallback, MutableRefObject, RefObject } from 'react'

type BasicTarget<T extends EventTarget = EventTarget> =
	| T
	| null
	| undefined
	| RefObject<T | null>
	| MutableRefObject<T | null>
	| (() => T | null | undefined)

type ClickTarget = BasicTarget<HTMLElement> | Array<BasicTarget<HTMLElement>>

type ListenerOptions = AddEventListenerOptions & {
	target?: BasicTarget<EventTarget>
}

type ToggleActions = {
	set: (value: boolean) => void
	setLeft: () => void
	setRight: () => void
	toggle: () => void
}

const resolveTarget = <T extends EventTarget>(target?: BasicTarget<T>) => {
	if (!target) return typeof window !== 'undefined' ? window : null
	if (typeof target === 'function') return target() ?? null
	if ('current' in target) return target.current

	return target
}

export const useMemoizedFn = <T extends (...args: Array<any>) => any>(fn: T): T => {
	const ref = useRef(fn)

	useEffect(() => {
		ref.current = fn
	}, [fn])

	return useCallback(((...args: Array<any>) => ref.current(...args)) as T, [])
}

export const useToggle = (defaultValue = false): [boolean, ToggleActions] => {
	const [state, setState] = useState(defaultValue)

	const actions = useMemo(
		() => ({
			set: (value: boolean) => setState(value),
			setLeft: () => setState(false),
			setRight: () => setState(true),
			toggle: () => setState(v => !v)
		}),
		[]
	)

	return [state, actions]
}

export const useClickAway = (onClickAway: (event: MouseEvent | TouchEvent) => void, target: ClickTarget) => {
	const latest = useMemoizedFn(onClickAway)

	useEffect(() => {
		if (typeof document === 'undefined') return

		const targets = Array.isArray(target) ? target : [target]

		const listener = (event: MouseEvent | TouchEvent) => {
			const isInside = targets.some(item => {
				const element = resolveTarget(item)

				return element?.contains(event.target as Node)
			})

			if (!isInside) {
				latest(event)
			}
		}

		document.addEventListener('mousedown', listener)
		document.addEventListener('touchstart', listener)

		return () => {
			document.removeEventListener('mousedown', listener)
			document.removeEventListener('touchstart', listener)
		}
	}, [latest, target])
}

export const useDeepCompareEffect = (effect: EffectCallback, deps: DependencyList) => {
	useEffect(effect, deps)
}

export const useUpdateEffect = (effect: EffectCallback, deps: DependencyList) => {
	const mounted = useRef(false)

	useEffect(() => {
		if (!mounted.current) {
			mounted.current = true

			return
		}

		return effect()
	}, deps)
}

export const useEventListener = <K extends keyof WindowEventMap>(
	eventName: K | string,
	handler: (event: Event) => void,
	options?: ListenerOptions
) => {
	const latest = useMemoizedFn(handler)
	const target = options?.target

	useEffect(() => {
		const element = resolveTarget(target)

		if (!element?.addEventListener) return

		const listener = (event: Event) => latest(event)

		element.addEventListener(eventName, listener, options)

		return () => {
			element.removeEventListener(eventName, listener, options)
		}
	}, [eventName, latest, options, target])
}

export const useLocalStorageState = <T>(
	key: string,
	options?: {
		defaultValue?: T | (() => T)
	}
) => {
	const getDefault = () => {
		if (typeof options?.defaultValue === 'function') {
			return (options.defaultValue as () => T)()
		}

		return options?.defaultValue
	}

	const [state, setState] = useState<T | undefined>(() => {
		if (typeof window === 'undefined') return getDefault()

		const raw = window.localStorage.getItem(key)

		if (raw == null) return getDefault()

		try {
			return JSON.parse(raw) as T
		} catch {
			return getDefault()
		}
	})

	const setValue = useMemoizedFn((value: T | ((prev: T | undefined) => T | undefined)) => {
		setState(prev => {
			const next =
				typeof value === 'function' ? (value as (prev: T | undefined) => T | undefined)(prev) : value

			if (typeof window !== 'undefined') {
				if (typeof next === 'undefined') {
					window.localStorage.removeItem(key)
				} else {
					window.localStorage.setItem(key, JSON.stringify(next))
				}
			}

			return next
		})
	})

	return [state, setValue] as const
}

export const useInViewport = <T extends Element>(target: RefObject<T | null>) => {
	const [entry, setEntry] = useState<IntersectionObserverEntry>()
	const [inViewport, setInViewport] = useState(false)

	useEffect(() => {
		if (typeof IntersectionObserver === 'undefined') return

		const element = target.current

		if (!element) return

		const observer = new IntersectionObserver(([next]) => {
			setEntry(next)
			setInViewport(next.isIntersecting)
		})

		observer.observe(element)

		return () => observer.disconnect()
	}, [target])

	return [inViewport, entry] as const
}

export const useAsyncEffect = (
	effect: () => Promise<void | (() => void)> | void | (() => void),
	deps: DependencyList
) => {
	useEffect(() => {
		let cleanup: void | (() => void)
		let active = true

		Promise.resolve(effect()).then(result => {
			if (!active) return

			cleanup = result
		})

		return () => {
			active = false
			cleanup?.()
		}
	}, deps)
}

export const useFocusWithin = <T extends HTMLElement>(target: RefObject<T | null>) => {
	const [focused, setFocused] = useState(false)

	useEffect(() => {
		const element = target.current

		if (!element) return

		const onFocusIn = () => setFocused(true)
		const onFocusOut = (event: FocusEvent) => {
			if (element.contains(event.relatedTarget as Node | null)) return

			setFocused(false)
		}

		element.addEventListener('focusin', onFocusIn)
		element.addEventListener('focusout', onFocusOut)

		return () => {
			element.removeEventListener('focusin', onFocusIn)
			element.removeEventListener('focusout', onFocusOut)
		}
	}, [target])

	return focused
}
