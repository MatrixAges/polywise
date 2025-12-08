import { encode } from '@/storage/proxy/transform'
import { ExpiresType, proxyMap } from '@/storage/shared'
import { isDate, isObject, isString, transformJSON } from '@/storage/utils'

export function setExpires(target: object, property: string, value: ExpiresType, receiver: any) {
	let time: number
	if (isDate(value)) {
		time = value.getTime()
	} else if (isString(value)) {
		time = +value.padEnd(13, '0')
	} else {
		time = value
	}
	if (time <= Date.now()) {
		delete receiver[property]
		return undefined
	}

	let data = receiver[property]
	if (!data) {
		return undefined
	}
	data = proxyMap.get(data) || data

	target[`${window.__storage_prefix__ || ''}${property}`] = encode(data, '' + time)
	return new Date(time)
}

export function getExpires(target: object, property: string) {
	const key = `${window.__storage_prefix__ || ''}${property}`
	if (!target[key]) {
		return undefined
	}
	let data = transformJSON(target[key])
	if (!isObject(data) || !data.expires || +data.expires <= Date.now()) {
		return undefined
	}
	return new Date(+data.expires)
}

export function removeExpires(target: object, property: string, receiver: any) {
	let data = receiver[property]
	if (!data) {
		return undefined
	}
	data = proxyMap.get(data) || data

	target[`${window.__storage_prefix__ || ''}${property}`] = encode(data)

	return undefined
}
