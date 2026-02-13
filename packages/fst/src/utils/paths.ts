import { homedir } from 'os'
import { resolve } from 'path'
import { xdgConfig } from 'xdg-basedir'

const base_path = `${homedir()}/.polywise/fst`
const config_dir_path = `${xdgConfig}/polywise`

export const getPath = (path: string) => resolve(`${base_path}${path}`)
export const getConfigPath = (path: string) => resolve(`${config_dir_path}${path}`)
