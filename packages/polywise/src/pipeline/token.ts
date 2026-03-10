import { env } from '@core/env'

import type { Token } from 'node-llama-cpp'

export const encode = (text: string) => {
	return env.embedding_model.tokenize(text)
}

export const decode = (tokens: Array<Token>) => {
	return env.embedding_model.detokenize(tokens)
}

export const getTokenCount = (text: string) => {
	return encode(text).length
}
