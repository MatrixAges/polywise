import { lazy, Suspense, useMemo } from 'react'
import { match } from 'ts-pattern'

import Fallback from './Fallback'

import type { ReactNode } from 'react'

interface IProps {
	type: 'panel' | 'setting'
	path: string
	props?: any
	placeholder?: ReactNode
}

const Index = (_props: IProps) => {
	const { type, path, props, placeholder } = _props

	const Component = useMemo(() => {
		return match(type)
			.with('panel', () => lazy(() => import(`@/panel/${path}/index`)))
			.with('setting', () => lazy(() => import(`@/setting/${path}/index`)))
			.exhaustive()
	}, [type, path])

	return (
		<Suspense fallback={placeholder ?? <Fallback />}>
			<Component {...props} />
		</Suspense>
	)
}

export default $app.memo(Index)
