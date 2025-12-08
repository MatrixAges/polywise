import { relaunch } from '@/utils'

export default () => {
	window.localStorage.clear()
	window.sessionStorage.clear()

	relaunch()
}
