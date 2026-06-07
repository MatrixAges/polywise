import { Bot, Check } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Button } from '@/__shadcn__/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/__shadcn__/components/ui/dialog'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('linkcase')

	return (
		<Dialog
			open={x.agent_dialog_open}
			onOpenChange={next_open => !x.agent_dialog_submit_loading && x.setAgentDialogOpen(next_open)}
		>
			<DialogContent className='w-[720px] max-w-[calc(100vw-32px)]!'>
				<DialogHeader>
					<DialogTitle>{t('control.agent_access')}</DialogTitle>
				</DialogHeader>
				<div
					className='
						overflow-y-auto
						flex flex-col
						max-h-[min(72vh,640px)]
						gap-4
						py-2
					'
				>
					<div className='flex flex-col gap-2'>
						<div className='text-sm font-medium'>{t('control.assign')}</div>
						<div className='grid grid-cols-2 gap-2'>
							{!x.current_article_is_private ? (
								<button
									className={$cx(
										'click_button justify-start',
										!x.agent_dialog_assigned_agent_id && 'active'
									)}
									type='button'
									onClick={() => x.setAgentDialogAssignedAgentId('')}
								>
									<span>{t('control.none')}</span>
								</button>
							) : null}
							{x.agent_dialog_agents.map(agent => (
								<button
									className={$cx(
										'click_button justify-start gap-2',
										x.agent_dialog_assigned_agent_id === agent.id && 'active'
									)}
									type='button'
									key={agent.id}
									onClick={() => x.setAgentDialogAssignedAgentId(agent.id)}
								>
									<Bot className='size-3.5'></Bot>
									<span className='truncate'>{agent.name}</span>
								</button>
							))}
						</div>
					</div>
					{!x.current_article_is_private ? (
						<div className='flex flex-col gap-2'>
							<div className='text-sm font-medium'>{t('control.relate')}</div>
							<div className='grid grid-cols-2 gap-2'>
								{x.agent_dialog_agents.map(agent => {
									const checked = x.agent_dialog_related_agent_ids.includes(
										agent.id
									)

									return (
										<button
											className={$cx(
												'click_button justify-between gap-2',
												checked && 'active',
												x.agent_dialog_assigned_agent_id &&
													'pointer-events-none opacity-50'
											)}
											type='button'
											key={agent.id}
											onClick={() =>
												x.toggleAgentDialogRelatedAgent(agent.id)
											}
										>
											<div className='flex min-w-0 items-center gap-2'>
												<Bot className='size-3.5'></Bot>
												<span className='truncate'>{agent.name}</span>
											</div>
											{checked ? (
												<Check className='size-3.5'></Check>
											) : null}
										</button>
									)
								})}
							</div>
						</div>
					) : null}
				</div>
				<DialogFooter>
					<Button
						variant='outline'
						disabled={x.agent_dialog_submit_loading}
						onClick={() => x.setAgentDialogOpen(false)}
					>
						{t('dialog.cancel')}
					</Button>
					<Button
						disabled={
							x.agent_dialog_loading ||
							x.agent_dialog_submit_loading ||
							(x.current_article_is_private && !x.agent_dialog_assigned_agent_id)
						}
						onClick={() => void x.submitAgentDialog()}
					>
						{x.agent_dialog_submit_loading ? t('control.saving') : t('control.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
