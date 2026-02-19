import PolySaveUtilityProcess from './manager'

import type { ProcessArticleArgs } from 'polywise'

type SaveWithUtilityProcessArgs = {
	input: ProcessArticleArgs
	data_dir: string
	fallback: (input: ProcessArticleArgs) => Promise<string>
}

const poly_save_utility_process = new PolySaveUtilityProcess()

const saveWithUtilityProcess = async (args: SaveWithUtilityProcessArgs) => {
	const { input, data_dir, fallback } = args

	try {
		return await poly_save_utility_process.save(input, data_dir)
	} catch {
		return await fallback(input)
	}
}

export default saveWithUtilityProcess
