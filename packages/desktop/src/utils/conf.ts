import { resolve } from 'path'
import { app } from 'electron'
import { Conf } from 'electron-conf/main'

export default new Conf({ dir: resolve(`${app.getPath('documents')}/.${app.name}`), name: 'appdata' })
