export default (output_str: string) => {
	const subject_pattern = /"subject":\s*"([^"]+)"/
	const predicate_pattern = /"predicate":\s*"([^"]+)"/
	const object_pattern = /"object":\s*"([^"]+)"/

	const subject_match = output_str.match(subject_pattern)
	const predicate_match = output_str.match(predicate_pattern)
	const object_match = output_str.match(object_pattern)

	if (subject_match && predicate_match && object_match) {
		return {
			subject: subject_match[1],
			predicate: predicate_match[1],
			object: object_match[1]
		}
	}

	return null
}
