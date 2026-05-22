import { r } from '../../utils/trpc'
import read from './read'
import summarizeWiki from './summarizeWiki'

export default r({
	read,
	summarizeWiki
})
