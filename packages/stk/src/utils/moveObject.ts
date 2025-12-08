export default <T extends object, K extends keyof T>(obj: T, from_key: K, to_key: K): T => {
	const keys = Object.keys(obj) as (keyof T)[]
	const from_index = keys.indexOf(from_key)
	const to_index = keys.indexOf(to_key)

	if (from_index === -1 || to_index === -1 || from_index === to_index) {
		return obj
	}

	const new_keys = [...keys]

	new_keys.splice(from_index, 1)
	new_keys.splice(to_index, 0, from_key)

	const new_obj: T = {} as T

	new_keys.forEach(key => {
		new_obj[key] = obj[key]
	})

	return new_obj
}
