import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { startWechatQrLogin } from './wechatQrLoginShared'

export default p
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
