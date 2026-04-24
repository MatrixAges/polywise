import type { FileTreeDirectoryHandle, FileTreeItemHandle } from '@pierre/trees'

type ISyncMode = 'direct' | 'preserve_expansion'
type ISelectionMode = 'all' | 'directory'

interface IArgsGetExpandedDirectoryPaths {
	current_paths: Array<string>
	getItem: (path: string) => FileTreeItemHandle | null
}

interface IArgsBuildResetState {
	next_paths: Array<string>
	current_paths: Array<string>
	getItem: (path: string) => FileTreeItemHandle | null
	sync_mode: ISyncMode
}

interface IArgsGetSelectedPath {
	selected_paths: Array<string>
	selection_mode: ISelectionMode
}

export default class Index {
	normalizePaths(paths: Array<string>) {
		return Array.from(new Set(paths))
	}

	getExpandedDirectoryPaths(args: IArgsGetExpandedDirectoryPaths) {
		const { current_paths, getItem } = args

		return current_paths.filter(path => {
			const tree_item = getItem(path)

			if (!tree_item || !tree_item.isDirectory()) return false

			return (tree_item as FileTreeDirectoryHandle).isExpanded()
		})
	}

	buildResetState(args: IArgsBuildResetState) {
		const { next_paths, current_paths, getItem, sync_mode } = args
		const normalized_next_paths = this.normalizePaths(next_paths)

		if (sync_mode !== 'preserve_expansion') {
			return { paths: normalized_next_paths, options: {} }
		}

		const initialExpandedPaths = this.getExpandedDirectoryPaths({ current_paths, getItem })

		return {
			paths: normalized_next_paths,
			options: { initialExpandedPaths }
		}
	}

	getSelectedPath(args: IArgsGetSelectedPath) {
		const { selected_paths, selection_mode } = args
		const selected_path = selected_paths[0]

		if (!selected_path) return ''
		if (selection_mode === 'directory' && !selected_path.endsWith('/')) return ''

		return selected_path
	}
}
