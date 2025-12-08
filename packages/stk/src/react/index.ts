import { deepEqual } from 'fast-equals'

export { default as memo } from './memo'
export { default as handle } from './handle'
export { default as createDeepCompareEffect } from './createDeepCompareEffect'
export {
	createContext,
	useContextSelector,
	useContext,
	useContextUpdate,
	BridgeProvider,
	useBridgeValue
} from './useContextSelector'
export { default as useDeepMemo } from './useDeepMemo'
export { default as useDoubleClick } from './useDoubleClick'
export { default as useSelection } from './useSelection'
export { default as useDeepUpdateEffect } from './useDeepUpdateEffect'

export { deepEqual }
