import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { startWechatQrLogin } from './wechatQrLoginShared'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/im/startWechatQrLogin',
			description: 'Run Start Wechat Qr Login'
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
