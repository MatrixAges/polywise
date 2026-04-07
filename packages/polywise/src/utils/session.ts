import events from 'events'

import { createResumableStreamContext } from './rstream'

import type { Session } from '@core/fst'

export const SessionStore = new Map<string, Session>()
export const SessionStreamStore = createResumableStreamContext()
export const SessionEventStore = new events.EventEmitter()
