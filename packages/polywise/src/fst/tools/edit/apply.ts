import type { Operation } from './types'

export default (original_content: string, edits: Array<Operation>) => {
	let final_content = original_content

	for (const edit of edits) {
		if (edit.old_string && !final_content.includes(edit.old_string)) {
			throw new Error('old_string not found in file. Ensure exact match including whitespace and newlines')
		}

		final_content = edit.old_string ? final_content.replace(edit.old_string, edit.new_string) : edit.new_string
	}

	return final_content
}
