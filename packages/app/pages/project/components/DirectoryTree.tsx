import { FileTree } from '@/components'

import type { IPropsDirectoryTree } from './types'

const Index = (props: IPropsDirectoryTree) => {
	const { paths, onSelectPath } = props

	return (
		<FileTree
			paths={paths}
			selection_mode='directory'
			sync_mode='preserve_expansion'
			only_dir
			onSelectPath={onSelectPath}
		></FileTree>
	)
}

export default $app.memo(Index)
