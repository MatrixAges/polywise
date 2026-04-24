import { FileTree } from '@/components'

interface IProps {
	paths: Array<string>
	onSelectPath: (selected_path: string) => void
}

const Index = (props: IProps) => {
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
