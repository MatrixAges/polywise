import { useEffect, useState } from 'react'
import { useMemoizedFn } from '@website/hooks/ahooks'
import { generateJSXMeshGradient } from 'meshgrad'

import type { TargetAndTransition } from 'framer-motion'

export default (interval?: number, colors?: number) => {
	const [gradient, setGradient] = useState<TargetAndTransition>()

	const makeGradient = useMemoizedFn(() =>
		setGradient({ backgroundImage: generateJSXMeshGradient(colors || 6).backgroundImage })
	)

	useEffect(() => {
		makeGradient()

		if (interval === 0) return

		const timer = setInterval(makeGradient, interval || 3000)

		return () => clearInterval(timer)
	}, [interval])

	return { gradient, makeGradient }
}
