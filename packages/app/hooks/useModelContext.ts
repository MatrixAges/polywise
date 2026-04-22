import { useMemo } from 'react'

export default <X, C>(x: X, context: C) => {
	return useMemo(() => context, [x])
}
