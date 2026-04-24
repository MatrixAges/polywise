import { useEffect, useRef } from 'react'
import { themeToTreeStyles } from '@pierre/trees'
import { FileTree as PierreFileTree, useFileTree } from '@pierre/trees/react'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { useGlobal } from '@/context'

import Model from './model'

interface IProps {
	paths: Array<string>
	initial_selected_paths?: Array<string>
	selection_mode?: 'all' | 'directory'
	sync_mode?: 'direct' | 'preserve_expansion'
	only_dir?: boolean
	className?: string
	onSelectPath?: (path: string) => void
}

const Index = (props: IProps) => {
	const {
		paths,
		initial_selected_paths,
		selection_mode = 'all',
		sync_mode = 'direct',
		only_dir = false,
		className,
		onSelectPath
	} = props
	const global = useGlobal()
	const model_ref = useRef(container.resolve(Model))
	const synced_paths_ref = useRef<Array<string>>([])
	const x = model_ref.current

	const file_tree = useFileTree({
		paths: [],
		icons: {
			set: 'complete',
			colored: true
		},
		initialExpansion: 'closed',
		initialSelectedPaths: initial_selected_paths,
		onSelectionChange: selected_paths => {
			const selected_path = x.getSelectedPath({ selected_paths, selection_mode })

			if (!selected_path) return

			onSelectPath?.(selected_path)
		}
	})

	const syncTreePaths = useMemoizedFn((next_paths: Array<string>) => {
		const filtered_paths = x.filterPaths({ paths: next_paths, only_dir })
		const reset_state = x.buildResetState({
			next_paths: filtered_paths,
			current_paths: synced_paths_ref.current,
			getItem: path => file_tree.model.getItem(path),
			sync_mode
		})

		synced_paths_ref.current = reset_state.paths
		file_tree.model.resetPaths(reset_state.paths, reset_state.options)
	})

	useEffect(() => {
		syncTreePaths(paths)
	}, [paths])

	return (
		<div
			className={
				className ||
				`
				overflow-y-auto
				h-[380px]
				rounded-md
				border border-border-light
			`
			}
		>
			<PierreFileTree
				model={file_tree.model}
				style={themeToTreeStyles({ type: global.theme.theme_value })}
			></PierreFileTree>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
