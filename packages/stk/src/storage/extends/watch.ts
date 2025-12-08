import { Effect, EffectFn, EffectMap } from '@/storage/shared'

let targetMap = new WeakMap<Object, EffectMap>()

export function on(this: any, target: object, key: string, fn: EffectFn) {
	const effect: Effect = {
		ctx: this,
		fn
	}

	let effectMap = targetMap.get(target)
	if (!effectMap) {
		targetMap.set(target, (effectMap = new Map()))
	}
	const effects: Effect[] | undefined = effectMap.get(key)
	if (effects) {
		effects.push(effect)
	} else {
		effectMap.set(key, [effect] as Effect[])
	}

	return () => off(target, key, fn)
}

export function once(this: any, target: object, key: string, fn: EffectFn) {
	const that = this
	const wrapped = (value: any, oldValue: any) => {
		off(target, key, wrapped)
		fn.call(that, value, oldValue)
	}
	// in order to filter
	wrapped.fn = fn
	on(target, key, wrapped)
}

export function off(target: object, key?: string, fn?: EffectFn) {
	if (key === undefined) {
		targetMap.set(target, new Map())
		return
	}

	let effectMap: EffectMap | undefined = targetMap.get(target)
	if (effectMap) {
		const effects: Effect[] | undefined = effectMap.get(key)
		if (effects && effects.length > 0) {
			let value: Effect[] = []
			if (fn) {
				value = effects.filter(ele => !(ele.fn === fn || (ele as any).fn?.fn === fn))
			}
			effectMap.set(key, value)
		}
	}
}

export function emit(target: object, key: string, ...args: any[]) {
	const effectMap: EffectMap | undefined = targetMap.get(target)
	if (effectMap) {
		const effects: Effect[] | undefined = effectMap.get(key)
		if (effects) {
			const [value, oldValue] = args
			effects.forEach(ele => ele.fn.call(ele.ctx, value, oldValue))
		}
	}
}
