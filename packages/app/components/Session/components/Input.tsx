import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PauseIcon, PlayIcon } from '@phosphor-icons/react'
import { useMemoizedFn, useToggle } from 'ahooks'
import { Archive, ArrowDownToLine, BrushCleaning, Layers2, Maximize, PackageOpen } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Popover, PopoverContent, PopoverTrigger } from '@/__shadcn__/components/ui/popover'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from '@/__shadcn__/components/ui/select'
import { Textarea } from '@/__shadcn__/components/ui/textarea'
import { ModelSelect, Show, Tooltip } from '@/components'
import { useGlobal } from '@/context'
import { rpc } from '@/utils'

import Mention, { filterMentionItems, formatMentionToken, getActiveMention, getBasename } from './Mention'

import type { AppConfig } from '@core/types'
import type { ChangeEvent, KeyboardEvent, SyntheticEvent } from 'react'
import type { IPropsInput } from '../types'
import type { AgentMentionItem, FileMentionItem, MentionItem, SkillMentionItem } from './Mention'

const submit_modes = [
	{ label: 'Enter Mode', value: 'enter' },
	{ label: 'Ctrl+Enter Mode', value: 'ctrl+enter' }
]

const session_modes = [
	{ label: 'Normal', value: 'normal' },
	{ label: 'Plan', value: 'plan' },
	{ label: 'Plan-Exec', value: 'plan-exec' }
]

const audit_modes = [
	{ label: 'Limited', value: 'limited' },
	{ label: 'Auto', value: 'auto' },
	{ label: 'Full Access', value: 'full' }
]

const effort_modes = [
	{ label: 'Default', value: 'default' },
	{ label: 'Low', value: 'low' },
	{ label: 'Medium', value: 'medium' },
	{ label: 'High', value: 'high' },
	{ label: 'XHigh', value: 'xhigh' }
]

const builtin_system_skills = [
	{
		key: 'builtin-skill-creator',
		label: 'skill-creator',
		desc: 'Create or update reusable local skills from repeated workflows or failure patterns.'
	},
	{
		key: 'builtin-skill-installer',
		label: 'skill-installer',
		desc: 'Install a curated skill or a skill from another repository into the local skills directory.'
	}
] satisfies Array<Pick<SkillMentionItem, 'key' | 'label' | 'desc'>>

const Index = (props: IPropsInput) => {
	const {
		session_id,
		type,
		streaming,
		archived,
		mode,
		audit_mode,
		draft_input,
		show_session_mode_select,
		show_audit_mode_select,
		send,
		stop,
		clear,
		archive,
		unarchive,
		scrollToBottom,
		toggleContextModal,
		setMode,
		setAuditMode
	} = props
	const global = useGlobal()
	const ref = useRef<HTMLTextAreaElement>(null)
	const [compositing, { setLeft, setRight }] = useToggle(false)
	const [full, { toggle: toggleFull }] = useToggle(false)
	const [value, setValue] = useState('')
	const [cursor, setCursor] = useState(0)
	const [skill_items, setSkillItems] = useState<Array<SkillMentionItem>>([])
	const [agent_items, setAgentItems] = useState<Array<AgentMentionItem>>([])
	const [file_items, setFileItems] = useState<Array<FileMentionItem>>([])
	const [loading_skills, setLoadingSkills] = useState(false)
	const [loading_agents, setLoadingAgents] = useState(false)
	const [loading_files, setLoadingFiles] = useState(false)
	const [active_index, setActiveIndex] = useState(0)
	const skill_items_loaded = useRef(false)
	const agent_items_loaded_session_id = useRef('')
	const file_items_loaded_session_id = useRef('')
	const skill_items_requested = useRef(false)
	const agent_items_requested_session_id = useRef('')
	const file_items_requested_session_id = useRef('')

	const s = global.setting
	const is_page = type === 'page' || type === 'dialog'
	const active_mention = getActiveMention(value, cursor)
	const mention_items = active_mention
		? filterMentionItems(
				active_mention.trigger === '/' ? skill_items : [...agent_items, ...file_items],
				active_mention.query
			)
		: []
	const mention_open = !!active_mention
	const mention_loading =
		active_mention?.trigger === '/'
			? loading_skills
			: active_mention?.trigger === '@'
				? loading_agents || loading_files
				: false

	useLayoutEffect(() => {
		const el = ref.current

		if (!el) return

		el.addEventListener('compositionstart', setRight)
		el.addEventListener('compositionend', setLeft)

		return () => {
			el.removeEventListener('compositionstart', setRight)
			el.removeEventListener('compositionend', setLeft)
		}
	}, [])

	useEffect(() => {
		if (active_mention?.trigger !== '/') {
			skill_items_requested.current = false

			return
		}

		if (skill_items_loaded.current || skill_items_requested.current) {
			return
		}

		let canceled = false

		skill_items_requested.current = true
		setLoadingSkills(true)

		void rpc.skill.query
			.query()
			.then(items => {
				if (canceled) return

				const builtin_map = new Map(
					builtin_system_skills.map(item => [
						item.label,
						{
							...item,
							type: 'skill' as const,
							path: `builtin://${item.label}`,
							skill_type: 'system',
							search_text: `${item.label} ${item.desc}`.toLowerCase()
						}
					])
				)

				for (const item of items) {
					builtin_map.set(item.name, {
						key: item.id,
						type: 'skill',
						label: item.name,
						desc: item.desc || '',
						path: item.path,
						skill_type: builtin_map.has(item.name) ? 'system' : item.type || '',
						search_text: `${item.name} ${item.desc || ''} ${item.path || ''}`.toLowerCase()
					})
				}

				setSkillItems(Array.from(builtin_map.values()))
				skill_items_loaded.current = true
			})
			.catch(() => {
				if (!canceled) {
					setSkillItems([])
				}
			})
			.finally(() => {
				if (!canceled) {
					setLoadingSkills(false)
				}
			})

		return () => {
			canceled = true
		}
	}, [active_mention?.trigger])

	useEffect(() => {
		if (active_mention?.trigger !== '@') {
			agent_items_requested_session_id.current = ''

			return
		}

		if (
			agent_items_loaded_session_id.current === session_id ||
			agent_items_requested_session_id.current === session_id
		) {
			return
		}

		let canceled = false

		agent_items_requested_session_id.current = session_id
		setAgentItems([])
		setLoadingAgents(true)

		void rpc.session.getMentionAgents
			.query({ id: session_id })
			.then(items => {
				if (canceled) return

				setAgentItems(
					items.map(item => ({
						key: item.id,
						type: 'agent',
						label: item.name,
						role: item.role || '',
						desc: item.description || '',
						photo: item.photo ?? null,
						avatar: item.avatar ?? null,
						search_text:
							`${item.name} ${item.role || ''} ${item.description || ''}`.toLowerCase()
					}))
				)
				agent_items_loaded_session_id.current = session_id
			})
			.catch(() => {
				if (!canceled) {
					setAgentItems([])
				}
			})
			.finally(() => {
				if (!canceled) {
					setLoadingAgents(false)
				}
			})

		return () => {
			canceled = true
		}
	}, [active_mention?.trigger, session_id])

	useEffect(() => {
		if (active_mention?.trigger !== '@') {
			file_items_requested_session_id.current = ''

			return
		}

		if (
			file_items_loaded_session_id.current === session_id ||
			file_items_requested_session_id.current === session_id
		) {
			return
		}

		let canceled = false

		file_items_requested_session_id.current = session_id
		setFileItems([])
		setLoadingFiles(true)

		void rpc.session.getMentionFiles
			.query({ id: session_id })
			.then(res => {
				if (canceled) return

				setFileItems(
					res.items.map(item => ({
						key: item.absolute_path,
						type: 'file',
						label: item.path,
						path: item.path,
						basename: getBasename(item.path),
						file_kind: item.type,
						search_text: item.path.toLowerCase()
					}))
				)
				file_items_loaded_session_id.current = session_id
			})
			.catch(() => {
				if (!canceled) {
					setFileItems([])
				}
			})
			.finally(() => {
				if (!canceled) {
					setLoadingFiles(false)
				}
			})

		return () => {
			canceled = true
		}
	}, [active_mention?.trigger, session_id])

	useEffect(() => {
		const el = ref.current

		if (!draft_input) {
			return
		}

		setValue(draft_input.value)
		setCursor(draft_input.value.length)

		requestAnimationFrame(() => {
			if (!el) return

			el.focus()
			el.setSelectionRange(draft_input.value.length, draft_input.value.length)
		})
	}, [draft_input?.key])

	useEffect(() => {
		setActiveIndex(0)
	}, [active_mention?.trigger, active_mention?.query])

	const onChangeDefaultMode = useMemoizedFn(v => {
		s.setConfig('config', { default_model: v } as AppConfig, true)
	})

	const onChangeDefaultEffort = useMemoizedFn(v => {
		const default_model = s.config?.default_model

		if (!default_model) return

		s.setConfig('config', { default_model: { ...default_model, effort: v } } as AppConfig, true)
	})

	const onChangeSubmitMode = useMemoizedFn(v => {
		s.setConfig('config', { submit_mode: v } as AppConfig, true)
	})

	const syncCursor = useMemoizedFn((target: HTMLTextAreaElement) => {
		setCursor(target.selectionStart ?? 0)
	})

	const onChangeValue = useMemoizedFn((e: ChangeEvent<HTMLTextAreaElement>) => {
		setValue(e.currentTarget.value)
		syncCursor(e.currentTarget)
	})

	const onSelectTextarea = useMemoizedFn((e: SyntheticEvent<HTMLTextAreaElement>) => {
		syncCursor(e.currentTarget)
	})

	const applyMention = useMemoizedFn((item: MentionItem) => {
		const mention = getActiveMention(value, cursor)

		if (!mention) return

		const token = formatMentionToken(item)
		const next_value = `${value.slice(0, mention.start)}${token}${value.slice(mention.end)}`
		const next_cursor = mention.start + token.length

		setValue(next_value)
		setCursor(next_cursor)

		requestAnimationFrame(() => {
			const el = ref.current

			if (!el) return

			el.focus()
			el.setSelectionRange(next_cursor, next_cursor)
		})
	})

	const onSend = useMemoizedFn(() => {
		if (streaming || compositing) return
		if (!value) return

		send(value)
		setValue('')
		setCursor(0)
	})

	const onSubmit = useMemoizedFn((e: KeyboardEvent<HTMLTextAreaElement>) => {
		const submit_mode = s.config?.submit_mode || 'enter'
		const textarea = e.currentTarget

		if (streaming || compositing) return

		if (mention_open && mention_items.length > 0) {
			if (e.key === 'ArrowDown') {
				e.preventDefault()

				return setActiveIndex(index => (index + 1) % mention_items.length)
			}

			if (e.key === 'ArrowUp') {
				e.preventDefault()

				return setActiveIndex(index => (index - 1 + mention_items.length) % mention_items.length)
			}

			if (e.key === 'Enter' || e.key === 'Tab') {
				e.preventDefault()

				return applyMention(mention_items[Math.min(active_index, mention_items.length - 1)])
			}
		}

		if (submit_mode === 'enter') {
			if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
				e.preventDefault()

				return onSend()
			}

			if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault()

				textarea.setRangeText('\n', textarea.selectionStart, textarea.selectionEnd, 'end')
				textarea.dispatchEvent(new Event('input', { bubbles: true }))

				return
			}
		} else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault()

			return onSend()
		}
	})

	const Icon = streaming ? PauseIcon : PlayIcon
	const RightArchiveIcon = archived ? PackageOpen : Archive

	return (
		<div
			className={$cx(
				'relative w-full px-3',
				full &&
					`
				absolute!
				z-50
				h-full
				pt-3
				backdrop-blur-lg
			`,
				is_page && 'page_wrap py-0',
				type === 'dialog' && 'px-px!'
			)}
		>
			<Popover open={mention_open}>
				<PopoverTrigger>
					<div className={$cx('flex flex-col', full && 'h-full')}>
						<div
							className='
								flex flex-col flex-1
								rounded-lg
								bg-card
								border-t border-border-light/36
								shadow
							'
						>
							<Textarea
								className={$cx(
									`
									min-h-[54px] max-h-[300px]
									pb-0
									bg-transparent
									border-none
									focus-visible:ring-0
								`,
									full && 'h-full max-h-full'
								)}
								ref={ref}
								autoFocus
								placeholder='What would you like to know?'
								maxLength={9999}
								value={value}
								onChange={onChangeValue}
								onKeyDown={onSubmit}
								onSelect={onSelectTextarea}
							></Textarea>
							<div
								className='
									flex
									items-center justify-between
									w-full
									px-2 py-1
									rounded-lg
									bg-card
								'
							>
								<div className='flex items-center gap-1.5'>
									<button className='icon_button' onClick={toggleFull}>
										<Maximize></Maximize>
									</button>
									<ModelSelect
										ghost
										value={s.config?.default_model}
										onChange={onChangeDefaultMode}
									></ModelSelect>
									<Select
										items={effort_modes}
										value={s.config?.default_model?.effort ?? 'default'}
										onValueChange={onChangeDefaultEffort}
									>
										<SelectTrigger
											className='
												h-auto!
												p-0
												ml-1
												text-xsm! text-std-400
												bg-transparent
											'
											noActiveStyle
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent
											className='w-[120px]'
											alignItemWithTrigger={false}
											side='top'
										>
											<SelectGroup>
												<SelectLabel>Effort</SelectLabel>
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
								<div className='flex items-center gap-3'>
									{show_session_mode_select && (
										<Select
											items={session_modes}
											value={mode}
											onValueChange={setMode}
										>
											<SelectTrigger
												className='
													h-auto!
													p-0
													text-xsm! text-std-400
													bg-transparent
												'
												noActiveStyle
											>
												<SelectValue />
											</SelectTrigger>
											<SelectContent
												className='w-[120px]'
												alignItemWithTrigger={false}
												side='top'
											>
												<SelectGroup>
													<SelectLabel>Mode</SelectLabel>
													{session_modes.map(item => (
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
									)}
									<button
										className='icon_button primary h-6 w-6'
										onClick={streaming ? stop : onSend}
									>
										<Icon
											className='fill-std-white h-[10px] w-[10px]'
											weight='fill'
										></Icon>
									</button>
								</div>
							</div>
						</div>
						<div
							className='
								flex
								items-center justify-between
								w-full
								px-2 py-1.5
								text-xs
							'
						>
							<div className='flex gap-1.5'>
								{show_audit_mode_select && (
									<Select
										items={audit_modes}
										value={audit_mode}
										onValueChange={setAuditMode}
									>
										<SelectTrigger
											className={$cx(
												`
												h-auto!
												p-0
												text-xs
												bg-transparent
											`,
												audit_mode === 'full'
													? 'text-red-700/72 dark:text-red-300/72'
													: 'text-std-400'
											)}
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent className='w-[150px]' align='start'>
											<SelectGroup>
												<SelectLabel>Audit Mode</SelectLabel>
												{audit_modes.map(item => (
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
								)}
								<Select
									items={submit_modes}
									value={s.config?.submit_mode ?? 'enter'}
									onValueChange={onChangeSubmitMode}
								>
									<SelectTrigger
										className='
											h-auto!
											p-0
											text-xs text-std-400
											bg-transparent
										'
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent className='w-[150px]' align='start'>
										<SelectGroup>
											<SelectLabel>Submit Mode</SelectLabel>
											{submit_modes.map(item => (
												<SelectItem value={item.value} key={item.value}>
													{item.label}
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
								<Tooltip title='Clear'>
									<div className='icon_button h-5 w-5' onClick={clear}>
										<BrushCleaning className='stroke-std-400 h-[12px] w-[12px]'></BrushCleaning>
									</div>
								</Tooltip>
								<Show visible={archived}>
									<Tooltip title='Unarchive'>
										<div className='icon_button h-5 w-5' onClick={unarchive}>
											<RightArchiveIcon className='stroke-std-400 h-[12px] w-[12px]'></RightArchiveIcon>
										</div>
									</Tooltip>
								</Show>
							</div>
							<div className='flex gap-1'>
								<Tooltip title='Context'>
									<div className='icon_button h-5 w-5' onClick={toggleContextModal}>
										<Layers2 className='stroke-std-400 h-[12px] w-[12px]'></Layers2>
									</div>
								</Tooltip>
								<Tooltip title='Scroll to bottom'>
									<div className='icon_button h-5 w-5' onClick={scrollToBottom}>
										<ArrowDownToLine className='stroke-std-400 h-[12px] w-[12px]'></ArrowDownToLine>
									</div>
								</Tooltip>
								<Tooltip title='Archive'>
									<div className='icon_button h-5 w-5' onClick={archive}>
										<Archive className='stroke-std-400 h-[12px] w-[12px]'></Archive>
									</div>
								</Tooltip>
							</div>
						</div>
					</div>
				</PopoverTrigger>
				<PopoverContent
					className='
						overflow-visible
						p-0
						rounded-none
						bg-transparent
						ring-0
						shadow-none
					'
					side='top'
					align='start'
					sideOffset={10}
				>
					<Mention
						activeMention={active_mention}
						items={mention_items}
						loading={mention_loading}
						activeIndex={active_index}
						onSelect={applyMention}
					/>
				</PopoverContent>
			</Popover>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
