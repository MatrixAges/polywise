import { homedir } from 'os'
import { join } from 'path'
import { xdgConfig } from 'xdg-basedir'

const base_path = join(homedir(), '.polywise', 'fst')
const config_dir_path = join(xdgConfig || join(homedir(), '.config'), 'polywise')

export const getPath = (path: string) => {
	const relative_path = path.startsWith('/') ? path.slice(1) : path
	return join(base_path, relative_path)
}

export const getConfigPath = (path: string) => {
	const relative_path = path.startsWith('/') ? path.slice(1) : path
	return join(config_dir_path, relative_path)
}
