import type { RPCOutput } from '@/types'

export type NotificationList = RPCOutput['notification']['query']
export type NotificationItem = NotificationList[number]
