import { useLayoutEffect, useRef } from 'react'
import { useMemoizedFn } from 'ahooks'
import { deepEqual } from 'stk/react'

import type { DependencyList, EffectCallback } from 'react'

export default (callback: EffectCallback, deps: DependencyList) => {
	const ref = useRef<{ rendered: boolean; prev_deps: DependencyList }>({ rendered: false, prev_deps: [] })

	const exec = useMemoizedFn(() => {
		ref.current.rendered = true
		ref.current.prev_deps = deps

		return callback()
	})

	useLayoutEffect(() => {
		const { rendered, prev_deps } = ref.current

		if (!rendered) return exec()

		if (deepEqual(prev_deps, deps)) return

		ref.current.rendered = true
		ref.current.prev_deps = deps

		return exec()
	}, [deps])
}
