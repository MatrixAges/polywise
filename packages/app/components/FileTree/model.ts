import { FileTree, prepareFileTreeInput } from '@pierre/trees'
import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { Util } from '@/models/common'

import type { FileTreeMutationEvent } from '@pierre/trees'
import type { IProps } from '.'

@injectable()
export default class Index {
	container = null as unknown as HTMLDivElement
	tree = null as unknown as FileTree
	paths = [] as Array<string>
	off_mutation = null as null | (() => void)

	constructor(public util: Util) {
		makeAutoObservable(
			this,
			{ util: false, container: false, tree: false, off_mutation: false },
			{ autoBind: true }
		)
	}

	init(
		args: Pick<
			IProps,
			| 'paths'
			| 'search'
			| 'coloredIcons'
			| 'dragAndDrop'
			| 'renaming'
			| 'composition'
			| 'onMutation'
			| 'onReady'
			| 'onSelectPath'
		>
	) {
		const {
			paths,
			search,
			coloredIcons,
			dragAndDrop,
			renaming,
			composition,
			onMutation,
			onReady,
			onSelectPath
		} = args

		if (this.tree) return this.syncPaths(paths)

		const tree = new FileTree({
			preparedInput: prepareFileTreeInput(paths, { flattenEmptyDirectories: true }),
			search,
			dragAndDrop,
			renaming,
			composition,
			icons: coloredIcons ? { set: 'complete', colored: true } : 'standard',
			itemHeight: 27,
			flattenEmptyDirectories: true,
			initialExpansion: 'closed',
			unsafeCSS: `
                  [data-file-tree-virtualized-scroll='true']{
                        scrollbar-width:none;
                  }

                  [data-file-tree-virtualized-scroll='true']::-webkit-scrollbar {
                        display: none;
                  }

                  button[data-type='item']{
                        margin:0;
                  }
                  
			button[data-type='item'] > div[data-item-section='content'] {
			      height:100%;
			      display:flex;
			}

                  button[data-item-focused='true'] {
			      background-color:var(--color-std-50);
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

		if (onMutation) {
			const deinit = this.tree.onMutation('*', event => onMutation(event))

			this.util.acts.push(deinit)
		}

		tree.render({ fileTreeContainer: this.container })
		onReady?.(tree)
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
