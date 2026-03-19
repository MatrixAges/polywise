import { p, setWindowGlass } from '@desktop/utils'
import { boolean, object } from 'zod'

const input_type = object({ glass: boolean() })

export default p.input(input_type).mutation(async ({ input, ctx }) => {
	const { glass } = input

	setWindowGlass(ctx.win, glass)
})
