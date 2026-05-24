import { base_url } from '@website/utils/const'
import { ofetch } from 'ofetch'

export const requestWeb = ofetch.create({
	baseURL: base_url || undefined,
	onRequest() {},
	onResponse() {},
	onResponseError() {}
})

export const request = ofetch.create({
	responseType: 'stream'
})
