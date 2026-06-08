import { ListCheck, Plus } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from '@/__shadcn__/components/ui/select'
import { Switch } from '@/__shadcn__/components/ui/switch'
import { Dialog, DialogFooter, Tabs } from '@/components'

import { useModel } from '../context'

const count_options = Array.from({ length: 10 }, (_, index) => String(index + 1))
const extract_concurrency_options = Array.from({ length: 10 }, (_, index) => String(index + 1))

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('linkcase')

	return (
		<Dialog
			open={x.start_dialog_open}
			title={t('control.scheduled_tasks_title')}
			desc={t('control.scheduled_tasks_desc')}
			className='w-[560px] max-w-[92vw]! pb-4'
			setOpen={x.setStartDialogOpen}
		>
			<div className='flex flex-col gap-4'>
				<div
					className='
						px-4 py-3
						rounded-3xl
						text-sm text-std-500
						bg-secondary/20
						border border-border-light
					'
				>
					{x.batch_status_text}
				</div>

				{x.batch_panel_tab === 'create' && (
					<div className='flex flex-col gap-4'>
						<div className='flex flex-col gap-3'>
							<div className='text-sm font-medium'>{t('control.actions')}</div>
							<div
								className='
									p-3
									rounded-3xl
									bg-secondary/30
									border border-border-light
								'
							>
								<div className='flex items-center justify-between gap-3'>
									<div>
										<div className='text-sm font-medium'>
											{t('control.fetch')}
										</div>
										<div className='text-std-400 text-xs'>
											{t('control.fetch_desc')}
										</div>
									</div>
									<Switch
										checked={x.batch_action_fetch_enabled}
										onCheckedChange={x.setBatchActionFetchEnabled}
									></Switch>
								</div>
								<div className='mt-3 flex items-center gap-2'>
									<Input
										type='number'
										min={1}
										value={String(x.batch_fetch_interval_value)}
										onChange={event =>
											x.setBatchFetchIntervalValue(event.target.value)
										}
									></Input>
									<Select
										value={x.batch_fetch_interval_unit}
										onValueChange={value =>
											value && x.setBatchFetchIntervalUnit(value)
										}
									>
										<SelectTrigger
											className='
												w-[140px]
												px-3 py-2
												rounded-4xl
												text-sm
												bg-secondary/60
											'
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												<SelectLabel>{t('control.unit')}</SelectLabel>
												<SelectItem value='second'>
													{t('control.seconds')}
												</SelectItem>
												<SelectItem value='minute'>
													{t('control.minutes')}
												</SelectItem>
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>
							</div>
							<div
								className='
									p-3
									rounded-3xl
									bg-secondary/30
									border border-border-light
								'
							>
								<div className='flex items-center justify-between gap-3'>
									<div>
										<div className='text-sm font-medium'>
											{t('selection.extract')}
										</div>
										<div className='text-std-400 text-xs'>
											{t('control.extract_desc')}
										</div>
									</div>
									<Switch
										checked={x.batch_action_extract_enabled}
										onCheckedChange={x.setBatchActionExtractEnabled}
									></Switch>
								</div>
								<div className='mt-3 flex items-center gap-2'>
									<Input
										type='number'
										min={1}
										value={String(x.batch_extract_interval_value)}
										onChange={event =>
											x.setBatchExtractIntervalValue(event.target.value)
										}
									></Input>
									<Select
										value={x.batch_extract_interval_unit}
										onValueChange={value =>
											value && x.setBatchExtractIntervalUnit(value)
										}
									>
										<SelectTrigger
											className='
												w-[140px]
												px-3 py-2
												rounded-4xl
												text-sm
												bg-secondary/60
											'
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												<SelectLabel>{t('control.unit')}</SelectLabel>
												<SelectItem value='second'>
													{t('control.seconds')}
												</SelectItem>
												<SelectItem value='minute'>
													{t('control.minutes')}
												</SelectItem>
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>
								<div
									className='
										flex
										items-center justify-between
										gap-3
										mt-3
									'
								>
									<div className='text-std-400 text-xs'>
										{t('control.extract_concurrency_desc')}
									</div>
									<Select
										value={String(x.batch_extract_concurrency)}
										onValueChange={value =>
											value && x.setBatchExtractConcurrency(value)
										}
									>
										<SelectTrigger
											className='
												w-[140px]
												px-3 py-2
												rounded-4xl
												text-sm
												bg-secondary/60
											'
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												<SelectLabel>
													{t('control.concurrency')}
												</SelectLabel>
												{extract_concurrency_options.map(value => (
													<SelectItem value={value} key={value}>
														{value}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>
						<div className='flex flex-col gap-2'>
							<div className='text-sm font-medium'>{t('control.each_run_processes')}</div>
							<Select
								value={String(x.batch_count)}
								onValueChange={value => value && x.setBatchCount(value)}
							>
								<SelectTrigger
									className='
										px-3 py-2
										rounded-4xl
										text-sm
										bg-secondary/60
									'
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>{t('control.count')}</SelectLabel>
										{count_options.map(value => (
											<SelectItem value={value} key={value}>
												{value}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
						<div
							className='
								p-3
								rounded-3xl
								bg-secondary/30
								border border-border-light
							'
						>
							<div className='flex items-center justify-between gap-3'>
								<div>
									<div className='text-sm font-medium'>
										{t('control.auto_remove_dead_links')}
									</div>
									<div className='text-std-400 text-xs'>
										{t('control.auto_remove_dead_links_desc')}
									</div>
								</div>
								<Switch
									checked={x.batch_auto_remove_dead_links}
									onCheckedChange={x.setBatchAutoRemoveDeadLinks}
								></Switch>
							</div>
						</div>
					</div>
				)}

				{x.batch_panel_tab === 'tasks' && (
					<div className='flex flex-col gap-3'>
						{x.sorted_batch_tasks.length === 0 && (
							<div
								className='
									px-4 py-8
									rounded-3xl
									text-sm text-std-400
									text-center
									bg-secondary/10
									border border-dashed border-border-light
								'
							>
								No scheduled tasks yet.
							</div>
						)}
						{x.sorted_batch_tasks.map(task => (
							<div
								className='
									flex flex-col
									gap-3
									p-4
									rounded-3xl
									bg-secondary/20
									border border-border-light
								'
								key={task.id}
							>
								<div className='flex items-start justify-between gap-3'>
									<div>
										<div className='text-sm font-medium'>
											{x.getBatchTaskActionLabel(task.action)}
											{' · '}
											{t('control.task_links', { count: task.count })}
										</div>
										<div className='text-std-400 text-xs'>
											{t('control.every', {
												value: task.interval_value,
												unit:
													task.interval_unit === 'second'
														? t('control.seconds')
														: t('control.minutes')
											})}
											{task.action === 'fetch' &&
											task.auto_remove_dead_links
												? ` · ${t('control.auto_remove_dead_links_short')}`
												: ''}
											{task.action === 'extract'
												? ` · ${t('control.fastq_concurrency', {
														count: task.extract_concurrency
													})}`
												: ''}
										</div>
									</div>
									<div className='text-right'>
										<div className='text-sm font-medium'>
											{x.getBatchTaskStatusText(task)}
										</div>
										<div className='text-std-400 text-xs'>
											{t('control.run_count', { count: task.runs })}
										</div>
									</div>
								</div>
								<div className='text-std-400 grid gap-1 text-xs'>
									<div>
										{t('control.next_run', {
											value: x.formatBatchAbsoluteTime(task.next_run_at)
										})}
									</div>
									<div>
										{t('control.last_run', {
											value: x.formatBatchAbsoluteTime(task.last_run_at)
										})}
									</div>
									{task.last_error && (
										<div className='text-red-500'>
											{t('control.last_error', { value: task.last_error })}
										</div>
									)}
								</div>
								<div className='flex justify-end gap-2'>
									<Button
										variant='outline'
										size='sm'
										onClick={() => x.toggleBatchTaskEnabled(task.id)}
									>
										{task.enabled ? t('control.pause') : t('control.resume')}
									</Button>
									<Button
										variant='destructive'
										size='sm'
										onClick={() => x.removeBatchTask(task.id)}
									>
										{t('selection.delete')}
									</Button>
								</div>
							</div>
						))}
					</div>
				)}

				<DialogFooter
					className='
						sticky
						bottom-0
						z-10
						flex
						items-center justify-between
						px-1 pt-3
						pb-1
						mt-2
						bg-background/95
						backdrop-blur
					'
				>
					<div className='flex h-8 flex-1'>
						<Tabs
							items={[
								{ key: 'create', title: t('control.add_task_short'), Icon: Plus },
								{
									key: 'tasks',
									title: t('control.task_list', { count: x.batch_task_count }),
									Icon: ListCheck
								}
							]}
							active={x.batch_panel_tab}
							onClick={x.setBatchPanelTab}
						></Tabs>
					</div>
					<div className='flex items-center gap-2'>
						<Button variant='ghost' size='sm' onClick={() => x.setStartDialogOpen(false)}>
							{t('control.close')}
						</Button>
						{x.batch_panel_tab === 'create' && (
							<Button
								size='sm'
								disabled={
									!x.batch_action_fetch_enabled && !x.batch_action_extract_enabled
								}
								onClick={x.startBatchSchedule}
							>
								{t('control.add_tasks')}
							</Button>
						)}
					</div>
				</DialogFooter>
			</div>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
