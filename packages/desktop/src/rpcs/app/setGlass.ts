import { boolean, object } from 'zod'

import { p, setWindowGlass } from '@desktop/utils'

const input_type = object({ glass: boolean() })

export default p.input(input_type).mutation(async ({ input, ctx }) => {
	const { glass } = input

	setWindowGlass(ctx.win, glass)
})
