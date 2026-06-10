import { spawnSync } from 'child_process'
import { constants } from 'fs'
import { access } from 'fs/promises'
import os from 'os'
import path from 'path'

import { getCrawl4aiBaseDirectory } from './crawl4aiProfile'

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

const getEnvPathDirs = (env: NodeJS.ProcessEnv = process.env) => (env.PATH || '').split(path.delimiter).filter(Boolean)

const getBinDirFromPrefix = (prefix: string) => (process.platform === 'win32' ? prefix : path.join(prefix, 'bin'))

const getHomebrewBinDirs = () => {
	if (process.platform === 'win32') {
		return [] as Array<string>
	}

	const prefixes = [process.env.HOMEBREW_PREFIX?.trim(), '/opt/homebrew', '/usr/local'].filter(
		(value): value is string => Boolean(value)
	)
	const dirs = new Set<string>()

	for (const prefix of prefixes) {
		dirs.add(path.join(prefix, 'bin'))
		dirs.add(path.join(prefix, 'sbin'))
	}

	return Array.from(dirs)
}

const getNodeToolchainBinDirs = () => {
	const dirs = [] as Array<string>
	const npm_prefix = process.env.npm_config_prefix?.trim() || process.env.NPM_CONFIG_PREFIX?.trim()
	const volta_home = process.env.VOLTA_HOME?.trim()

	if (npm_prefix) {
		dirs.push(getBinDirFromPrefix(npm_prefix))
	}

	if (volta_home) {
		dirs.push(path.join(volta_home, 'bin'))
	}

	dirs.push(path.resolve(os.homedir(), '.volta/bin'))
	dirs.push(path.resolve(os.homedir(), '.npm-global/bin'))

	return dirs
}

const getNpmGlobalBinDir = () => {
	const npm_prefix = spawnSync('npm', ['prefix', '-g'], {
		encoding: 'utf8',
		shell: false,
		env: {
			...process.env,
			PATH: Array.from(
				new Set([...getEnvPathDirs(), ...getHomebrewBinDirs(), ...getNodeToolchainBinDirs()])
			).join(path.delimiter)
		}
	})

	if (npm_prefix.status !== 0) return null

	const prefix = npm_prefix.stdout.trim()
	if (!prefix) return null

	return process.platform === 'win32' ? prefix : path.join(prefix, 'bin')
}

const getPythonUserBinDirs = () => {
	const result = [] as Array<string>

	for (const command of ['python3', 'python']) {
		const python_user_base = spawnSync(command, ['-c', 'import site; print(site.USER_BASE)'], {
			encoding: 'utf8',
			shell: false,
			env: process.env
		})

		if (python_user_base.status !== 0) {
			continue
		}

		const user_base = python_user_base.stdout.trim()

		if (!user_base) {
			continue
		}

		result.push(process.platform === 'win32' ? user_base : path.join(user_base, 'bin'))
	}

	return result
}

export const getCommandSearchDirs = () => {
	const dirs = new Set<string>()
	const path_dirs = getEnvPathDirs()

	for (const dir of path_dirs) {
		dirs.add(dir)
	}

	dirs.add(path.resolve(os.homedir(), '.local/bin'))

	for (const dir of getHomebrewBinDirs()) {
		dirs.add(dir)
	}

	for (const dir of getNodeToolchainBinDirs()) {
		dirs.add(dir)
	}

	const npm_global_bin = getNpmGlobalBinDir()
	if (npm_global_bin) {
		dirs.add(npm_global_bin)
	}

	for (const dir of getPythonUserBinDirs()) {
		dirs.add(dir)
	}

	return Array.from(dirs)
}

export const getRuntimeCommandEnv = (env: NodeJS.ProcessEnv = process.env) => {
	const path_dirs = new Set(getEnvPathDirs(env))

	for (const dir of getCommandSearchDirs()) {
		path_dirs.add(dir)
	}

	return {
		...env,
		PATH: Array.from(path_dirs).join(path.delimiter),
		CRAWL4_AI_BASE_DIRECTORY: env.CRAWL4_AI_BASE_DIRECTORY?.trim() || getCrawl4aiBaseDirectory()
	}
}

export const resolveCommand = async (command: string) => {
	if (path.isAbsolute(command) || command.includes(path.sep)) {
		return (await isExecutable(command)) ? command : null
	}

	const extensions = getCommandExtensions()

	for (const dir of getCommandSearchDirs()) {
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
