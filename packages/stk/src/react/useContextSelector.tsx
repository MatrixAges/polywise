import {
	Context as ContextOrig,
	createContext as createContextOrig,
	createElement,
	Provider,
	useContext as useContextOrig,
	useReducer,
	useRef,
	useState
} from 'react'
import { useIsomorphicLayoutEffect } from 'ahooks'
import { deepEqual } from 'fast-equals'
import { unstable_batchedUpdates as batchedUpdates } from 'react-dom'
import { unstable_NormalPriority as NormalPriority, unstable_runWithPriority as runWithPriority } from 'scheduler'

import memo from './memo'

import type { ComponentType, ReactNode, RefObject } from 'react'

const CONTEXT_VALUE = Symbol()
const ORIGINAL_PROVIDER = Symbol()

const runWithNormalPriority = runWithPriority
	? (thunk: () => void) => runWithPriority(NormalPriority, thunk)
	: (thunk: () => void) => thunk()

type Version = number
type Listener<Value> = (action: { n: Version; p?: Promise<Value>; v?: Value }) => void

type ContextValue<Value> = {
	[CONTEXT_VALUE]: {
		v: RefObject<Value>
		n: RefObject<Version>
		l: Set<Listener<Value>>
		u: (thunk: () => void, options?: { suspense: boolean }) => void
	}
}

export interface Context<Value> {
	Provider: ComponentType<{ value: Value; children: ReactNode }>
	displayName?: string
}

function createProvider<Value>(ProviderOrig: Provider<ContextValue<Value>>) {
	const ContextProvider = ({ value, children }: { value: Value; children: ReactNode }) => {
		const valueRef = useRef(value)
		const versionRef = useRef(0)
		const [resolve, setResolve] = useState<((v: Value) => void) | null>(null)

		if (resolve) {
			resolve(value)
			setResolve(null)
		}

		const contextValue = useRef<ContextValue<Value>>(null)

		if (!contextValue.current) {
			const listeners = new Set<Listener<Value>>()

			const update = (thunk: () => void, options?: { suspense: boolean }) => {
				batchedUpdates(() => {
					versionRef.current += 1

					const action: Parameters<Listener<Value>>[0] = {
						n: versionRef.current
					}

					if (options?.suspense) {
						action.n *= -1 // this is intentional to make it temporary version
						action.p = new Promise<Value>(r => {
							setResolve(() => (v: Value) => {
								action.v = v
								delete action.p
								r(v)
							})
						})
					}

					listeners.forEach(listener => listener(action))

					thunk()
				})
			}

			contextValue.current = {
				[CONTEXT_VALUE]: {
					v: valueRef,
					n: versionRef,
					l: listeners,
					u: update
				}
			}
		}

		useIsomorphicLayoutEffect(() => {
			valueRef.current = value
			versionRef.current += 1

			runWithNormalPriority(() => {
				;(contextValue.current as ContextValue<Value>)[CONTEXT_VALUE].l.forEach(listener => {
					listener({ n: versionRef.current, v: value })
				})
			})
		}, [value])

		return createElement(ProviderOrig, { value: contextValue.current }, children)
	}

	return memo(ContextProvider)
}

export function createContext<Value>(defaultValue: Value) {
	const context = createContextOrig<ContextValue<Value>>({
		[CONTEXT_VALUE]: {
			v: { current: defaultValue },
			n: { current: -1 },
			l: new Set(),
			u: f => f()
		}
	})
	;(
		context as unknown as {
			[ORIGINAL_PROVIDER]: Provider<ContextValue<Value>>
		}
	)[ORIGINAL_PROVIDER] = context.Provider
	;(context as unknown as Context<Value>).Provider = createProvider(context.Provider)

	delete (context as any).Consumer // no support for Consumer

	return context as unknown as Context<Value>
}

export function useContextSelector<Value, Selected>(context: Context<Value>, selector: (value: Value) => Selected) {
	const contextValue = useContextOrig(context as unknown as ContextOrig<ContextValue<Value>>)[CONTEXT_VALUE]

	if (typeof process === 'object' && process.env.NODE_ENV !== 'production') {
		if (!contextValue) {
			throw new Error('useContextSelector requires special context')
		}
	}

	const {
		v: { current: value },
		n: { current: version },
		l: listeners
	} = contextValue

	const selected = selector(value)

	const [state, dispatch] = useReducer(
		(prev: readonly [Value, Selected], action?: Parameters<Listener<Value>>[0]) => {
			if (!action) {
				return [value, selected] as const
			}

			if ('p' in action) {
				throw action.p
			}

			if (action.n === version) {
				if (deepEqual(prev[1], selected)) {
					return prev
				}

				return [value, selected] as const
			}

			try {
				if ('v' in action) {
					if (deepEqual(prev[0], action.v)) {
						return prev
					}

					const nextSelected = selector(action.v)

					if (deepEqual(prev[1], nextSelected)) {
						return prev
					}

					return [action.v, nextSelected] as const
				}
			} catch (e) {}

			return [...prev] as const
		},
		[value, selected] as const
	)

	if (!deepEqual(state[1], selected)) {
		dispatch()
	}

	useIsomorphicLayoutEffect(() => {
		listeners.add(dispatch)

		return () => {
			listeners.delete(dispatch)
		}
	}, [listeners])

	return state[1]
}

export function useContext<Value>(context: Context<Value>) {
	return useContextSelector(context, x => x)
}

export function useContextUpdate<Value>(context: Context<Value>) {
	const contextValue = useContextOrig(context as unknown as ContextOrig<ContextValue<Value>>)[CONTEXT_VALUE]

	if (typeof process === 'object' && process.env.NODE_ENV !== 'production') {
		if (!contextValue) {
			throw new Error('useContextUpdate requires special context')
		}
	}

	const { u: update } = contextValue

	return update
}

export const BridgeProvider = ({
	context,
	value,
	children
}: {
	context: Context<any>
	value: any
	children: ReactNode
}) => {
	const { [ORIGINAL_PROVIDER]: ProviderOrig } = context as unknown as {
		[ORIGINAL_PROVIDER]: Provider<unknown>
	}

	if (typeof process === 'object' && process.env.NODE_ENV !== 'production') {
		if (!ProviderOrig) {
			throw new Error('BridgeProvider requires special context')
		}
	}

	return createElement(ProviderOrig, { value }, children)
}

export const useBridgeValue = (context: Context<any>) => {
	const bridgeValue = useContextOrig(context as unknown as ContextOrig<ContextValue<unknown>>)

	if (typeof process === 'object' && process.env.NODE_ENV !== 'production') {
		if (!bridgeValue[CONTEXT_VALUE]) {
			throw new Error('useBridgeValue requires special context')
		}
	}

	return bridgeValue as any
}
