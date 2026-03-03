import { useInsertionEffect, useRef } from 'react'
import { useMemoizedFn } from 'ahooks'
import { deepEqual } from 'stk/react'

import type { ShadowTracker } from '@/utils'
import type { DependencyList } from 'react'

interface Args {
	init: (setRef: (v: HTMLDivElement) => void) => void
	deinit?: () => void
	deps?: DependencyList
}

const createShadowTracker = (dom: HTMLElement, cleanup: () => void) => {
	const tracker = document.createElement('shadow-tracker') as ShadowTracker

	tracker.style.display = 'none'
	tracker.cleanup = cleanup

	dom.append(tracker)
}

export default (args: Args) => {
	const { init, deinit, deps = [] } = args

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

	useInsertionEffect(() => {
		if (state.current.mounted && deepEqual(state.current.deps, deps)) return

		state.current.mounted = true
		state.current.deps = deps

		init(setRef)
	}, deps)

	return { setRef }
}
