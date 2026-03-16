import { xxh3 } from '@node-rs/xxhash'

export default (v: string) => {
	const source_buffer = Buffer.from(v)
	const big_int = xxh3.xxh128(source_buffer)
	const hex = big_int.toString(16).padStart(32, '0')
	const target_buffer = Buffer.from(hex, 'hex')

	return target_buffer.toString('base64url')
}
