import { lazy, Suspense, useMemo } from 'react'
import { match } from 'ts-pattern'

import { Spinner } from '@/__shadcn__/components/ui/spinner'

import type { ReactNode } from 'react'

interface IProps {
	type: 'panel' | 'setting'
	path: string
	props?: any
	placeholder?: ReactNode
}

const Fallback = $app.memo(() => {
	return (
		<div
			className='
				flex
				items-center justify-center
				w-full h-full
				py-6
			'
		>
			<Spinner></Spinner>
		</div>
	)
})

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
