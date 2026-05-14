import { spawnSync } from 'child_process'
import { constants } from 'fs'
import { access } from 'fs/promises'
import os from 'os'
import path from 'path'

const isExecutable = async (file_path: string) => {
	try {
		await access(file_path, constants.X_OK)
		return true
	} catch {
		return false
	}
}

const getCommandExtensions = () => {
	if (process.platform !== 'win32') return ['']

	return (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM')
		.split(';')
		.filter(Boolean)
		.map(ext => ext.toLowerCase())
}

const getNpmGlobalBinDir = () => {
	const npm_prefix = spawnSync('npm', ['prefix', '-g'], {
		encoding: 'utf8',
		shell: false,
		env: process.env
	})

	if (npm_prefix.status !== 0) return null

	const prefix = npm_prefix.stdout.trim()
	if (!prefix) return null

	return process.platform === 'win32' ? prefix : path.join(prefix, 'bin')
}

const getSearchDirs = (command: string) => {
	const dirs = new Set<string>()
	const path_dirs = (process.env.PATH || '').split(path.delimiter).filter(Boolean)

	for (const dir of path_dirs) {
		dirs.add(dir)
	}

	if (command === 'curl.md' && process.env.CURLMD_INSTALL_DIR) {
		dirs.add(process.env.CURLMD_INSTALL_DIR)
	}

	dirs.add(path.resolve(os.homedir(), '.local/bin'))

	const npm_global_bin = getNpmGlobalBinDir()
	if (npm_global_bin) {
		dirs.add(npm_global_bin)
	}

	return Array.from(dirs)
}

export const resolveCommand = async (command: string) => {
	if (path.isAbsolute(command) || command.includes(path.sep)) {
		return (await isExecutable(command)) ? command : null
	}

	const extensions = getCommandExtensions()

	for (const dir of getSearchDirs(command)) {
		for (const ext of extensions) {
			const candidate =
				process.platform === 'win32' && ext && command.toLowerCase().endsWith(ext)
					? path.join(dir, command)
					: path.join(dir, `${command}${ext}`)

			if (await isExecutable(candidate)) {
				return candidate
			}
		}
	}

	return null
}
