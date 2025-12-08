export default async (string: string) => {
	const message_buffer = new TextEncoder().encode(string)
	const hash_buffer = await crypto.subtle.digest('SHA-256', message_buffer)
	const hash_array = Array.from(new Uint8Array(hash_buffer))
	const hash_hex = hash_array.map(b => b.toString(16).padStart(2, '0')).join('')

	return hash_hex
}
