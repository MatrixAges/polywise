import { spawn } from 'child_process'
import { resolve } from 'path'
import Watchpack from 'watchpack'

import type { ChildProcess } from 'child_process'

const watcher = new Watchpack({})
const is_win = process.platform === 'win32'
const file_path = resolve(`dist/index.js`)
const electron_path = is_win ? 'electron.CMD' : 'electron'

let electron_process: ChildProcess | null = null

const start = () => {
	electron_process = spawn(electron_path, ['.'])

	electron_process.stdout?.on('data', (data: Buffer) => {
		console.log('Main process output: ' + data)
	})

	electron_process.stderr?.on('data', (data: Buffer) => {
		const err = data.toString()

		const ignore = [
			'Autofill.enable',
			'Autofill.setAddresses',
			`Unexpected token 'H'`,
			'_ISSetPhysicalKeyboardCapsLockLED',
			'task_policy_set',
			'signal SIGTERM',
			'bootstrap_look_up',
			'real_url_info'
		]

		if (!new RegExp(ignore.join('|')).test(err)) {
			console.error('Main process error: ' + err)
		}
	})

	electron_process.on('close', code => {
		console.log('Main process exited with code: ' + code)

		electron_process!.removeAllListeners()
		electron_process!.kill()

		electron_process = null
	})
}

const restart = () => {
	if (electron_process) {
		console.log('Restarting Electron...')

		electron_process.removeAllListeners()
		electron_process.kill()
	}

	start()
}

watcher.watch({
	files: [file_path]
})

watcher.on('change', () => {
	restart()
})

start()
