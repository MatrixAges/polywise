import { all_providers } from '@core/consts/providers'
import { p } from '@core/utils'
import { any } from 'zod'

const output_type = any()

export default p.output(output_type).query(async () => {
	return all_providers
})
