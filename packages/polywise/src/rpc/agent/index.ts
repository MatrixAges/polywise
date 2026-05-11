import { r } from '@core/utils'

import create from './create'
import createArticle from './createArticle'
import createSession from './createSession'
import getArticles from './getArticles'
import getSessions from './getSessions'
import getSkillLogs from './getSkillLogs'
import getSkills from './getSkills'
import getToolLogs from './getToolLogs'
import pin from './pin'
import query from './query'
import remove from './remove'
import removeArticle from './removeArticle'
import setSkills from './setSkills'
import sort from './sort'
import sortPin from './sortPin'
import update from './update'
import updateArticle from './updateArticle'

export default r({
	create,
	createArticle,
	createSession,
	getArticles,
	getSkillLogs,
	getSessions,
	getSkills,
	getToolLogs,
	pin,
	remove,
	removeArticle,
	query,
	setSkills,
	sort,
	sortPin,
	update,
	updateArticle
})
