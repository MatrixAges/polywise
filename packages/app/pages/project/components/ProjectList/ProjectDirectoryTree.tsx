import { useEffect } from 'react'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'

import { FileTree } from '@/components'

import { useProjectContext } from '../../context'

interface IProps {
	active: boolean
	value: string
	paths: Array<string>
	onChange: (value: string) => void
}

const Index = (props: IProps) => {
	const { active, value, paths, onChange } = props
	const {
		setProjectDirectorySkipNextReplace,
		consumeProjectDirectorySkipNextReplace,
		getProjectDirectoryInputPath,
		ensureProjectDirectoryReady,
		loadProjectDirectory: loadProjectDirectoryAction
	} = useProjectContext()

	const loadDirectory = useMemoizedFn((target_path: string, mode: 'append' | 'replace') => {
		return loadProjectDirectoryAction({ target_path, mode, only_dir: true })
	})

	const onSelectDirectory = useMemoizedFn((selected_path: string) => {
		const next_path = getProjectDirectoryInputPath(selected_path)

		setProjectDirectorySkipNextReplace(true)
		onChange(next_path)
		loadDirectory(next_path, 'append')
	})

	useEffect(() => {
		if (!active) return

		ensureProjectDirectoryReady({ value, only_dir: true }).then(next_path => {
			if (!value.trim()) {
				onChange(next_path)
			}
		})
	}, [active])

	useEffect(() => {
		if (!active) return

		if (consumeProjectDirectorySkipNextReplace()) {
			return
		}

		const timer_id = setTimeout(() => {
			loadDirectory(value, 'replace')
		}, 300)

		return () => clearTimeout(timer_id)
	}, [active, value])

	return (
		<FileTree
			paths={paths}
			selection_mode='directory'
			sync_mode='preserve_expansion'
			only_dir
			onSelectPath={onSelectDirectory}
		></FileTree>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
