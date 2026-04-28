import { FileTree } from '@/components'

import { useProjectContext } from '../context'

import type { IPropsDirectoryTree } from '../types'

const Index = (props: IPropsDirectoryTree) => {
	const { paths } = props
	const { onSelectProjectDirectoryPath } = useProjectContext()

	if (!paths.length) return null

	return (
		<FileTree
			paths={paths}
			selection_mode='directory'
			sync_mode='preserve_expansion'
			only_dir
			onSelectPath={onSelectProjectDirectoryPath}
		></FileTree>
	)
}

export default $app.memo(Index)
