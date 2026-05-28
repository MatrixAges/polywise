import events from 'events'
import { Session } from '@core/fst'

import { createResumableStreamContext } from './rstream'

export const SessionStore = new Map<string, Session>()
export const GroupStore = new Map<string, Session>()
export const SessionStreamStore = createResumableStreamContext()
export const GroupStreamStore = createResumableStreamContext()
export const SessionEventStore = new events.EventEmitter()
