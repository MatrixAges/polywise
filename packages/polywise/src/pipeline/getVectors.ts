import getEmbedding from './getEmbedding'

export default async (v: Array<string>) => {
	return Promise.all(v.map(item => getEmbedding(item)))
}
