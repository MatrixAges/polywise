import type { FlatObject, NestedObject } from '@/types'

const Index = <T extends NestedObject>(input: T, prefix: string = ''): FlatObject<T> => {
	const result: Record<string, string> = {}

	for (const key in input) {
		if (Object.prototype.hasOwnProperty.call(input, key)) {
			const value = input[key]
			const new_key = prefix ? `${prefix}.${key}` : key

			if (typeof value === 'object' && value !== null) {
				const flat_object = Index(value as NestedObject, new_key)

				for (const flat_key in flat_object) {
					if (Object.prototype.hasOwnProperty.call(flat_object, flat_key)) {
						result[flat_key] = flat_key
					}
				}
			} else {
				result[new_key] = new_key
			}
		}
	}

	return result as FlatObject<T>
}

export default Index
