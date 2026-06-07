import { Bot, HardDriveDownload, MessagesSquare, PanelLeftOpen, Plus, Sparkles } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Tabs } from '@/components'

import { useModel } from '../context'
import AgentsMenu from './AgentsMenu'
import CreateDialog from './CreateDialog'
import GroupDialog from './GroupDialog'
import GroupsMenu from './GroupsMenu'
import ImportDialog from './ImportDialog'
import PrivateArticleDialog from './PrivateArticleDialog'
import { SkillDialog } from './Skill'

const Index = () => {
	const { t } = useTranslation('agent')
	const {
		menu_scope,
		page_mode,
		session_menu_open,
		setMenuScope,
		setSessionMenuOpen,
		openCreateAgentDialog,
		openCreateGroupDialog,
		openImportDialog,
		openSkillDialog
	} = useModel()

	return (
		<>
			<div
				className='
					overflow-hidden
					flex flex-col
					w-[210px] h-full
					bg-std-50/60
					dark:bg-std-100/60 dark:border-r dark:border-border-light/60
				'
			>
				<div
					className='
						flex
						items-center justify-between
						h-9
						px-1.5
					'
				>
					<div className='flex min-w-0 flex-1'>
						<Tabs
							small
							items={[
								{ key: 'agent', title: t('menu.agents'), Icon: Bot },
								{ key: 'group', title: t('menu.groups'), Icon: MessagesSquare }
							]}
							active={menu_scope}
							onClick={v => setMenuScope(v as 'agent' | 'group')}
						></Tabs>
					</div>
					<div className='flex gap-1'>
						{menu_scope === 'agent' && page_mode === 'sessions' && !session_menu_open && (
							<button
								className='icon_button small'
								type='button'
								onClick={() => setSessionMenuOpen(true)}
							>
								<PanelLeftOpen className='size-3'></PanelLeftOpen>
							</button>
						)}
						{menu_scope === 'agent' && (
							<button
								className='icon_button small'
								type='button'
								onClick={openImportDialog}
							>
								<HardDriveDownload className='size-3'></HardDriveDownload>
							</button>
						)}
						{menu_scope === 'agent' && (
							<button className='icon_button small' type='button' onClick={openSkillDialog}>
								<Sparkles className='size-3'></Sparkles>
							</button>
						)}
						<button
							className='icon_button small'
							type='button'
							onClick={() => {
								if (menu_scope === 'group') {
									openCreateGroupDialog()
									return
								}

								openCreateAgentDialog()
							}}
						>
							<Plus className='size-3.5'></Plus>
						</button>
					</div>
				</div>
				<div className='flex min-h-0 flex-1 flex-col'>
					<div className='flex min-h-0 flex-1 overflow-y-scroll'>
						<div
							className='
								flex flex-col
								w-full
								gap-0.5
								px-1.5
							'
						>
							{menu_scope === 'agent' ? (
								<AgentsMenu></AgentsMenu>
							) : (
								<GroupsMenu></GroupsMenu>
							)}
							<div className='h-1 shrink-0 opacity-0'>-</div>
						</div>
					</div>
				</div>
			</div>
			<CreateDialog></CreateDialog>
			<ImportDialog></ImportDialog>
			<GroupDialog></GroupDialog>
			<PrivateArticleDialog></PrivateArticleDialog>
			<SkillDialog></SkillDialog>
		</>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
