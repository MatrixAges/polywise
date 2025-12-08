import { memo } from 'react'
import { deepEqual } from 'fast-equals'

import type { ComponentType, MemoExoticComponent } from 'react'

type Memo = <T extends ComponentType<any>>(Component: T) => MemoExoticComponent<T>

const Index: Memo = el => memo(el, (prev, next) => deepEqual(prev, next))

export default Index
