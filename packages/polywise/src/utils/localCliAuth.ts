export const polywise_cli_header = 'x-polywise-cli'

const loopback_hostnames = new Set(['localhost', '127.0.0.1', '::1'])
const loopback_remote_addresses = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

export const getRemoteAddress = (env: unknown) => {
	const bindings = env as { incoming?: { socket?: { remoteAddress?: string } } } | undefined

	return bindings?.incoming?.socket?.remoteAddress || null
}

const isLoopbackRequest = (req: Request) => {
	try {
		return loopback_hostnames.has(new URL(req.url).hostname.toLowerCase())
	} catch {
		return false
	}
}

const isLoopbackRemoteAddress = (remote_address?: string | null) =>
	Boolean(remote_address && loopback_remote_addresses.has(remote_address))

export const isLocalCliRequest = (req: Request, remote_address?: string | null) =>
	req.headers.get(polywise_cli_header) === '1' &&
	isLoopbackRequest(req) &&
	(remote_address ? isLoopbackRemoteAddress(remote_address) : true)
