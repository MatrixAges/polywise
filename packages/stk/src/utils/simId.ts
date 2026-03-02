interface Args {
	prefix?: string
	size?: number
}

export default (args?: Args) => {
	const { prefix, size = 12 } = args || {}

	const seed = 'userandom26T198340PX75pxJACKVERYMINDBUSHWOLFGQZbfghjklqvwyzrict'
	const array = new Uint8Array(size)

	window.crypto.getRandomValues(array)

	let result = ''

	for (let i = 0; i < size; i++) {
		result += seed[array[i] % seed.length]
	}

	return (prefix ? `${prefix}_` : '') + result
}
