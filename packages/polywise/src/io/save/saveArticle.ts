import { getHash } from '@core/utils'

export default async (v: string) => {
	const hash = getHash(v)

	console.log(hash)
}
