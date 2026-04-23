import path from 'path'
import fs from 'fs-extra'

const readProjectFile = async (project_dir: string, file_path: string) => {
	const target_path = path.isAbsolute(file_path) ? file_path : path.resolve(project_dir, file_path)

	if (!(await fs.pathExists(target_path))) {
		return ''
	}

	return fs.readFile(target_path, 'utf8')
}

export default readProjectFile
