import { join, resolve } from 'path'
import { app } from 'electron'

export const app_data_path = join(app.getPath('documents'), `/.${app.name.toLowerCase()}`)

export const getAppDataPath = (v: string) => resolve(`${app_data_path}${v}`)
export const getAppPath = (v: string) => resolve(__dirname, '../../app_dist/', v)
export const getPath = (v: string) => resolve(__dirname, '../', v)
