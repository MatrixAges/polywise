import { useInsertionEffect, useLayoutEffect, useRef } from 'react'
import { useMemoizedFn } from 'ahooks'
import { deepEqual } from 'stk/react'

import type { ShadowTracker } from '@/utils'
import type { DependencyList } from 'react'

interface Args {
	init: (setRef: (v: HTMLDivElement) => void) => void
	deinit?: () => void
	deps?: DependencyList
	normal?: boolean
}

const createShadowTracker = (dom: HTMLElement, cleanup: () => void) => {
	const tracker = document.createElement('shadow-tracker') as ShadowTracker

	tracker.style.display = 'none'
	tracker.cleanup = cleanup

	dom.append(tracker)
}

export default (args: Args) => {
	const { init, deinit, deps = [], normal } = args

	const state = useRef<{ mounted: boolean; dom: HTMLElement | null; deps: DependencyList }>({
		mounted: false,
		dom: null,
		deps: []
	})

	const cleanup = useMemoizedFn(() => {
		deinit?.()

		state.current.mounted = false
		state.current.dom = null
		state.current.deps = []
	})

	const setRef = useMemoizedFn((v: HTMLDivElement) => {
		if (!v) return

		state.current.dom = v

		createShadowTracker(v, cleanup)
	})

	const useEffect = normal ? useLayoutEffect : useInsertionEffect

	useEffect(() => {
		if (state.current.mounted && deepEqual(state.current.deps, deps)) return

		state.current.mounted = true
		state.current.deps = deps

		init(setRef)

		if (normal) {
			return () => deinit?.()
		}
	}, deps)

	return { ref: state.current.dom, setRef }
}
