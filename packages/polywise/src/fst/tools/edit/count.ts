export default (patch: string) => {
	let add_lines = 0
	let remove_lines = 0

	for (const line of patch.split('\n')) {
		if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) continue
		if (line.startsWith('+')) add_lines++
		if (line.startsWith('-')) remove_lines++
	}

	return { add_lines, remove_lines }
}
