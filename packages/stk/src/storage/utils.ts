import { TargetObject } from './shared'

export const isArray = Array.isArray
export const isSet = (val: unknown): val is Set<any> => getTypeString(val) === '[object Set]'
export const isMap = (val: unknown): val is Map<any, any> => getTypeString(val) === '[object Map]'

export const isDate = (val: unknown): val is Date => getTypeString(val) === '[object Date]'
export const isRegExp = (val: unknown): val is RegExp => getTypeString(val) === '[object RegExp]'
export const isFunction = (val: unknown): val is Function => typeof val === 'function'
export const isNumber = (val: unknown): val is number => typeof val === 'number'
export const isString = (val: unknown): val is string => typeof val === 'string'
export const isObject = (val: unknown): val is Record<any, any> => val !== null && typeof val === 'object'

export const isIntegerKey = (key: unknown) =>
	typeof key === 'string' && key !== 'NaN' && key[0] !== '-' && '' + parseInt(key, 10) === key

export const getTypeString = (value: unknown): string => Object.prototype.toString.call(value)

export const getRawType = (value: unknown): string => {
	return getTypeString(value).slice(8, -1)
}

export const hasChanged = (value: any, oldValue: any): boolean => !Object.is(value, oldValue)

export function transformJSON(data: string): TargetObject | string {
	try {
		return JSON.parse(data)
	} catch (e) {
		return data
	}
}

// prototies exist in the prototype chain
export function propertyIsInPrototype(object: object, prototypeName: string) {
	return !object.hasOwnProperty(prototypeName) && prototypeName in object
}

const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (val: object, key: string | symbol): key is keyof typeof val => hasOwnProperty.call(val, key)

export function transformEval(code: string) {
	// runs in the global scope rather than the local one
	const eval2 = eval
	return (function () {
		return eval2(code)
	})()
}
