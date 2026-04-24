import { useEffect, useRef, useState } from 'react'
import { themeToTreeStyles } from '@pierre/trees'
import { FileTree, useFileTree } from '@pierre/trees/react'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'

import { useGlobal } from '@/context'
import { rpc } from '@/utils'

import type { FileTreeDirectoryHandle, FileTreeItemHandle } from '@pierre/trees'

interface IProps {
	active: boolean
	value: string
	onChange: (value: string) => void
}

const getInputPath = (target_path: string) => {
	if (target_path === '/') return target_path

	return target_path.endsWith('/') ? target_path.slice(0, -1) : target_path
}

const getDirectoryTreePath = (target_path: string) => {
	if (!target_path) return ''
	if (target_path.endsWith('/')) return target_path

	return `${target_path}/`
}

const Index = (props: IProps) => {
	const { active, value, onChange } = props
	const global = useGlobal()
	const [tree_paths, setTreePaths] = useState<Array<string>>([])
	const [loaded_path_map, setLoadedPathMap] = useState<Record<string, boolean>>({})
	const skip_next_replace_ref = useRef(false)
	const file_tree = useFileTree({
		paths: [],
		icons: {
			set: 'complete',
			colored: true
		},
		initialExpansion: 'open',
		onSelectionChange: selected_paths => {
			const selected_path = selected_paths[0]

			if (!selected_path || !selected_path.endsWith('/')) return

			const next_path = getInputPath(selected_path)

			skip_next_replace_ref.current = true
			onChange(next_path)
			void loadDirectory(next_path, 'append')
		}
	})

	const getExpandedDirectoryPaths = useMemoizedFn(() => {
		return tree_paths.filter(path => {
			const tree_item = file_tree.model.getItem(path) as FileTreeItemHandle | null

			if (!tree_item || !tree_item.isDirectory()) return false

			return (tree_item as FileTreeDirectoryHandle).isExpanded()
		})
	})

	const syncTreePaths = useMemoizedFn((paths: Array<string>) => {
		file_tree.model.resetPaths(paths, {
			initialExpandedPaths: getExpandedDirectoryPaths()
		})
	})

	const loadDirectory = useMemoizedFn(async (target_path: string, mode: 'append' | 'replace') => {
		const next_path = target_path.trim()

		if (!next_path) {
			if (mode === 'replace') {
				setTreePaths([])
				setLoadedPathMap({})
				syncTreePaths([])
			}

			return
		}

		if (mode === 'append' && loaded_path_map[next_path]) return

		const list = await rpc.file.list.query({ path: next_path })
		const next_paths =
			mode === 'replace'
				? [getDirectoryTreePath(next_path), ...list.map(item => item.dir)]
				: list.map(item => item.dir)
		const next_loaded_path_map = mode === 'replace' ? {} : loaded_path_map

		setTreePaths(current_paths => {
			const merged_paths = mode === 'replace' ? next_paths : [...current_paths, ...next_paths]
			const unique_paths = Array.from(new Set(merged_paths))

			syncTreePaths(unique_paths)

			return unique_paths
		})
		setLoadedPathMap({ ...next_loaded_path_map, [next_path]: true })
	})

	useEffect(() => {
		if (!active) return

		if (value) {
			void loadDirectory(value, 'replace')

			return
		}

		rpc.file.homedir.query().then(home_dir => {
			onChange(home_dir)
			void loadDirectory(home_dir, 'replace')
		})
	}, [active])

	useEffect(() => {
		if (!active) return
		if (skip_next_replace_ref.current) {
			skip_next_replace_ref.current = false

			return
		}

		const timer_id = setTimeout(() => {
			void loadDirectory(value, 'replace')
		}, 300)

		return () => clearTimeout(timer_id)
	}, [active, value])

	return (
		<div
			className='
				overflow-y-auto
				h-[380px]
				rounded-md
				border border-border-light
			'
		>
			<FileTree
				model={file_tree.model}
				style={themeToTreeStyles({ type: global.theme.theme_value })}
			></FileTree>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
