import https from 'https'
import { ofetch } from 'ofetch'

export default ofetch.create({
	baseURL: 'http://localhost:3000',
	// @ts-ignore
	agent: https.Agent({ rejectUnauthorized: false }),
	onRequest() {},
	onResponse() {},
	onResponseError() {}
})
