import { r } from '@core/utils'

import fullTextSearch from './fullTextSearch'
import hybirdSearch from './hybirdSearch'
import relationSearch from './relationSearch'
import semanticSearch from './semanticSearch'

export default r({
	fullTextSearch,
	semanticSearch,
	relationSearch,
	hybirdSearch
})
