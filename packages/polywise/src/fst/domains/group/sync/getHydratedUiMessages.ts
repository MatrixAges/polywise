import hydrateGroupMessage from './hydrateGroupMessage'

import type Session from '../../../session'

export default (s: Session) => s.ui_messages.map(message => hydrateGroupMessage(s, message))
