import { safeStorage } from 'electron'

export const encode = (obj: any) => {
	return safeStorage.encryptString(JSON.stringify(obj)).toString('base64')
}

export const decode = (str: string) => {
	const target = safeStorage.decryptString(Buffer.from(str, 'base64'))

	return JSON.parse(target)
}
