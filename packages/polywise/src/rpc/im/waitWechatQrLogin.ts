import { object, string, enum as zod_enum } from 'zod'

import { p } from '../../utils/trpc'
import { waitWechatQrLogin } from './wechatQrLoginShared'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/im/waitWechatQrLogin',
			summary: 'Read Wait Wechat Qr Login'
		}
	})
	.input(
		object({
			session_key: string().trim().min(1),
			verify_code: string().trim().optional()
		})
	)
	.output(
		object({
			status: zod_enum([
				'pending',
				'scanned',
				'needs_verify_code',
				'connected',
				'already_connected',
				'error'
			]),
			message: string(),
			qrcode_url: string().optional(),
			account_id: string().optional(),
			bot_token: string().optional(),
			base_url: string().optional(),
			user_id: string().optional()
		})
	)
	.query(async ({ input }) => {
		return await waitWechatQrLogin(input)
	})
