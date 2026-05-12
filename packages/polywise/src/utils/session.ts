import events from 'events'
import { Group, Session } from '@core/fst'

import { createResumableStreamContext } from './rstream'

export const SessionStore = new Map<string, Session>()
export const GroupStore = new Map<string, Group>()
export const SessionStreamStore = createResumableStreamContext()
export const GroupStreamStore = createResumableStreamContext()
export const SessionEventStore = new events.EventEmitter()
