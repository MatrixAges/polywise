import { app } from 'electron'

export default () => {
	app.relaunch()
	app.exit()
}
