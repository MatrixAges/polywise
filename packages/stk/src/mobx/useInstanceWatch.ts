import { get } from 'es-toolkit/compat'
import { deepEqual } from 'fast-equals'
import { observe, reaction, toJS } from 'mobx'

import type { IValueDidChange } from 'mobx'

type Listener = Record<string, (...args: any) => any>

export default (instance: any) => {
	const watch = instance.watch
	const reactions = {} as Listener
	const observes = {} as Listener
	const multiple_keys = [] as Array<{ key: string; raw: string }>

	Object.keys(watch).map(item => {
		if (item.indexOf('|') !== -1) {
			const targets = item.split('|')

			multiple_keys.push(...targets.map(it => ({ key: it, raw: item })))
		}

		if (item.indexOf('.') !== -1) {
			reactions[item] = watch[item]
		} else {
			observes[item] = watch[item]
		}
	})

	const reactions_disposers = Object.keys(reactions).map(key => {
		return reaction(
			() => get(instance, key),
			(new_value, old_value) => {
				const new_v = toJS(new_value)
				const old_v = toJS(old_value)

				if (!deepEqual(new_v, old_v)) {
					reactions[key](new_v, old_v)
				}
			}
		)
	})

	const observes_disposer = observe(instance, (change: IValueDidChange & { name: string }) => {
		const { name, newValue, oldValue } = change

		const multiple_target = multiple_keys.find(item => {
			if (item.key === name) return item
		})

		if (multiple_target) {
			const match_keys = multiple_target.raw.split('|')

			if (match_keys.includes(name)) {
				watch[multiple_target.raw](match_keys.map(key => get(instance, key)))
			}
		}

		if (watch[name]) {
			const new_v = toJS(newValue)
			const old_v = toJS(oldValue)

			if (!deepEqual(new_v, old_v)) {
				watch[name](new_v, old_v)
			}
		}
	})

	return [...reactions_disposers, observes_disposer]
}
