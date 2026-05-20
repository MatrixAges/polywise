import { useEffect, useMemo, useState } from 'react'
import { MessageCircle, Plus, RefreshCw, Trash2 } from 'lucide-react'
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
import { Separator } from '@/__shadcn__/components/ui/separator'
import { Spinner } from '@/__shadcn__/components/ui/spinner'
import { Switch } from '@/__shadcn__/components/ui/switch'
import { Textarea } from '@/__shadcn__/components/ui/textarea'
import { rpc } from '@/utils'

type ImAccountsResponse = Awaited<ReturnType<typeof rpc.im.query.query>>
type ImAccountItem = ImAccountsResponse['accounts'][number]
type ImHealth = Awaited<ReturnType<typeof rpc.im.health.query>>
type ImPlatform = ImAccountItem['platform']

type ImFormState = {
	id?: string
	platform: ImPlatform
	account_id: string
	label: string
	enabled: boolean
	discord_token: string
	discord_require_mention: boolean
	discord_allowed_guild_ids: string
	discord_allowed_channel_ids: string
	discord_allowed_user_ids: string
	wechat_bridge_base_url: string
	wechat_secret: string
	wechat_send_path: string
	wechat_typing_path: string
}

const emptyForm = (): ImFormState => ({
	platform: 'discord',
	account_id: '',
	label: '',
	enabled: true,
	discord_token: '',
	discord_require_mention: true,
	discord_allowed_guild_ids: '',
	discord_allowed_channel_ids: '',
	discord_allowed_user_ids: '',
	wechat_bridge_base_url: '',
	wechat_secret: '',
	wechat_send_path: '/send',
	wechat_typing_path: '/typing'
})

const parseStringList = (value: string) =>
	value
		.split(/[\n,]/g)
		.map(item => item.trim())
		.filter(Boolean)

const formatStringList = (value?: Array<string>) => (value?.length ? value.join('\n') : '')

const parseConfig = (account: ImAccountItem): ImFormState => {
	const config = account.config_json ? JSON.parse(account.config_json) : {}

	if (account.platform === 'wechat') {
		return {
			id: account.id,
			platform: 'wechat',
			account_id: account.account_id,
			label: account.label || '',
			enabled: account.enabled,
			discord_token: '',
			discord_require_mention: true,
			discord_allowed_guild_ids: '',
			discord_allowed_channel_ids: '',
			discord_allowed_user_ids: '',
			wechat_bridge_base_url: typeof config.bridge_base_url === 'string' ? config.bridge_base_url : '',
			wechat_secret: typeof config.secret === 'string' ? config.secret : '',
			wechat_send_path: typeof config.send_path === 'string' ? config.send_path : '/send',
			wechat_typing_path: typeof config.typing_path === 'string' ? config.typing_path : '/typing'
		}
	}

	return {
		id: account.id,
		platform: 'discord',
		account_id: account.account_id,
		label: account.label || '',
		enabled: account.enabled,
		discord_token: typeof config.token === 'string' ? config.token : '',
		discord_require_mention: config.require_mention !== false,
		discord_allowed_guild_ids: formatStringList(
			Array.isArray(config.allowed_guild_ids) ? config.allowed_guild_ids : []
		),
		discord_allowed_channel_ids: formatStringList(
			Array.isArray(config.allowed_channel_ids) ? config.allowed_channel_ids : []
		),
		discord_allowed_user_ids: formatStringList(
			Array.isArray(config.allowed_user_ids) ? config.allowed_user_ids : []
		),
		wechat_bridge_base_url: '',
		wechat_secret: '',
		wechat_send_path: '/send',
		wechat_typing_path: '/typing'
	}
}

const stringifyConfig = (form: ImFormState) => {
	if (form.platform === 'wechat') {
		if (!form.wechat_bridge_base_url.trim()) {
			throw new Error('WeChat bridge base URL is required')
		}

		if (!form.wechat_secret.trim()) {
			throw new Error('WeChat secret is required')
		}

		return JSON.stringify({
			bridge_base_url: form.wechat_bridge_base_url.trim(),
			secret: form.wechat_secret.trim(),
			send_path: form.wechat_send_path.trim() || '/send',
			typing_path: form.wechat_typing_path.trim() || '/typing'
		})
	}

	if (!form.discord_token.trim()) {
		throw new Error('Discord bot token is required')
	}

	return JSON.stringify({
		token: form.discord_token.trim(),
		require_mention: form.discord_require_mention,
		allowed_guild_ids: parseStringList(form.discord_allowed_guild_ids),
		allowed_channel_ids: parseStringList(form.discord_allowed_channel_ids),
		allowed_user_ids: parseStringList(form.discord_allowed_user_ids)
	})
}

const statusVariant = (status: string, enabled: boolean) => {
	if (!enabled) return 'outline'
	if (status === 'connected') return 'secondary'
	if (status === 'error') return 'destructive'
	return 'outline'
}

const Index = () => {
	const [accounts, setAccounts] = useState<ImAccountsResponse['accounts']>([])
	const [health, setHealth] = useState<ImHealth>({ adapters: [], routes: [] })
	const [selectedId, setSelectedId] = useState<string>('')
	const [form, setForm] = useState<ImFormState>(emptyForm)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [reloading, setReloading] = useState(false)
	const [removing, setRemoving] = useState(false)

	const selectedAccount = useMemo(
		() => accounts.find(item => item.id === selectedId) || null,
		[accounts, selectedId]
	)

	const load = async (nextSelectedId?: string) => {
		setLoading(true)

		try {
			const [accountsRes, healthRes] = await Promise.all([rpc.im.query.query(), rpc.im.health.query()])
			setAccounts(accountsRes.accounts)
			setHealth(healthRes)

			const targetId =
				nextSelectedId !== undefined
					? nextSelectedId
					: accountsRes.accounts.find(item => item.id === selectedId)?.id ||
						accountsRes.accounts[0]?.id ||
						''

			setSelectedId(targetId)
			setForm(
				targetId ? parseConfig(accountsRes.accounts.find(item => item.id === targetId)!) : emptyForm()
			)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		void load()
	}, [])

	const updateForm = <K extends keyof ImFormState>(key: K, value: ImFormState[K]) => {
		setForm(prev => ({ ...prev, [key]: value }))
	}

	const onSelectAccount = (account: ImAccountItem | null) => {
		if (!account) {
			setSelectedId('')
			setForm(emptyForm())
			return
		}

		setSelectedId(account.id)
		setForm(parseConfig(account))
	}

	const onCreateNew = () => {
		setSelectedId('')
		setForm(emptyForm())
	}

	const onSave = async () => {
		if (!form.account_id.trim()) {
			toast.error('Account ID is required')
			return
		}

		setSaving(true)

		try {
			const payload = {
				platform: form.platform,
				account_id: form.account_id.trim(),
				label: form.label.trim(),
				enabled: form.enabled,
				config_json: stringifyConfig(form)
			}

			const saved = form.id
				? await rpc.im.update.mutate({ id: form.id, ...payload })
				: await rpc.im.create.mutate(payload)

			await rpc.im.reload.mutate()
			await load(saved.id)
			toast.success(form.id ? 'IM account updated' : 'IM account created')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error))
		} finally {
			setSaving(false)
		}
	}

	const onRemove = async () => {
		if (!form.id) {
			onCreateNew()
			return
		}

		setRemoving(true)

		try {
			await rpc.im.remove.mutate(form.id)
			await rpc.im.reload.mutate()
			await load('')
			toast.success('IM account removed')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error))
		} finally {
			setRemoving(false)
		}
	}

	const onReload = async () => {
		setReloading(true)

		try {
			const res = await rpc.im.reload.mutate()
			setHealth(res.health)
			await load(selectedId)
			toast.success('IM runtime reloaded')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error))
		} finally {
			setReloading(false)
		}
	}

	return (
		<div
			className='
				overflow-y-scroll
				flex flex-col
				w-full h-full
				gap-5
				page_wrap
			'
		>
			<div
				className='
					flex flex-wrap
					items-start justify-between
					gap-3
				'
			>
				<div className='flex flex-col gap-1'>
					<div className='flex items-center gap-2'>
						<div className='bg-muted rounded-2xl p-2'>
							<MessageCircle className='size-4' />
						</div>
						<div>
							<div className='text-lg font-semibold'>IM Integration</div>
							<div className='text-std-500 text-sm'>
								Configure Discord and WeChat accounts for the IM runtime
							</div>
						</div>
					</div>
				</div>
				<div className='flex items-center gap-2'>
					<Button type='button' variant='outline' onClick={onCreateNew}>
						<Plus className='size-4' />
						<span>New Account</span>
					</Button>
					<Button
						type='button'
						variant='outline'
						onClick={() => void onReload()}
						disabled={reloading}
					>
						{reloading ? <Spinner className='size-4' /> : <RefreshCw className='size-4' />}
						<span>Reload Runtime</span>
					</Button>
				</div>
			</div>

			<div
				className='
					flex-1
					grid
					min-h-0
					gap-5
					xl:grid-cols-[320px_minmax(0,1fr)]
				'
			>
				<div
					className='
						flex flex-col
						min-h-[320px]
						rounded-3xl
						bg-background/70
						border
					'
				>
					<div
						className='
							flex
							items-center justify-between
							px-4 py-3
						'
					>
						<div className='text-sm font-medium'>Accounts</div>
						<Badge variant='outline'>{accounts.length}</Badge>
					</div>
					<Separator />
					<div className='flex flex-col gap-2 p-3'>
						{loading ? (
							<div className='flex items-center justify-center py-10'>
								<Spinner />
							</div>
						) : accounts.length ? (
							accounts.map(account => (
								<button
									type='button'
									key={account.id}
									onClick={() => onSelectAccount(account)}
									className={`
											flex flex-col
											items-start
											gap-2
											px-4 py-3
											rounded-2xl
											text-left
											border
											transition
											${selectedId === account.id ? 'border-foreground/20 bg-muted/70' : 'bg-muted/35 hover:bg-muted/55 border-transparent'}
									`}
								>
									<div
										className='
												flex
												items-center justify-between
												w-full
												gap-2
											'
									>
										<span className='font-medium'>
											{account.label || account.account_id}
										</span>
										<Badge
											variant={statusVariant(
												account.status,
												account.enabled
											)}
										>
											{account.enabled ? account.status : 'disabled'}
										</Badge>
									</div>
									<div className='text-std-500 text-sm'>
										{account.platform} · {account.account_id}
									</div>
									{account.last_error && (
										<div className='text-xs text-red-500'>
											{account.last_error}
										</div>
									)}
								</button>
							))
						) : (
							<div
								className='
										px-4 py-6
										rounded-2xl
										text-std-500 text-sm
										bg-muted/35
									'
							>
								No IM accounts configured yet.
							</div>
						)}
					</div>
				</div>

				<div
					className='
						flex flex-col
						min-h-[320px]
						gap-5
						p-5
						rounded-3xl
						bg-background/70
						border
					'
				>
					<div
						className='
							flex flex-wrap
							items-start justify-between
							gap-3
						'
					>
						<div>
							<div className='text-base font-semibold'>
								{form.id ? 'Edit IM Account' : 'Create IM Account'}
							</div>
							<div className='text-std-500 text-sm'>
								Structured fields are stored as platform config and applied on runtime
								reload.
							</div>
						</div>
						<div className='flex items-center gap-2'>
							{selectedAccount && (
								<Badge variant='outline'>
									Active routes:{' '}
									{
										health.adapters.filter(
											item =>
												item.account_id ===
													selectedAccount.account_id &&
												item.platform === selectedAccount.platform
										).length
									}
								</Badge>
							)}
							<Button
								type='button'
								variant='outline'
								onClick={() => void onRemove()}
								disabled={removing}
							>
								{removing ? (
									<Spinner className='size-4' />
								) : (
									<Trash2 className='size-4' />
								)}
								<span>{form.id ? 'Delete' : 'Clear'}</span>
							</Button>
							<Button type='button' onClick={() => void onSave()} disabled={saving}>
								{saving ? <Spinner className='size-4' /> : null}
								<span>{form.id ? 'Save Changes' : 'Create Account'}</span>
							</Button>
						</div>
					</div>

					<FieldGroup className='gap-0'>
						<Field className='items-center! py-3' orientation='horizontal'>
							<FieldContent>
								<FieldTitle className='text-base'>Platform</FieldTitle>
								<FieldDescription>
									Select the platform for this IM account
								</FieldDescription>
							</FieldContent>
							<Select
								value={form.platform}
								onValueChange={value => updateForm('platform', value as ImPlatform)}
							>
								<SelectTrigger className='workspace_selector'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent align='start'>
									<SelectGroup>
										<SelectLabel>Platform</SelectLabel>
										<SelectItem value='discord'>discord</SelectItem>
										<SelectItem value='wechat'>wechat</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</Field>
						<Field className='items-center! py-3' orientation='horizontal'>
							<FieldContent>
								<FieldTitle className='text-base'>Account ID</FieldTitle>
								<FieldDescription>
									Unique identifier used by inbound events
								</FieldDescription>
							</FieldContent>
							<Input
								className='max-w-[280px]'
								value={form.account_id}
								onChange={event => updateForm('account_id', event.target.value)}
								placeholder='discord-main'
							/>
						</Field>
						<Field className='items-center! py-3' orientation='horizontal'>
							<FieldContent>
								<FieldTitle className='text-base'>Label</FieldTitle>
								<FieldDescription>
									Optional display name for this account
								</FieldDescription>
							</FieldContent>
							<Input
								className='max-w-[280px]'
								value={form.label}
								onChange={event => updateForm('label', event.target.value)}
								placeholder='Primary Discord Bot'
							/>
						</Field>
						<Field className='items-center! py-3' orientation='horizontal'>
							<FieldContent>
								<FieldTitle className='text-base'>Enabled</FieldTitle>
								<FieldDescription>
									Disabled accounts are not loaded into the runtime
								</FieldDescription>
							</FieldContent>
							<Switch
								checked={form.enabled}
								onCheckedChange={value => updateForm('enabled', value)}
							/>
						</Field>
					</FieldGroup>

					<Separator />

					{form.platform === 'discord' ? (
						<FieldGroup className='gap-0'>
							<Field className='items-center! py-3' orientation='horizontal'>
								<FieldContent>
									<FieldTitle className='text-base'>Bot Token</FieldTitle>
									<FieldDescription>
										Discord bot token for gateway and API access
									</FieldDescription>
								</FieldContent>
								<Input
									className='max-w-[420px]'
									value={form.discord_token}
									onChange={event =>
										updateForm('discord_token', event.target.value)
									}
									placeholder='DISCORD_BOT_TOKEN'
								/>
							</Field>
							<Field className='items-center! py-3' orientation='horizontal'>
								<FieldContent>
									<FieldTitle className='text-base'>Require Mention</FieldTitle>
									<FieldDescription>
										Only respond in guild channels when mentioned or replied to
									</FieldDescription>
								</FieldContent>
								<Switch
									checked={form.discord_require_mention}
									onCheckedChange={value =>
										updateForm('discord_require_mention', value)
									}
								/>
							</Field>
							<Field className='items-start! py-3' orientation='horizontal'>
								<FieldContent>
									<FieldTitle className='text-base'>Allowed Guild IDs</FieldTitle>
									<FieldDescription>
										One per line or comma-separated. Leave empty for all.
									</FieldDescription>
								</FieldContent>
								<Textarea
									className='min-h-[88px] max-w-[420px]'
									value={form.discord_allowed_guild_ids}
									onChange={event =>
										updateForm('discord_allowed_guild_ids', event.target.value)
									}
									placeholder='123456789012345678'
								/>
							</Field>
							<Field className='items-start! py-3' orientation='horizontal'>
								<FieldContent>
									<FieldTitle className='text-base'>Allowed Channel IDs</FieldTitle>
									<FieldDescription>
										One per line or comma-separated. Leave empty for all.
									</FieldDescription>
								</FieldContent>
								<Textarea
									className='min-h-[88px] max-w-[420px]'
									value={form.discord_allowed_channel_ids}
									onChange={event =>
										updateForm(
											'discord_allowed_channel_ids',
											event.target.value
										)
									}
									placeholder='223456789012345678'
								/>
							</Field>
							<Field className='items-start! py-3' orientation='horizontal'>
								<FieldContent>
									<FieldTitle className='text-base'>Allowed User IDs</FieldTitle>
									<FieldDescription>
										One per line or comma-separated. Leave empty for all.
									</FieldDescription>
								</FieldContent>
								<Textarea
									className='min-h-[88px] max-w-[420px]'
									value={form.discord_allowed_user_ids}
									onChange={event =>
										updateForm('discord_allowed_user_ids', event.target.value)
									}
									placeholder='323456789012345678'
								/>
							</Field>
						</FieldGroup>
					) : (
						<FieldGroup className='gap-0'>
							<Field className='items-center! py-3' orientation='horizontal'>
								<FieldContent>
									<FieldTitle className='text-base'>Bridge Base URL</FieldTitle>
									<FieldDescription>
										Base URL for the WeChat bridge service
									</FieldDescription>
								</FieldContent>
								<Input
									className='max-w-[420px]'
									value={form.wechat_bridge_base_url}
									onChange={event =>
										updateForm('wechat_bridge_base_url', event.target.value)
									}
									placeholder='https://your-wechat-bridge.example.com'
								/>
							</Field>
							<Field className='items-center! py-3' orientation='horizontal'>
								<FieldContent>
									<FieldTitle className='text-base'>Shared Secret</FieldTitle>
									<FieldDescription>
										Used to sign bridge callbacks and outbound requests
									</FieldDescription>
								</FieldContent>
								<Input
									className='max-w-[420px]'
									value={form.wechat_secret}
									onChange={event =>
										updateForm('wechat_secret', event.target.value)
									}
									placeholder='shared-secret'
								/>
							</Field>
							<Field className='items-center! py-3' orientation='horizontal'>
								<FieldContent>
									<FieldTitle className='text-base'>Send Path</FieldTitle>
									<FieldDescription>
										Bridge endpoint for outbound messages
									</FieldDescription>
								</FieldContent>
								<Input
									className='max-w-[220px]'
									value={form.wechat_send_path}
									onChange={event =>
										updateForm('wechat_send_path', event.target.value)
									}
									placeholder='/send'
								/>
							</Field>
							<Field className='items-center! py-3' orientation='horizontal'>
								<FieldContent>
									<FieldTitle className='text-base'>Typing Path</FieldTitle>
									<FieldDescription>
										Bridge endpoint for typing notifications
									</FieldDescription>
								</FieldContent>
								<Input
									className='max-w-[220px]'
									value={form.wechat_typing_path}
									onChange={event =>
										updateForm('wechat_typing_path', event.target.value)
									}
									placeholder='/typing'
								/>
							</Field>
						</FieldGroup>
					)}
				</div>
			</div>
		</div>
	)
}

export const Component = new $app.Handle(Index).get()
