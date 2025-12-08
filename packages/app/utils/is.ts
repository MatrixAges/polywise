export const is_dev = process.env.NODE_ENV === 'development'
export const is_prod = process.env.NODE_ENV === 'production'
export const is_electron = window.$shell?.type === 'electron'
export const is_mac_electron = window.$shell?.platform === 'darwin' && window.$shell?.type === 'electron'
export const is_win_electron = window.$shell?.platform === 'win32' && window.$shell?.type === 'electron'
export const is_mac_dev = is_mac_electron && is_dev
export const is_win_dev = is_win_electron && is_dev
