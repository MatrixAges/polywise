import { r } from '../../utils/trpc'
import read from './read'
import summarizeWiki from './summarizeWiki'
import update from './update'

export default r({
	read,
	summarizeWiki,
	update
})
