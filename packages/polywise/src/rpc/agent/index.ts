import { r } from '@core/utils'

import addArticle from './addArticle'
import create from './create'
import createSession from './createSession'
import exportPack from './exportPack'
import extractPrivateArticle from './extractPrivateArticle'
import getArticles from './getArticles'
import getGraph from './getGraph'
import getPrivateArticlePipelineBatch from './getPrivateArticlePipelineBatch'
import getPrivateArticles from './getPrivateArticles'
import getRelatedArticles from './getRelatedArticles'
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
import setPrivateArticlePipelineBatch from './setPrivateArticlePipelineBatch'
import setSkills from './setSkills'
import sort from './sort'
import sortPin from './sortPin'
import update from './update'

export default r({
	addArticle,
	create,
	createSession,
	extractPrivateArticle,
	exportPack,
	getArticles,
	getGraph,
	getPrivateArticlePipelineBatch,
	getPrivateArticles,
	getRelatedArticles,
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
	setPrivateArticlePipelineBatch,
	setSkills,
	sort,
	sortPin,
	update
})
