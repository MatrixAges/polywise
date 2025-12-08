import { useRef } from 'react'
import { deepEqual } from 'fast-equals'

export default <TKey, TValue>(memoFn: () => TValue, key: TKey): TValue => {
	const ref = useRef<{ key: TKey; value: TValue }>(null)

	if (!deepEqual(key, ref.current?.key)) {
		ref.current = { key, value: memoFn() }
	}

	return ref.current.value
}
