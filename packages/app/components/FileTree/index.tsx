import { useLayoutEffect, useMemo, useState } from 'react'
import { themeToTreeStyles } from '@pierre/trees'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { useGlobal } from '@/context'

import Model from './model'

export interface IProps {
	paths: Array<string>
	className?: string
	onSelectPath: (v: { directory: boolean; path: string }) => void
}

const Index = (props: IProps) => {
	const { paths, className, onSelectPath } = props
	const [x] = useState(() => container.resolve(Model))
	const global = useGlobal()

	useLayoutEffect(() => {
		if (!paths.length || !x.container) return

		x.init({ paths, onSelectPath })
	}, [x.container])

	useLayoutEffect(() => {
		if (!paths.length) return

		x.syncPaths(paths)
	}, [paths])

	const setContainer = useMemoizedFn(v => (x.container = v))

	const style = useMemo(
		() =>
			themeToTreeStyles({
				type: global.theme.theme_value,
				bg: 'transparent'
			}),
		[global.theme.theme_value]
	)

	return (
		<div
			className={
				className ||
				`
				overflow-y-auto
				h-[400px]
				py-4
				rounded-xl
				border border-border-gray!
			`
			}
			style={style}
			ref={setContainer}
		></div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
