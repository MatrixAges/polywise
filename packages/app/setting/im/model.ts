import { makeAutoObservable } from 'mobx'
import { toast } from 'sonner'
import { injectable } from 'tsyringe'

import { rpc } from '@/utils'

export type ImAccountsResponse = Awaited<ReturnType<typeof rpc.im.query.query>>
export type ImAccountItem = ImAccountsResponse['accounts'][number]
export type ImHealth = Awaited<ReturnType<typeof rpc.im.health.query>>
export type ImPlatform = ImAccountItem['platform']
export type ImEditorMode = 'new' | 'edit'
export type WechatQrLoginStart = Awaited<ReturnType<typeof rpc.im.startWechatQrLogin.mutate>>
export type WechatQrLoginWait = Awaited<ReturnType<typeof rpc.im.waitWechatQrLogin.query>>

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
	wechat_bot_token: string
	wechat_api_base_url: string
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
	wechat_bot_token: '',
	wechat_api_base_url: 'https://ilinkai.weixin.qq.com'
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
			wechat_bot_token: typeof config.bot_token === 'string' ? config.bot_token : '',
			wechat_api_base_url:
				typeof config.api_base_url === 'string' ? config.api_base_url : 'https://ilinkai.weixin.qq.com'
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
		wechat_bot_token: '',
		wechat_api_base_url: 'https://ilinkai.weixin.qq.com'
	}
}

const stringifyConfig = (form: ImFormState) => {
	if (form.platform === 'wechat') {
		if (!form.wechat_bot_token.trim()) {
			throw new Error('Connect WeChat first')
		}

		return JSON.stringify({
			bot_token: form.wechat_bot_token.trim(),
			api_base_url: form.wechat_api_base_url.trim() || 'https://ilinkai.weixin.qq.com'
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
	wechat_qr_dialog_open = false
	wechat_qr_loading = false
	wechat_qr_polling = false
	wechat_qr_verify_loading = false
	wechat_qr_session_key = ''
	wechat_qr_code_url = ''
	wechat_qr_message = ''
	wechat_qr_status = 'idle' as
		| 'idle'
		| 'pending'
		| 'scanned'
		| 'needs_verify_code'
		| 'connected'
		| 'already_connected'
		| 'error'
	wechat_qr_verify_code = ''
	wechat_qr_poll_timer = 0 as ReturnType<typeof setTimeout> | 0

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	get selectedAccount() {
		return this.accounts.find(item => item.id === this.selectedId) || null
	}

	get accountIdPlaceholder() {
		return this.form.platform === 'discord' ? 'discord-main' : 'Auto-filled after connect'
	}

	get labelPlaceholder() {
		return this.form.platform === 'discord' ? 'Primary Discord Bot' : 'Primary WeChat Assistant'
	}

	get wechatConnectionReady() {
		return Boolean(this.form.wechat_bot_token.trim())
	}

	async init() {
		await this.load()
	}

	deinit() {
		this.clearWechatQrPollTimer()
	}

	updateForm<K extends keyof ImFormState>(key: K, value: ImFormState[K]) {
		this.form[key] = value
	}

	clearWechatQrPollTimer() {
		if (!this.wechat_qr_poll_timer) return

		clearTimeout(this.wechat_qr_poll_timer)
		this.wechat_qr_poll_timer = 0
	}

	closeWechatQrDialog() {
		this.clearWechatQrPollTimer()
		this.wechat_qr_dialog_open = false
		this.wechat_qr_loading = false
		this.wechat_qr_polling = false
		this.wechat_qr_verify_loading = false
		this.wechat_qr_session_key = ''
		this.wechat_qr_code_url = ''
		this.wechat_qr_message = ''
		this.wechat_qr_status = 'idle'
		this.wechat_qr_verify_code = ''
	}

	scheduleWechatQrPoll() {
		this.clearWechatQrPollTimer()

		if (!this.wechat_qr_session_key || this.wechat_qr_status === 'needs_verify_code') {
			return
		}

		this.wechat_qr_poll_timer = setTimeout(() => {
			this.wechat_qr_poll_timer = 0
			void this.pollWechatQrLogin()
		}, 1500)
	}

	async startWechatQrLogin() {
		this.clearWechatQrPollTimer()
		this.wechat_qr_loading = true
		this.wechat_qr_polling = false
		this.wechat_qr_verify_loading = false
		this.wechat_qr_verify_code = ''

		try {
			const result = await rpc.im.startWechatQrLogin.mutate()

			this.wechat_qr_dialog_open = true
			this.wechat_qr_session_key = result.session_key
			this.wechat_qr_code_url = result.qrcode_url
			this.wechat_qr_message = result.message
			this.wechat_qr_status = 'pending'
			this.scheduleWechatQrPoll()
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error))
		} finally {
			this.wechat_qr_loading = false
		}
	}

	async pollWechatQrLogin(verify_code?: string) {
		if (!this.wechat_qr_session_key) return
		const session_key = this.wechat_qr_session_key

		const is_verify_attempt = Boolean(verify_code?.trim())

		if (is_verify_attempt) {
			this.wechat_qr_verify_loading = true
		} else {
			this.wechat_qr_polling = true
		}

		try {
			const result = await rpc.im.waitWechatQrLogin.query({
				session_key,
				verify_code: verify_code?.trim() || undefined
			})

			if (this.wechat_qr_session_key !== session_key) {
				return
			}

			this.wechat_qr_status = result.status
			this.wechat_qr_message = result.message

			if (result.qrcode_url) {
				this.wechat_qr_code_url = result.qrcode_url
			}

			if (result.status === 'connected' && result.bot_token && result.account_id) {
				this.form.platform = 'wechat'
				this.form.wechat_bot_token = result.bot_token
				this.form.wechat_api_base_url = result.base_url?.trim() || 'https://ilinkai.weixin.qq.com'
				if (!this.form.account_id.trim() || this.editorMode === 'new') {
					this.form.account_id = result.account_id
				}
				if (!this.form.label.trim()) {
					this.form.label = `WeChat ${result.account_id}`
				}
				this.wechat_qr_verify_code = ''
				toast.success('WeChat connected. Save the account to apply.')
				return
			}

			if (result.status === 'already_connected') {
				toast.success('This WeChat account is already connected.')
				return
			}

			if (result.status === 'error') {
				toast.error(result.message)
				return
			}

			if (result.status === 'needs_verify_code') {
				this.wechat_qr_verify_code = ''
				return
			}

			this.scheduleWechatQrPoll()
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error))
		} finally {
			this.wechat_qr_polling = false
			this.wechat_qr_verify_loading = false
		}
	}

	async submitWechatQrVerifyCode() {
		if (!this.wechat_qr_verify_code.trim()) {
			toast.error('Verification code is required')
			return
		}

		await this.pollWechatQrLogin(this.wechat_qr_verify_code)
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
		this.closeWechatQrDialog()

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

	createNew(options?: { platform?: ImPlatform }) {
		this.closeWechatQrDialog()

		const platform = options?.platform || this.form.platform
		this.editorMode = 'new'
		this.selectedId = ''
		this.form = { ...emptyForm(), platform }
	}

	selectPlatform(platform: ImPlatform) {
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
