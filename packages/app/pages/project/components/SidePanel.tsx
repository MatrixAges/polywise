import { File, MessageSquareText, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { FileTree, Tabs, TextTabs } from '@/components'

import { useModel } from '../context'

const Index = () => {
	const { side_panel_tab, content_tab, project_files, setSidePanelTab, toggleFilesProjectId, setContentTab } =
		useModel()

	return (
		<div
			className='
				overflow-y-hidden
				flex flex-col
				w-[300px] h-full
				border-border-light border-l
			'
		>
			<div
				className='
					flex
					items-center justify-between
					h-8
					px-3
					border-b border-border-light
				'
			>
				<TextTabs
					items={['files', 'todos']}
					active={side_panel_tab}
					setActive={setSidePanelTab}
				></TextTabs>
				<div className='flex items-center'>
					<Tabs
						items={[
							{ key: 'session', Icon: MessageSquareText },
							{ key: 'file', Icon: File }
						]}
						active={content_tab}
						simple
						onClick={setContentTab}
					></Tabs>
					<div
						className='
							w-px h-[14px]
							mx-2
							bg-border-light
						'
					></div>
					<div className='icon_button small mr-[-3px]' onClick={toggleFilesProjectId}>
						<X></X>
					</div>
				</div>
			</div>
			<div className='flex-1'>
				<FileTree
					paths={$copy(project_files.paths)}
					flex
					colored_icons
					onSelectPath={project_files.selectPath}
					key={project_files.tree_version}
				></FileTree>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
