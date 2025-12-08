export function setPrefix(str: string) {
	window.__storage_prefix__ = `${str}:`
}

export const proxyMap = new WeakMap<object, object>()

export interface StorageLike {
	[x: string]: any
	clear(): void
	getItem(key: string): string | null
	key(key: number): string | null
	setItem(key: string, value: string): void
	removeItem(key: string): void
	length: number
}

export interface Storage extends StorageLike {
	on: (key: string, callback: EffectFn) => () => void
	off: (key: string, callback: EffectFn) => void
	once: (key: string, callback: EffectFn) => void
}

export type StorageValue = string | object | null

export interface TargetObject {
	type: string
	value: string | object
	expires?: ExpiresType
}

export interface ActiveEffect {
	storage: object
	key: string
	proxy: any
}
export const activeEffect: ActiveEffect = { storage: {}, key: '', proxy: {} }

export let shouldTrack = true
export function pauseTracking() {
	shouldTrack = false
}
export function enableTracking() {
	shouldTrack = true
}

export type EffectFn<V = any, OV = any> = (value?: V, oldValue?: OV) => any
export interface Effect {
	ctx: any
	fn: EffectFn
}
export type EffectMap = Map<string, Effect[]>

export type ExpiresType = string | number | Date
export function createExpiredFunc(target: object, key: string) {
	return function () {
		delete target[key]
	}
}
