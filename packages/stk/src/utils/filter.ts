import { deepEqual } from 'fast-equals'

export const getComputedStyleValue = (el: Element, property: string) => {
	return Number(getComputedStyle(el).getPropertyValue(property).replace('px', ''))
}

export const getStyleValue = (v: string) => {
	return Number(v.replace('px', ''))
}

export const getExsitValues = (v: any) => {
	Object.keys(v).map(key => {
		if (v[key] === undefined || v[key] === null) {
			delete v[key]
		}

		if (Array.isArray(v[key])) {
			if (!v[key].length) {
				delete v[key]
			}
		}
	})

	return v
}

export function chooseBy<T>(obj: T, condition: boolean) {
	return condition ? obj : {}
}

export const isFormValuesEqual = (form_values: any, new_values: any) => {
	return Object.keys(form_values).reduce((equal, key) => {
		const form_item_value = form_values[key]
		const new_item_value = new_values[key]

		if (form_item_value != new_item_value) {
			if (!deepEqual(form_item_value, new_item_value)) {
				equal = false
			}
		}

		return equal
	}, true)
}

export const getObjectKeys = <O extends object>(obj: O): (keyof O)[] => {
	return Object.keys(obj) as (keyof O)[]
}
