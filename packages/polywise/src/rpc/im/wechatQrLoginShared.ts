import { randomBytes, randomUUID } from 'node:crypto'

import { getImAccounts } from '../../db/services'
import { wechat_clawbot_api_base_url, wechat_clawbot_channel_version } from '../../im/config'

type ActiveWechatQrLogin = {
	session_key: string
	qrcode: string
	qrcode_url: string
	current_base_url: string
	refresh_count: number
	started_at: number
}

type WechatQrStatusResponse =
	| {
			status:
				| 'wait'
				| 'scaned'
				| 'scaned_but_redirect'
				| 'expired'
				| 'need_verifycode'
				| 'verify_code_blocked'
				| 'binded_redirect'
			redirect_host?: string
	  }
	| {
			status: 'confirmed'
			bot_token?: string
			ilink_bot_id?: string
			baseurl?: string
			ilink_user_id?: string
	  }

type WechatQrCodeResponse = {
	qrcode?: string
	qrcode_img_content?: string
}

const wechat_login_base_url = 'https://ilinkai.weixin.qq.com'
const wechat_login_bot_type = '3'
const max_qr_refresh_count = 3
const qr_status_timeout_ms = 35_000
const qr_login_ttl_ms = 8 * 60_000
const ilink_app_id = 'bot'
const active_logins = new Map<string, ActiveWechatQrLogin>()

const buildClientVersion = (version: string) => {
	const parts = version.split('.').map(part => Number.parseInt(part, 10) || 0)
	return ((parts[0] & 0xff) << 16) | ((parts[1] & 0xff) << 8) | (parts[2] & 0xff)
}

const normalizeBaseUrl = (value: string) => (value.endsWith('/') ? value : `${value}/`)
const buildWechatUin = () => Buffer.from(String(randomBytes(4).readUInt32BE(0)), 'utf8').toString('base64')

const buildWechatHeaders = (token?: string) => {
	const headers: Record<string, string> = {
		'content-type': 'application/json',
		'iLink-App-Id': ilink_app_id,
		'iLink-App-ClientVersion': String(buildClientVersion(wechat_clawbot_channel_version)),
		'X-WECHAT-UIN': buildWechatUin()
	}

	if (token?.trim()) {
		headers.AuthorizationType = 'ilink_bot_token'
		headers.Authorization = `Bearer ${token.trim()}`
	}

	return headers
}

const safeJsonParse = (value: string | null | undefined) => {
	if (!value) return {}

	try {
		return JSON.parse(value) as Record<string, unknown>
	} catch {
		return {}
	}
}

const collectLocalTokenList = async () => {
	const accounts = await getImAccounts({})

	return accounts
		.filter(account => account.platform === 'wechat')
		.map(account => safeJsonParse(account.config_json))
		.map(config => (typeof config.bot_token === 'string' ? config.bot_token.trim() : ''))
		.filter(Boolean)
		.slice(-10)
}

const fetchWechatQrCode = async () => {
	const response = await fetch(
		new URL(
			`ilink/bot/get_bot_qrcode?bot_type=${encodeURIComponent(wechat_login_bot_type)}`,
			normalizeBaseUrl(wechat_login_base_url)
		),
		{
			method: 'POST',
			headers: buildWechatHeaders(),
			body: JSON.stringify({ local_token_list: await collectLocalTokenList() })
		}
	)

	if (!response.ok) {
		throw new Error(`Failed to request WeChat QR code: ${response.status} ${await response.text()}`)
	}

	const json = (await response.json()) as WechatQrCodeResponse

	if (!json.qrcode || !json.qrcode_img_content) {
		throw new Error('WeChat QR response is missing qrcode content')
	}

	return {
		qrcode: json.qrcode,
		qrcode_url: json.qrcode_img_content
	}
}

const pollWechatQrStatus = async (args: {
	base_url: string
	qrcode: string
	verify_code?: string
}): Promise<WechatQrStatusResponse> => {
	const url = new URL(
		`ilink/bot/get_qrcode_status?qrcode=${encodeURIComponent(args.qrcode)}`,
		normalizeBaseUrl(args.base_url)
	)

	if (args.verify_code?.trim()) {
		url.searchParams.set('verify_code', args.verify_code.trim())
	}

	const controller = new AbortController()
	const timer = setTimeout(() => controller.abort(), qr_status_timeout_ms)

	try {
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'iLink-App-Id': ilink_app_id,
				'iLink-App-ClientVersion': String(buildClientVersion(wechat_clawbot_channel_version))
			},
			signal: controller.signal
		})

		if (!response.ok) {
			throw new Error(`Failed to poll WeChat QR status: ${response.status} ${await response.text()}`)
		}

		return (await response.json()) as WechatQrStatusResponse
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			return { status: 'wait' }
		}

		return { status: 'wait' }
	} finally {
		clearTimeout(timer)
	}
}

const refreshWechatQrCode = async (login: ActiveWechatQrLogin) => {
	if (login.refresh_count >= max_qr_refresh_count) {
		active_logins.delete(login.session_key)

		return {
			ok: false as const,
			message: 'The QR code expired too many times. Start the connection flow again.'
		}
	}

	const next = await fetchWechatQrCode()
	login.qrcode = next.qrcode
	login.qrcode_url = next.qrcode_url
	login.current_base_url = wechat_login_base_url
	login.refresh_count += 1
	login.started_at = Date.now()

	return {
		ok: true as const,
		qrcode_url: next.qrcode_url,
		message: 'The QR code was refreshed. Scan the new code to continue.'
	}
}

export const startWechatQrLogin = async () => {
	const qr = await fetchWechatQrCode()
	const session_key = randomUUID()

	active_logins.set(session_key, {
		session_key,
		qrcode: qr.qrcode,
		qrcode_url: qr.qrcode_url,
		current_base_url: wechat_login_base_url,
		refresh_count: 0,
		started_at: Date.now()
	})

	return {
		session_key,
		qrcode_url: qr.qrcode_url,
		message: 'Scan the QR code with WeChat and confirm on your phone.'
	}
}

export const waitWechatQrLogin = async (args: { session_key: string; verify_code?: string }) => {
	const login = active_logins.get(args.session_key)

	if (!login) {
		return {
			status: 'error' as const,
			message: 'There is no active WeChat connection flow. Start again.'
		}
	}

	if (Date.now() - login.started_at > qr_login_ttl_ms) {
		active_logins.delete(args.session_key)

		return {
			status: 'error' as const,
			message: 'The QR login session timed out. Start again.'
		}
	}

	const result = await pollWechatQrStatus({
		base_url: login.current_base_url,
		qrcode: login.qrcode,
		verify_code: args.verify_code
	})

	switch (result.status) {
		case 'wait':
			return {
				status: 'pending' as const,
				message: 'Waiting for scan...'
			}
		case 'scaned':
		case 'scaned_but_redirect':
			if (result.status === 'scaned_but_redirect' && result.redirect_host) {
				login.current_base_url = `https://${result.redirect_host}`
			}

			return {
				status: 'scanned' as const,
				message: 'Scanned. Waiting for confirmation on your phone...'
			}
		case 'need_verifycode':
			return {
				status: 'needs_verify_code' as const,
				message: 'Enter the numeric verification code shown in WeChat.'
			}
		case 'verify_code_blocked': {
			const refreshed = await refreshWechatQrCode(login)

			if (!refreshed.ok) {
				return {
					status: 'error' as const,
					message: refreshed.message
				}
			}

			return {
				status: 'needs_verify_code' as const,
				message: 'The verification code was rejected. The QR code was refreshed. Scan again and enter the new code.',
				qrcode_url: refreshed.qrcode_url
			}
		}
		case 'expired': {
			const refreshed = await refreshWechatQrCode(login)

			if (!refreshed.ok) {
				return {
					status: 'error' as const,
					message: refreshed.message
				}
			}

			return {
				status: 'pending' as const,
				message: refreshed.message,
				qrcode_url: refreshed.qrcode_url
			}
		}
		case 'binded_redirect':
			active_logins.delete(args.session_key)

			return {
				status: 'already_connected' as const,
				message: 'This WeChat account is already connected to the current workspace.'
			}
		case 'confirmed':
			active_logins.delete(args.session_key)

			if (!result.bot_token || !result.ilink_bot_id) {
				return {
					status: 'error' as const,
					message: 'The login was confirmed, but the server did not return complete credentials.'
				}
			}

			return {
				status: 'connected' as const,
				message: 'WeChat connected successfully.',
				account_id: result.ilink_bot_id,
				bot_token: result.bot_token,
				base_url: result.baseurl || wechat_clawbot_api_base_url,
				user_id: result.ilink_user_id || ''
			}
	}

	return {
		status: 'error' as const,
		message: 'Unexpected WeChat QR login state.'
	}
}
