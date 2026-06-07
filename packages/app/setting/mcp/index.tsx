import { useEffect, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Badge } from '@/__shadcn__/components/ui/badge'
import { Button } from '@/__shadcn__/components/ui/button'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from '@/__shadcn__/components/ui/field'
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
import { Textarea } from '@/__shadcn__/components/ui/textarea'
import { useGlobal } from '@/context'

import type { AppConfig, McpConfig, McpLocalConfig, McpRemoteConfig } from '@core/types'

type DraftMcpItem = {
	id: string
	name: string
	type: 'local' | 'remote'
	enabled: boolean
	timeout: string
	command: string
	environment: string
	url: string
	headers: string
	oauth_enabled: boolean
	oauth_client_id: string
	oauth_client_secret: string
	oauth_scope: string
	oauth_redirect_uri: string
}

type DraftState = {
	enabled: boolean
	items: Array<DraftMcpItem>
}

const createDraftId = () =>
	typeof crypto !== 'undefined' && 'randomUUID' in crypto
		? crypto.randomUUID()
		: Math.random().toString(36).slice(2)

const emptyJsonObject = '{}'
const emptyJsonArray = '[]'

const createDraftItem = (): DraftMcpItem => ({
	id: createDraftId(),
	name: '',
	type: 'local',
	enabled: true,
	timeout: '',
	command: emptyJsonArray,
	environment: emptyJsonObject,
	url: '',
	headers: emptyJsonObject,
	oauth_enabled: false,
	oauth_client_id: '',
	oauth_client_secret: '',
	oauth_scope: '',
	oauth_redirect_uri: ''
})

const parseJsonObject = (value: string, field: string) => {
	try {
		const parsed = JSON.parse(value || '{}') as unknown

		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			throw new Error(`${field} must be a JSON object`)
		}

		const entries = Object.entries(parsed)
		const invalid_entry = entries.find(([, entry_value]) => typeof entry_value !== 'string')

		if (invalid_entry) {
			throw new Error(`${field} values must all be strings`)
		}

		return Object.fromEntries(entries) as Record<string, string>
	} catch (error) {
		const message = error instanceof Error ? error.message : `Invalid ${field}`

		throw new Error(message)
	}
}

const parseCommand = (value: string) => {
	try {
		const parsed = JSON.parse(value || '[]') as unknown

		if (!Array.isArray(parsed) || parsed.some(item => typeof item !== 'string')) {
			throw new Error('command must be a JSON string array')
		}

		const command = parsed.map(item => item.trim()).filter(Boolean)

		if (!command.length) {
			throw new Error('command must contain at least one executable entry')
		}

		return command
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Invalid command'

		throw new Error(message)
	}
}

const parseTimeout = (value: string) => {
	if (!value.trim()) {
		return undefined
	}

	const next = Number(value)

	if (!Number.isFinite(next) || next <= 0) {
		throw new Error('timeout must be a positive number in milliseconds')
	}

	return Math.round(next)
}

const toDraftState = (config?: McpConfig): DraftState => {
	const items = Object.entries(config ?? {})
		.filter(([key, value]) => key !== 'enabled' && value && typeof value === 'object' && !Array.isArray(value))
		.map(([name, value]) => {
			const item = value as McpLocalConfig | McpRemoteConfig
			const oauth = item.type === 'remote' && item.oauth !== false ? item.oauth : undefined

			return {
				id: createDraftId(),
				name,
				type: item.type,
				enabled: item.enabled ?? true,
				timeout: item.timeout ? String(item.timeout) : '',
				command: item.type === 'local' ? JSON.stringify(item.command ?? [], null, 2) : emptyJsonArray,
				environment:
					item.type === 'local' ? JSON.stringify(item.environment ?? {}, null, 2) : emptyJsonObject,
				url: item.type === 'remote' ? item.url : '',
				headers: item.type === 'remote' ? JSON.stringify(item.headers ?? {}, null, 2) : emptyJsonObject,
				oauth_enabled: !!oauth,
				oauth_client_id: oauth?.clientId ?? '',
				oauth_client_secret: oauth?.clientSecret ?? '',
				oauth_scope: oauth?.scope ?? '',
				oauth_redirect_uri: oauth?.redirectUri ?? ''
			}
		})

	return {
		enabled: config?.enabled !== false,
		items
	}
}

const buildConfig = (draft: DraftState): McpConfig => {
	const next_config: McpConfig = {
		enabled: draft.enabled
	}
	const name_set = new Set<string>()

	for (const item of draft.items) {
		const name = item.name.trim()

		if (!name) {
			throw new Error('Each MCP server needs a name')
		}

		if (name_set.has(name)) {
			throw new Error(`Duplicate MCP server name "${name}"`)
		}

		name_set.add(name)

		const timeout = parseTimeout(item.timeout)

		if (item.type === 'local') {
			next_config[name] = {
				type: 'local',
				enabled: item.enabled,
				command: parseCommand(item.command),
				environment: parseJsonObject(item.environment, `${name} environment`),
				...(timeout ? { timeout } : {})
			}

			continue
		}

		const url = item.url.trim()

		if (!url) {
			throw new Error(`Remote MCP server "${name}" requires a URL`)
		}

		next_config[name] = {
			type: 'remote',
			enabled: item.enabled,
			url,
			headers: parseJsonObject(item.headers, `${name} headers`),
			oauth: item.oauth_enabled
				? {
						clientId: item.oauth_client_id.trim() || undefined,
						clientSecret: item.oauth_client_secret.trim() || undefined,
						scope: item.oauth_scope.trim() || undefined,
						redirectUri: item.oauth_redirect_uri.trim() || undefined
					}
				: false,
			...(timeout ? { timeout } : {})
		}
	}

	return next_config
}

const Index = () => {
	const global = useGlobal()
	const s = global.setting
	const { t } = useTranslation('setting')
	const [draft, setDraft] = useState<DraftState>(() => toDraftState())
	const type_options = [
		{ label: t('mcp.option_local'), value: 'local' },
		{ label: t('mcp.option_remote'), value: 'remote' }
	] as const

	useEffect(() => {
		setDraft(toDraftState(s.config?.mcp))
	}, [s.config?.mcp])

	const updateDraft = useMemoizedFn((updater: (current: DraftState) => DraftState) => {
		setDraft(current => updater(current))
	})

	const updateItem = useMemoizedFn((id: string, patch: Partial<DraftMcpItem>) => {
		updateDraft(current => ({
			...current,
			items: current.items.map(item => (item.id === id ? { ...item, ...patch } : item))
		}))
	})

	const addItem = useMemoizedFn(() => {
		updateDraft(current => ({
			...current,
			items: [...current.items, createDraftItem()]
		}))
	})

	const removeItem = useMemoizedFn((id: string) => {
		updateDraft(current => ({
			...current,
			items: current.items.filter(item => item.id !== id)
		}))
	})

	const resetDraft = useMemoizedFn(() => {
		setDraft(toDraftState(s.config?.mcp))
	})

	const saveDraft = useMemoizedFn(async () => {
		try {
			const mcp = buildConfig(draft)

			await s.setConfig('config', { mcp } as Partial<AppConfig>, true)
			toast.success(t('mcp.toast_saved'))
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error))
		}
	})

	return (
		<div
			className='
				overflow-y-scroll
				flex flex-col
				w-full h-full
				page_wrap
			'
		>
			<div
				className='
					flex
					items-center justify-between
					gap-3
					py-1
					mb-3
				'
			>
				<div className='flex flex-col gap-3'>
					<h1 className='text-xl font-semibold'>{t('mcp.title')}</h1>
					<p className='text-std-500 text-sm'>{t('mcp.desc')}</p>
				</div>
				<div className='flex flex-wrap items-center gap-2'>
					<Button type='button' variant='outline' size='sm' onClick={resetDraft}>
						<RotateCcw className='size-4' />
						<span>{t('mcp.reset')}</span>
					</Button>
					<Button type='button' size='sm' onClick={() => void saveDraft()}>
						<Save className='size-4' />
						<span>{t('mcp.save')}</span>
					</Button>
				</div>
			</div>
			<FieldGroup className='gap-0'>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>{t('mcp.enable')}</FieldTitle>
					</FieldContent>
					<Switch
						checked={draft.enabled}
						onCheckedChange={checked =>
							updateDraft(current => ({
								...current,
								enabled: checked
							}))
						}
					/>
				</Field>
			</FieldGroup>
			<div className='bg-border-light my-2 h-px w-full' />
			<div className='flex items-center justify-between py-1'>
				<div className='flex flex-col gap-1'>
					<span className='text-base font-medium'>{t('mcp.servers')}</span>
					<span className='text-std-500 text-sm'>{t('mcp.servers_desc')}</span>
				</div>
				<Button type='button' variant='outline' onClick={addItem}>
					<Plus className='size-4' />
					<span>{t('mcp.add_server')}</span>
				</Button>
			</div>
			<div
				className='
					flex flex-col
					gap-4
					pb-6
					mt-2
				'
			>
				{draft.items.length ? (
					draft.items.map(item => (
						<div
							className='
								flex flex-col
								gap-4
								p-4
								rounded-2xl
								bg-card/70
								border border-border-light
							'
							key={item.id}
						>
							<div
								className='
									flex flex-wrap
									items-center justify-between
									gap-3
								'
							>
								<div className='flex flex-wrap items-center gap-2'>
									<Badge variant='outline'>
										{item.type === 'remote'
											? t('mcp.remote_badge')
											: t('mcp.local_badge')}
									</Badge>
									<Badge variant={item.enabled ? 'secondary' : 'outline'}>
										{item.enabled ? t('mcp.enabled') : t('mcp.disabled')}
									</Badge>
								</div>
								<Button
									type='button'
									size='sm'
									variant='outline'
									onClick={() => removeItem(item.id)}
								>
									<Trash2 className='size-4' />
									<span>{t('mcp.remove')}</span>
								</Button>
							</div>
							<div className='grid gap-4 md:grid-cols-2'>
								<Field className='gap-2' orientation='vertical'>
									<FieldContent>
										<FieldTitle>{t('mcp.type')}</FieldTitle>
										<FieldDescription>{t('mcp.type_desc')}</FieldDescription>
									</FieldContent>
									<Select
										value={item.type}
										onValueChange={value =>
											value &&
											updateItem(item.id, {
												type: value as DraftMcpItem['type']
											})
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent align='start'>
											<SelectGroup>
												<SelectLabel>
													{t('mcp.server_type')}
												</SelectLabel>
												{type_options.map(option => (
													<SelectItem
														value={option.value}
														key={option.value}
													>
														{option.label}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								</Field>
								<Field className='gap-2' orientation='vertical'>
									<FieldContent>
										<FieldTitle>{t('mcp.name')}</FieldTitle>
										<FieldDescription>{t('mcp.name_desc')}</FieldDescription>
									</FieldContent>
									<Input
										value={item.name}
										placeholder='filesystem'
										onChange={event =>
											updateItem(item.id, { name: event.target.value })
										}
									/>
								</Field>
								<Field className='gap-2' orientation='vertical'>
									<FieldContent>
										<FieldTitle>{t('mcp.timeout')}</FieldTitle>
										<FieldDescription>{t('mcp.timeout_desc')}</FieldDescription>
									</FieldContent>
									<Input
										value={item.timeout}
										placeholder='5000'
										onChange={event =>
											updateItem(item.id, { timeout: event.target.value })
										}
									/>
								</Field>
								<Field className='gap-2' orientation='vertical'>
									<FieldContent>
										<FieldTitle>{t('mcp.enabled_title')}</FieldTitle>
										<FieldDescription>{t('mcp.enabled_desc')}</FieldDescription>
									</FieldContent>
									<div className='flex h-10 items-center'>
										<Switch
											checked={item.enabled}
											onCheckedChange={checked =>
												updateItem(item.id, { enabled: checked })
											}
										/>
									</div>
								</Field>
							</div>
							{item.type === 'local' ? (
								<div className='grid gap-4'>
									<Field className='gap-2' orientation='vertical'>
										<FieldContent>
											<FieldTitle>{t('mcp.command_json')}</FieldTitle>
											<FieldDescription>
												{t('mcp.command_json_desc')}
											</FieldDescription>
										</FieldContent>
										<Textarea
											className='min-h-28 font-mono text-xs'
											value={item.command}
											onChange={event =>
												updateItem(item.id, {
													command: event.target.value
												})
											}
										/>
									</Field>
									<Field className='gap-2' orientation='vertical'>
										<FieldContent>
											<FieldTitle>{t('mcp.environment_json')}</FieldTitle>
											<FieldDescription>
												{t('mcp.environment_json_desc')}
											</FieldDescription>
										</FieldContent>
										<Textarea
											className='min-h-28 font-mono text-xs'
											value={item.environment}
											onChange={event =>
												updateItem(item.id, {
													environment: event.target.value
												})
											}
										/>
									</Field>
								</div>
							) : (
								<div className='grid gap-4'>
									<Field className='gap-2' orientation='vertical'>
										<FieldContent>
											<FieldTitle>{t('mcp.url')}</FieldTitle>
											<FieldDescription>
												{t('mcp.url_desc')}
											</FieldDescription>
										</FieldContent>
										<Input
											value={item.url}
											placeholder='https://example.com/mcp'
											onChange={event =>
												updateItem(item.id, { url: event.target.value })
											}
										/>
									</Field>
									<Field className='gap-2' orientation='vertical'>
										<FieldContent>
											<FieldTitle>{t('mcp.headers_json')}</FieldTitle>
											<FieldDescription>
												{t('mcp.headers_json_desc')}
											</FieldDescription>
										</FieldContent>
										<Textarea
											className='min-h-28 font-mono text-xs'
											value={item.headers}
											onChange={event =>
												updateItem(item.id, {
													headers: event.target.value
												})
											}
										/>
									</Field>
									<Field className='gap-2' orientation='vertical'>
										<FieldContent>
											<FieldTitle>{t('mcp.oauth')}</FieldTitle>
											<FieldDescription>
												{t('mcp.oauth_desc')}
											</FieldDescription>
										</FieldContent>
										<div className='flex h-10 items-center'>
											<Switch
												checked={item.oauth_enabled}
												onCheckedChange={checked =>
													updateItem(item.id, {
														oauth_enabled: checked
													})
												}
											/>
										</div>
									</Field>
									{item.oauth_enabled && (
										<div className='grid gap-4 md:grid-cols-2'>
											<Field className='gap-2' orientation='vertical'>
												<FieldContent>
													<FieldTitle>
														{t('mcp.client_id')}
													</FieldTitle>
												</FieldContent>
												<Input
													value={item.oauth_client_id}
													onChange={event =>
														updateItem(item.id, {
															oauth_client_id:
																event.target.value
														})
													}
												/>
											</Field>
											<Field className='gap-2' orientation='vertical'>
												<FieldContent>
													<FieldTitle>
														{t('mcp.client_secret')}
													</FieldTitle>
												</FieldContent>
												<Input
													value={item.oauth_client_secret}
													onChange={event =>
														updateItem(item.id, {
															oauth_client_secret:
																event.target.value
														})
													}
												/>
											</Field>
											<Field className='gap-2' orientation='vertical'>
												<FieldContent>
													<FieldTitle>{t('mcp.scope')}</FieldTitle>
												</FieldContent>
												<Input
													value={item.oauth_scope}
													onChange={event =>
														updateItem(item.id, {
															oauth_scope:
																event.target.value
														})
													}
												/>
											</Field>
											<Field className='gap-2' orientation='vertical'>
												<FieldContent>
													<FieldTitle>
														{t('mcp.redirect_uri')}
													</FieldTitle>
												</FieldContent>
												<Input
													value={item.oauth_redirect_uri}
													onChange={event =>
														updateItem(item.id, {
															oauth_redirect_uri:
																event.target.value
														})
													}
												/>
											</Field>
										</div>
									)}
								</div>
							)}
						</div>
					))
				) : (
					<div
						className='
							flex flex-col
							items-center justify-center
							px-6 py-10
							rounded-2xl
							text-center
							bg-card/50
							border border-dashed border-border-light
						'
					>
						<div className='text-sm font-medium'>{t('mcp.no_servers')}</div>
						<div className='text-std-500 mt-1 text-sm'>{t('mcp.no_servers_desc')}</div>
					</div>
				)}
			</div>
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()
