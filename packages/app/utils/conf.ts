import { Conf } from 'electron-conf/renderer'

import createUniversalObject from './createUniversalObject'
import { is_electron } from './is'

export default is_electron ? new Conf<any>({ name: 'appdata' }) : createUniversalObject<Conf>()
