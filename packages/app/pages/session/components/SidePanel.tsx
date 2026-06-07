import { useMemoizedFn } from 'ahooks'
import { File, MessageCircleCheck, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { FileTree, Tabs } from '@/components'

import { useModel } from '../context'

const Index = () => {
	const { content_tab, project_files, setSidePanelTab, closeFiles, setContentTab } = useModel()
	const { t } = useTranslation('session')

	const onSelectPath = useMemoizedFn(args => {
		project_files.selectPath(args)

		if (!args.directory) setContentTab('file')
	})

	return (
		<div
			className='
				overflow-y-hidden
				flex flex-col shrink-0
				w-[260px] h-full
				border-border-light border-l
			'
		>
			<div
				className='
					flex
					items-center justify-between
					h-9
					px-2.5
					border-border-light border-b
				'
			>
				<span className='text-sm font-medium'>{t('side_panel.files')}</span>
				<div className='flex items-center'>
					<Tabs
						items={[
							{ key: 'session', Icon: MessageCircleCheck },
							{ key: 'file', Icon: File }
						]}
						simple
						active={content_tab}
						onClick={setContentTab}
					></Tabs>
					<div
						className='
							w-px h-[14px]
							mx-2
							bg-border-light
						'
					></div>
					<div className='icon_button small mr-[-3px]' onClick={closeFiles}>
						<X></X>
					</div>
				</div>
			</div>
			<div className='flex-1'>
				<FileTree
					paths={$copy(project_files.paths)}
					flex
					coloredIcons
					onSelectPath={onSelectPath}
					key={project_files.tree_version}
				></FileTree>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
