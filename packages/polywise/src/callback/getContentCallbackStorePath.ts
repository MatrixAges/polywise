import path from 'node:path'

export default (session_dir: string) => {
	return path.resolve(session_dir, 'callback', 'content.json')
}
