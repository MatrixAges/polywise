import { getLlama } from 'node-llama-cpp'

import { app } from '../src/consts'
import { loadModel } from '../src/utils'

const llama = await getLlama()

await Promise.all([
	loadModel({
		llama,
		model_uri: app.embedding_model.uri,
		dir_path: app.model_dir,
		file_name: app.embedding_model.file_name
	}),
	loadModel({
		llama,
		model_uri: app.rerank_model.uri,
		dir_path: app.model_dir,
		file_name: app.rerank_model.file_name
	})
])
