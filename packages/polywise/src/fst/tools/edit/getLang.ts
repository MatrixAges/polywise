import { extname } from 'path'

export default (file_path: string) => {
	const ext = extname(file_path).toLowerCase()

	const map: Record<string, string> = {
		'.ts': 'typescript',
		'.tsx': 'tsx',
		'.js': 'javascript',
		'.jsx': 'jsx',
		'.json': 'json',
		'.md': 'markdown',
		'.css': 'css',
		'.scss': 'scss',
		'.html': 'html',
		'.xml': 'xml',
		'.py': 'python',
		'.rs': 'rust',
		'.go': 'go',
		'.java': 'java',
		'.c': 'c',
		'.cpp': 'cpp',
		'.h': 'c',
		'.hpp': 'cpp',
		'.sql': 'sql',
		'.sh': 'bash',
		'.yaml': 'yaml',
		'.yml': 'yaml',
		'.toml': 'toml',
		'.graphql': 'graphql',
		'.gql': 'graphql'
	}

	return map[ext] ?? 'text'
}
