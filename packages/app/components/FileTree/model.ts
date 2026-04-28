import { FileTree, prepareFileTreeInput } from '@pierre/trees'
import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import type { IProps } from '.'

@injectable()
export default class Index {
	container = null as unknown as HTMLDivElement
	tree = null as unknown as FileTree

	constructor() {
		makeAutoObservable(this, { container: false, tree: false }, { autoBind: true })
	}

	init(args: Pick<IProps, 'paths' | 'onSelectPath'>) {
		const { paths, onSelectPath } = args

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

		tree.render({ fileTreeContainer: this.container })
	}
}
