import { homedir } from 'os'
import { resolve } from 'path'
import env_paths from 'env-paths'

const polywise_env_paths = env_paths('polywise')

export const base_path = `${homedir()}/.polywise/fst`
export const config_dir_path = `${homedir()}/.config/polywise`

export const getPath = (path: string) => resolve(`${base_path}${path}`)
