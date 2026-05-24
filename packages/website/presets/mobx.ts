import '@abraham/reflection'

import { configure } from 'mobx'
import { enableStaticRendering } from 'mobx-react-lite'

enableStaticRendering(typeof window === 'undefined')
configure({ enforceActions: 'never' })
