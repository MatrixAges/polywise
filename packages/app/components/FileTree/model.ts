import { FileTree, prepareFileTreeInput } from '@pierre/trees'
import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import type { IProps } from '.'

@injectable()
export default class Index {
	container = null as unknown as HTMLDivElement
	tree = null as unknown as FileTree
	paths = [] as Array<string>

	constructor() {
		makeAutoObservable(this, { container: false, tree: false }, { autoBind: true })
	}

	init(args: Pick<IProps, 'paths' | 'onSelectPath'>) {
		const { paths, onSelectPath } = args

		if (this.tree) return this.syncPaths(paths)

		const tree = new FileTree({
			preparedInput: prepareFileTreeInput(paths, { flattenEmptyDirectories: true }),
			search: true,
			icons: 'standard',
			flattenEmptyDirectories: true,
			initialExpansion: 'closed',
			unsafeCSS: `
			button[data-type='item'] > div[data-item-section='content'] {
			      height:100%;
			      display:flex;
			}
			`,
			onSelectionChange(v: readonly string[]) {
				const path = v[0]

				if (!path) return

				const item = tree.getItem(path)!

				onSelectPath({ directory: item.isDirectory(), path })
			}
		})

		this.tree = tree
		this.paths = [...paths]

		tree.render({ fileTreeContainer: this.container })
	}

	syncPaths(paths: Array<string>) {
		const next_paths = Array.from(new Set(paths))
		const current_path_set = new Set(this.paths)
		const current_root_paths = this.paths.filter(item => !item.includes('/'))
		const next_root_paths = next_paths.filter(item => !item.includes('/'))

		const should_reset =
			current_root_paths.length !== next_root_paths.length ||
			current_root_paths.some(item => !next_root_paths.includes(item))

		if (should_reset) {
			this.tree.resetPaths(next_paths)
			this.paths = next_paths

			return
		}

		let new_path = ''

		for (const path of next_paths) {
			if (current_path_set.has(path)) continue

			if (!new_path) new_path = path

			this.tree.add(path)
		}

		if (new_path) this.tree.focusNearestPath(new_path)

		this.paths = next_paths
	}
}
