import type { RPCOutput } from '@/types'

export type PipelineList = RPCOutput['pipeline']['query']
export type PipelineItem = PipelineList[number]
