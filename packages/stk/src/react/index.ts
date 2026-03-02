import cx from 'clsx'
import { deepEqual } from 'fast-equals'

export { deepEqual }
export { cx }

export { default as Handle } from './Handle'

export { default as useDeepMemo } from './useDeepMemo'
export { default as useDoubleClick } from './useDoubleClick'
export { default as useSelection } from './useSelection'
export { default as useDeepUpdateEffect } from './useDeepUpdateEffect'

export { default as memo } from './memo'
export { default as createDeepCompareEffect } from './createDeepCompareEffect'

export {
	createContext,
	useContextSelector,
	useContext,
	useContextUpdate,
	BridgeProvider,
	useBridgeValue
} from './useContextSelector'
