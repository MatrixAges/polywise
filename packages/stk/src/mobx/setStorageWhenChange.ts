import { get, observe, set } from 'mobx'

import { local, session } from '../storage'

import type { IValueDidChange } from 'mobx'

interface Options {
	useSession?: boolean
}

type KeyMap = Record<string, string | ((v: any) => any) | Handlers> | string

interface Handlers {
	local_key?: string
	fromStorage: (v: any) => any
	toStorage: (v: any) => any
}

const getKeyValue = (key_map: KeyMap) => {
	if (typeof key_map === 'string') {
		return { local_key: key_map, proxy_key: key_map }
	} else {
		const temp = Object.keys(key_map)
		const key = temp[0]
		const value = key_map[key]

		if (typeof value === 'function') {
			return { local_key: key, proxy_key: key, getHandler: value }
		}

		if (value && typeof value === 'object') {
			return {
				local_key: value.local_key || key,
				proxy_key: key,
				fromStorage: value.fromStorage,
				toStorage: value.toStorage
			}
		}

		return { local_key: key, proxy_key: value }
	}
}

export default (keys: Array<KeyMap>, instance: any, options?: Options) => {
	const storage = options?.useSession ? session : local

	keys.map(key => {
		const target = getKeyValue(key)
		const local_value = storage.getItem(target.local_key)

		if (local_value !== undefined) {
			if (target.fromStorage) {
				set(instance, target.proxy_key, target.fromStorage(local_value))
			} else {
				if (target.getHandler) {
					set(instance, target.proxy_key, target.getHandler(local_value))
				} else {
					set(instance, target.proxy_key, local_value)
				}
			}
		} else {
			if (target.toStorage) {
				storage.setItem(target.local_key, target.toStorage(get(instance, target.proxy_key)))
			} else {
				storage.setItem(target.local_key, get(instance, target.proxy_key))
			}
		}
	})

	return observe(instance, ({ name, newValue }: IValueDidChange & { name: string }) => {
		keys.map(key => {
			const target = getKeyValue(key)

			if (name === target.proxy_key) {
				if (target.toStorage) {
					storage.setItem(target.local_key, target.toStorage(newValue))
				} else {
					storage.setItem(target.local_key, newValue)
				}
			}
		})
	})
}
