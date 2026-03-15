import { createOpenApiFetchHandler } from 'trpc-to-openapi'

import { router } from './src/rpc'

async function run() {
	try {
		const req = new Request('http://localhost/openapi/test')
		await createOpenApiFetchHandler({
			endpoint: '/openapi',
			req,
			router,
			onError: ({ error }) => {
				throw error
			}
		})
		console.log('Did not throw')
	} catch (e) {
		console.log('Threw!', e.message)
	}
}
run()
