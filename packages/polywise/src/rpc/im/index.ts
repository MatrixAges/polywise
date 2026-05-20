import { r } from '@core/utils'

import create from './create'
import health from './health'
import query from './query'
import reload from './reload'
import remove from './remove'
import startWechatQrLogin from './startWechatQrLogin'
import update from './update'
import waitWechatQrLogin from './waitWechatQrLogin'

export default r({
	create,
	query,
	update,
	remove,
	health,
	reload,
	startWechatQrLogin,
	waitWechatQrLogin
})
