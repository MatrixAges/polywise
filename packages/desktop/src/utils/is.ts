import { app } from 'electron'

const is_env_set = 'ELECTRON_IS_DEV' in process.env
const electron_env = Number.parseInt(process.env.ELECTRON_IS_DEV!, 10) === 1

export const is_dev = is_env_set ? electron_env : !app.isPackaged
export const is_mac = process.platform === 'darwin'
export const is_win = process.platform === 'win32'

// export const show_devtool = process.env.DEVTOOL === '1'
export const show_devtool = false
