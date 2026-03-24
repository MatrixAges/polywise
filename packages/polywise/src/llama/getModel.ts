import { app } from '../consts'
import loadModel from './loadModel'

import type { Llama } from 'node-llama-cpp'

export const getEmbeddingModel = async (llama: Llama) => {
	return loadModel({
		llama,
		type: 'embedding',
		model_uri: app.embedding_model.uri,
		dir_path: app.model_dir,
		file_name: app.embedding_model.file_name
	})
}

export const getRerankModel = async (llama: Llama) => {
	return loadModel({
		llama,
		type: 'rerank',
		model_uri: app.rerank_model.uri,
		dir_path: app.model_dir,
		file_name: app.rerank_model.file_name
	})
}

export const getGenModel = async (llama: Llama) => {
	return loadModel({
		llama,
		type: 'gen',
		model_uri: app.gen_model.uri,
		dir_path: app.model_dir,
		file_name: app.gen_model.file_name
	})
}
