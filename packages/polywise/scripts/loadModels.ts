import { getEmbeddingModel, getGenModel, getRerankModel } from '../src/utils'

await Promise.all([getEmbeddingModel(), getRerankModel(), getGenModel()])
