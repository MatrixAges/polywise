import { PencilLine } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from '@/__shadcn__/components/ui/select'
import { ModelSelect, TextTabs } from '@/components'

import { useModel } from '../context'
import AgentAvatar from './AgentAvatar'
import ArticlesPanel from './ArticlesPanel'
import EditableField from './EditableField'
import SkillSelect from './SkillSelect'

const tabs = ['prompt', 'soul', 'identity', 'memory', 'article'] as const
const effort_modes = [
	{ label: 'Default', value: 'default' },
	{ label: 'None', value: 'none' },
	{ label: 'Minimal', value: 'minimal' },
	{ label: 'Low', value: 'low' },
	{ label: 'Medium', value: 'medium' },
	{ label: 'High', value: 'high' },
	{ label: 'XHigh', value: 'xhigh' },
	{ label: 'Max', value: 'max' }
]

const Index = () => {
	const {
		selected_agent,
		current_tab,
		edit_field_key,
		setCurrentTab,
		startEditField,
		cancelEditField,
		submitEditableField,
		setModel,
		setModelEffort,
		openAvatarDialog
	} = useModel()

	if (!selected_agent) {
		return (
			<div
				className='
					flex flex-1
					items-center justify-center
					text-sm text-std-400
				'
			>
				Select an agent
			</div>
		)
	}

	const active_tab = current_tab === 'sessions' ? 'prompt' : current_tab
	const field_value =
		active_tab === 'article' ? '' : (selected_agent[active_tab] as string | null | undefined) || ''

	return (
		<div
			className='
				overflow-hidden
				flex flex-1 flex-col
			'
		>
			<div
				className='
					overflow-y-scroll
					flex flex-1 flex-col
					min-h-0
				'
			>
				<div
					className='
						flex flex-col
						w-full max-w-5xl
						gap-5
						mx-auto
					'
				>
					<div
						className='
							relative
							overflow-hidden
							p-6
							bg-card
							border border-border-light
						'
					>
						<div
							className='
								absolute
								inset-x-0 top-0
								h-24
								bg-linear-to-r
								from-secondary/40 via-secondary/10 to-transparent
							'
						></div>
						<div className='relative flex flex-col gap-6'>
							<div
								className='
									flex flex-col
									gap-5
									xl:flex-row xl:items-start xl:justify-between
								'
							>
								<div
									className='
										flex flex-1 flex-col
										gap-5
										sm:flex-row sm:items-start
									'
								>
									<div className='flex flex-col items-start gap-3'>
										<button
											className='clickable relative w-fit'
											type='button'
											onClick={openAvatarDialog}
										>
											<AgentAvatar
												item={selected_agent}
												size='large'
											></AgentAvatar>
											<span
												className='
													absolute
													right-[-6px] bottom-[-6px]
													flex
													items-center justify-center
													w-8 h-8
													rounded-full
													bg-card
													border border-border-light
													shadow-sm
												'
											>
												<PencilLine className='size-3.5'></PencilLine>
											</span>
										</button>
										<button
											className='click_button text-xs'
											type='button'
											onClick={openAvatarDialog}
										>
											<PencilLine className='size-3.5'></PencilLine>
											Edit avatar
										</button>
									</div>
									<div
										className='
											flex flex-1 flex-col
											min-w-0
											gap-3
										'
									>
										<div className='flex flex-col gap-2'>
											{edit_field_key === 'name' ? (
												<EditableField
													active
													value={selected_agent.name}
													onSubmit={value =>
														submitEditableField({
															id: selected_agent.id,
															key: 'name',
															value
														})
													}
													onCancel={cancelEditField}
												></EditableField>
											) : (
												<div
													className='clickable text-2xl font-semibold tracking-tight'
													onClick={() => startEditField('name')}
												>
													{selected_agent.name}
												</div>
											)}
											{edit_field_key === 'description' ? (
												<EditableField
													active
													value={selected_agent.description || ''}
													placeholder='Description'
													onSubmit={value =>
														submitEditableField({
															id: selected_agent.id,
															key: 'description',
															value
														})
													}
													onCancel={cancelEditField}
												></EditableField>
											) : (
												<div
													className='
														max-w-2xl
														text-std-400 text-sm leading-6
														clickable
													'
													onClick={() =>
														startEditField('description')
													}
												>
													{selected_agent.description ||
														'Add a short description for this agent'}
												</div>
											)}
										</div>
									</div>
								</div>
								<div
									className='
										flex flex-col
										w-full max-w-md
										gap-4
										xl:pl-4
									'
								>
									<div className='flex flex-col gap-2'>
										<span
											className='
												text-std-400 text-xs font-medium
												tracking-[0.16em]
												uppercase
											'
										>
											Model
										</span>
										<ModelSelect
											value={selected_agent.model}
											onChange={setModel}
										></ModelSelect>
									</div>
									<div className='flex flex-col gap-2'>
										<span
											className='
												text-std-400 text-xs font-medium
												tracking-[0.16em]
												uppercase
											'
										>
											Effort
										</span>
										<Select
											items={effort_modes}
											value={selected_agent.model?.effort ?? 'default'}
											onValueChange={value => {
												if (!value) return
												void setModelEffort(value)
											}}
										>
											<SelectTrigger className='w-full justify-between'>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													<SelectLabel>
														Reasoning Effort
													</SelectLabel>
													{effort_modes.map(item => (
														<SelectItem
															value={item.value}
															key={item.value}
														>
															{item.label}
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>
									</div>
									<div
										className='
											p-3
											bg-secondary/20
											border border-border-light
										'
									>
										<SkillSelect></SkillSelect>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div
						className='
							overflow-hidden
							bg-card
							border border-border-light
						'
					>
						<div
							className='
								flex
								h-11
								px-5
								border-border-light border-b
							'
						>
							<TextTabs
								items={[...tabs]}
								active={active_tab}
								setActive={setCurrentTab}
							></TextTabs>
						</div>
						<div className='min-h-[420px] p-5'>
							{active_tab === 'article' ? (
								<ArticlesPanel></ArticlesPanel>
							) : edit_field_key === active_tab ? (
								<EditableField
									active
									multiline
									value={field_value}
									placeholder={`Edit ${active_tab}`}
									onSubmit={value =>
										submitEditableField({
											id: selected_agent.id,
											key: active_tab,
											value
										})
									}
									onCancel={cancelEditField}
								></EditableField>
							) : (
								<div
									className='
											min-h-[320px]
											p-4
											text-sm leading-6
											whitespace-pre-wrap
											bg-secondary/10
											border border-border-light
											clickable
										'
									onClick={() => startEditField(active_tab)}
								>
									{field_value || `Add ${active_tab}`}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
