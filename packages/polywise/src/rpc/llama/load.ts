import getModelContext from '@core/llama/getModelContext'
import { p } from '@core/utils'
import { enum as Enum } from 'zod'

const input_type = Enum(['embedding', 'rerank', 'gen'])

export default p.input(input_type).mutation(async ({ input }) => {
	getModelContext(input, true)
})
