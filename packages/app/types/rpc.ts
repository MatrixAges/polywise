import type { Router } from '@core/index'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

export type RPCInput = inferRouterInputs<Router>
export type RPCOutput = inferRouterOutputs<Router>
