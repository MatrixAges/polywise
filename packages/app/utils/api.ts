import { hc } from 'hono/client'

import { server_sys_url } from '@/appdata'

import type { Api } from '@core/api'

export default hc<Api>(server_sys_url)
