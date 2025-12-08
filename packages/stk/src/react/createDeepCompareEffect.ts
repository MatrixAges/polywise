import { useEffect, useLayoutEffect, useRef } from 'react'
import { deepEqual } from 'fast-equals'

import type { DependencyList } from 'react'

type EffectHookType = typeof useEffect | typeof useLayoutEffect
type CreateUpdateEffect = (hook: EffectHookType) => EffectHookType

const createDeepCompareEffect: CreateUpdateEffect = hook => (effect, deps) => {
	const ref = useRef<DependencyList>(null)
	const signalRef = useRef<number>(0)

	if (deps === undefined || !deepEqual(deps, ref.current)) {
		ref.current = deps
		signalRef.current += 1
	}

	hook(effect, [signalRef.current])
}

export default createDeepCompareEffect
