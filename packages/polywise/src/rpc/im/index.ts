import { r } from '@core/utils'

import create from './create'
import health from './health'
import installWechatClawbot from './installWechatClawbot'
import query from './query'
import reload from './reload'
import remove from './remove'
import update from './update'
import wechatClawbotStatus from './wechatClawbotStatus'

export default r({
	create,
	query,
	update,
	remove,
	health,
	reload,
	wechatClawbotStatus,
	installWechatClawbot
})
