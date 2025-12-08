import { useUpdateEffect } from 'ahooks'

import createDeepCompareEffect from './createDeepCompareEffect'

// @ts-ignore
export default createDeepCompareEffect(useUpdateEffect)
