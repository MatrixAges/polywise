import { pipeline } from '@core/consts'
import { splitTextByTokenBudget } from '@core/pipeline'

export default async (text: string) => {
	return splitTextByTokenBudget(text, pipeline.max_tokens, pipeline.overlap_size)
}
