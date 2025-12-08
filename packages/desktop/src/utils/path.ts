import { join, resolve } from 'path'
import { app } from 'electron'

import { conf } from '@desktop/utils'

export const app_data_path = join(app.getPath('documents'), `/.${app.name}`)
export const workspace_data_path = join(app_data_path, `/${conf.get('workspace') || 'default'}`)

export const getAppPath = (v: string) => resolve(__dirname, '../../app_dist/', v)
export const getPath = (v: string) => resolve(__dirname, '../', v)
