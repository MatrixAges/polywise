import { HTTPException } from 'hono/http-exception'
import Try from 'nice-try'
import { createOpenApiFetchHandler } from 'trpc-to-openapi'

import { router } from '../rpc'

import type { Handler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export default (async c => {
	let req = c.req.raw

	if (req.method !== 'GET') {
		const content_type = req.headers.get('content-type') || ''

		const is_form =
			content_type.includes('application/x-www-form-urlencoded') ||
			content_type.includes('multipart/form-data')

		if (!is_form) {
			const text = await req.clone().text()

			let is_json = false

			if (text) {
				is_json = Try(() => JSON.parse(text))
			}

			if (!text) {
				const headers = new Headers(req.headers)

				headers.set('content-type', 'application/json')

				req = new Request(req.url, {
					method: req.method,
					headers,
					body: '{}'
				})
			} else if (!is_json) {
				const headers = new Headers(req.headers)

				headers.set('content-type', 'application/json')

				req = new Request(req.url, {
					method: req.method,
					headers,
					body: JSON.stringify({ content: text })
				})
			} else if (!req.headers.has('content-type')) {
				const headers = new Headers(req.headers)

				headers.set('content-type', 'application/json')

				req = new Request(req.url, {
					method: req.method,
					headers,
					body: text
				})
			}
		}
	}

	const res = await createOpenApiFetchHandler({ endpoint: '/openapi', req, router })

	if (res.status >= 400) {
		const data = await res.json()

		throw new HTTPException(res.status as ContentfulStatusCode, { cause: data })
	}

	return res
}) as Handler
