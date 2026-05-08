import { useLayoutEffect, useMemo, useState } from 'react'
import { themeToTreeStyles } from '@pierre/trees'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { useGlobal } from '@/context'

import Model from './model'

import type {
	FileTreeCompositionOptions,
	FileTreeDragAndDropConfig,
	FileTreeMutationEvent,
	FileTreeRenamingConfig,
	FileTree as TreeInstance
} from '@pierre/trees'

export interface IProps {
	paths: Array<string>
	className?: string
	flex?: boolean
	search?: boolean
	coloredIcons?: boolean
	dragAndDrop?: boolean | FileTreeDragAndDropConfig
	renaming?: boolean | FileTreeRenamingConfig
	composition?: FileTreeCompositionOptions
	onMutation?: (event: FileTreeMutationEvent) => void
	onReady?: (tree: TreeInstance) => void
	onSelectPath: (v: { directory: boolean; path: string }) => void
}

const Index = (props: IProps) => {
	const {
		paths,
		className,
		flex,
		search,
		coloredIcons,
		dragAndDrop,
		renaming,
		composition,
		onMutation,
		onReady,
		onSelectPath
	} = props
	const [x] = useState(() => container.resolve(Model))
	const global = useGlobal()

	useLayoutEffect(() => {
		if (!paths.length || !x.container) return

		x.init({
			paths,
			search,
			coloredIcons,
			dragAndDrop,
			renaming,
			composition,
			onMutation,
			onReady,
			onSelectPath
		})
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
			className={$cx(
				`
				overflow-y-auto
			`,
				className,
				flex
					? 'flex_tree h-full min-h-0'
					: `
				h-[400px]
				p-1.5
				rounded-xl
				border border-border-gray!
			`
			)}
			style={style}
			ref={setContainer}
		></div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
