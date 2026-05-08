import path from 'path'

import { app } from '../consts'
import loadModel, { verifyLocalModelFile } from './loadModel'

import type { Llama } from 'node-llama-cpp'

export const getEmbeddingModel = async (llama: Llama, status_only?: boolean) => {
	return loadModel(
		{
			llama,
			type: 'embedding',
			model_uri: app.embedding_model.uri,
			dir_path: app.model_dir,
			file_name: app.embedding_model.file_name
		},
		status_only
	)
}

export const getRerankModel = async (llama: Llama, status_only?: boolean) => {
	return loadModel(
		{
			llama,
			type: 'rerank',
			model_uri: app.rerank_model.uri,
			dir_path: app.model_dir,
			file_name: app.rerank_model.file_name
		},
		status_only
	)
}

export const getGenModel = async (llama: Llama, status_only?: boolean) => {
	return loadModel(
		{
			llama,
			type: 'gen',
			model_uri: app.gen_model.uri,
			dir_path: app.model_dir,
			file_name: app.gen_model.file_name
		},
		status_only
	)
}

export const hasEmbeddingModel = async () => {
	return verifyLocalModelFile(path.join(app.model_dir, app.embedding_model.file_name))
}

export const hasRerankModel = async () => {
	return verifyLocalModelFile(path.join(app.model_dir, app.rerank_model.file_name))
}

export const hasGenModel = async () => {
	return verifyLocalModelFile(path.join(app.model_dir, app.gen_model.file_name))
}
