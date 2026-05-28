import getData from '../kernel/getData'
import init from '../kernel/init'
import resetAbort from '../kernel/resetAbort'
import send from '../kernel/send'
import stop from '../kernel/stop'
import sync from '../kernel/sync'
import updateConfig from '../kernel/updateConfig'

export default () => ({
	init,
	getData,
	resetAbort,
	send,
	stop,
	sync,
	updateConfig
})
