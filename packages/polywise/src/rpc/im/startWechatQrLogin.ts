import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { startWechatQrLogin } from './wechatQrLoginShared'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/im/startWechatQrLogin',
			description: 'Start a WeChat QR login flow and return the QR session payload.'
		}
	})
	.output(
		object({
			session_key: string(),
			qrcode_url: string(),
			message: string()
		})
	)
	.mutation(async () => {
		return await startWechatQrLogin()
	})
