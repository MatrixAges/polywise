import { r } from '@core/utils'

import addArticle from './addArticle'
import create from './create'
import createSession from './createSession'
import exportPack from './exportPack'
import getArticles from './getArticles'
import getSessions from './getSessions'
import getSkillLogs from './getSkillLogs'
import getSkills from './getSkills'
import getToolLogs from './getToolLogs'
import importPack from './importPack'
import pin from './pin'
import query from './query'
import remove from './remove'
import removeArticle from './removeArticle'
import savePrivateArticle from './savePrivateArticle'
import searchArticles from './searchArticles'
import setSkills from './setSkills'
import sort from './sort'
import sortPin from './sortPin'
import update from './update'

export default r({
	addArticle,
	create,
	createSession,
	exportPack,
	getArticles,
	getSkillLogs,
	getSessions,
	getSkills,
	getToolLogs,
	importPack,
	pin,
	remove,
	removeArticle,
	query,
	savePrivateArticle,
	searchArticles,
	setSkills,
	sort,
	sortPin,
	update
})
