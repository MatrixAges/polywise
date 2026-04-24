import { useEffect, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { FileTree } from '@/components'

import Model from '../../model'

interface IProps {
	active: boolean
	value: string
	onChange: (value: string) => void
}

const Index = (props: IProps) => {
	const { active, value, onChange } = props
	const [x] = useState(() => container.resolve(Model))

	const loadDirectory = useMemoizedFn((target_path: string, mode: 'append' | 'replace') => {
		return x.loadProjectDirectory({ target_path, mode, only_dir: true })
	})

	const onSelectDirectory = useMemoizedFn((selected_path: string) => {
		const next_path = x.getProjectDirectoryInputPath(selected_path)

		x.setProjectDirectorySkipNextReplace(true)
		onChange(next_path)
		loadDirectory(next_path, 'append')
	})

	useEffect(() => {
		if (!active) return

		x.ensureProjectDirectoryReady({ value, only_dir: true }).then(next_path => {
			if (!value.trim()) {
				onChange(next_path)
			}
		})
	}, [active])

	useEffect(() => {
		if (!active) return

		if (x.consumeProjectDirectorySkipNextReplace()) {
			return
		}

		const timer_id = setTimeout(() => {
			loadDirectory(value, 'replace')
		}, 300)

		return () => clearTimeout(timer_id)
	}, [active, value])

	return (
		<FileTree
			paths={$copy(x.project_directory_tree_paths)}
			selection_mode='directory'
			sync_mode='preserve_expansion'
			only_dir
			onSelectPath={onSelectDirectory}
		></FileTree>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
