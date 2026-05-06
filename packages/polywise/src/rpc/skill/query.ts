import { getSkills } from '@core/db/services'
import { p } from '@core/utils'

export default p.query(async () => {
	return getSkills()
})
