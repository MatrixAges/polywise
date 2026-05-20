import { makeAutoObservable } from 'mobx'
import { toast } from 'sonner'
import { injectable } from 'tsyringe'

import { rpc } from '@/utils'

export type ImAccountsResponse = Awaited<ReturnType<typeof rpc.im.query.query>>
export type ImAccountItem = ImAccountsResponse['accounts'][number]
export type ImHealth = Awaited<ReturnType<typeof rpc.im.health.query>>
export type ImPlatform = ImAccountItem['platform']
export type ImEditorMode = 'new' | 'edit'

export type ImFormState = {
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

@injectable()
export default class Model {
	accounts = [] as ImAccountsResponse['accounts']
	health = { adapters: [], routes: [] } as ImHealth
	selectedId = ''
	editorMode = 'new' as ImEditorMode
	form = emptyForm()
	loading = true
	saving = false
	reloading = false
	removing = false
	editorRevealKey = 0

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	get selectedAccount() {
		return this.accounts.find(item => item.id === this.selectedId) || null
	}

	get accountIdPlaceholder() {
		return this.form.platform === 'discord' ? 'discord-main' : 'wechat-main'
	}

	get labelPlaceholder() {
		return this.form.platform === 'discord' ? 'Primary Discord Bot' : 'Primary WeChat Bridge'
	}

	async init() {
		await this.load()
	}

	deinit() {}

	updateForm<K extends keyof ImFormState>(key: K, value: ImFormState[K]) {
		this.form[key] = value
	}

	getActiveRouteCount(account: ImAccountItem) {
		return this.health.adapters.filter(
			item => item.account_id === account.account_id && item.platform === account.platform
		).length
	}

	async load(nextSelectedId?: string) {
		this.loading = true

		try {
			const [accountsRes, healthRes] = await Promise.all([rpc.im.query.query(), rpc.im.health.query()])

			this.accounts = accountsRes.accounts
			this.health = healthRes

			const targetId =
				nextSelectedId !== undefined
					? nextSelectedId
					: accountsRes.accounts.find(item => item.id === this.selectedId)?.id ||
						accountsRes.accounts[0]?.id ||
						''

			this.editorMode = targetId ? 'edit' : 'new'
			this.selectedId = targetId
			this.form = targetId
				? parseConfig(accountsRes.accounts.find(item => item.id === targetId)!)
				: emptyForm()
		} finally {
			this.loading = false
		}
	}

	selectAccount(account: ImAccountItem | null) {
		if (!account) {
			this.editorMode = 'new'
			this.selectedId = ''
			this.form = emptyForm()
			return
		}

		this.editorMode = 'edit'
		this.selectedId = account.id
		this.form = parseConfig(account)
	}

	createNew(options?: { platform?: ImPlatform; reveal?: boolean }) {
		const platform = options?.platform || this.form.platform

		if (options?.reveal) {
			this.editorRevealKey += 1
		}

		this.editorMode = 'new'
		this.selectedId = ''
		this.form = { ...emptyForm(), platform }
	}

	selectPlatform(platform: ImPlatform) {
		this.editorRevealKey += 1

		if (this.editorMode === 'new') {
			this.form.platform = platform
			return
		}

		this.createNew({ platform })
	}

	async save() {
		if (!this.form.account_id.trim()) {
			toast.error('Account ID is required')
			return
		}

		this.saving = true
		const isEditing = Boolean(this.form.id)

		try {
			const payload = {
				platform: this.form.platform,
				account_id: this.form.account_id.trim(),
				label: this.form.label.trim(),
				enabled: this.form.enabled,
				config_json: stringifyConfig(this.form)
			}

			const saved = this.form.id
				? await rpc.im.update.mutate({ id: this.form.id, ...payload })
				: await rpc.im.create.mutate(payload)

			await rpc.im.reload.mutate()
			await this.load(saved.id)
			toast.success(isEditing ? 'IM account updated' : 'IM account created')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error))
		} finally {
			this.saving = false
		}
	}

	async remove() {
		if (!this.form.id) {
			this.createNew()
			return
		}

		this.removing = true

		try {
			await rpc.im.remove.mutate(this.form.id)
			await rpc.im.reload.mutate()
			await this.load('')
			toast.success('IM account removed')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error))
		} finally {
			this.removing = false
		}
	}

	async reload() {
		this.reloading = true

		try {
			const res = await rpc.im.reload.mutate()
			this.health = res.health
			await this.load(this.selectedId)
			toast.success('IM runtime reloaded')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error))
		} finally {
			this.reloading = false
		}
	}
}
