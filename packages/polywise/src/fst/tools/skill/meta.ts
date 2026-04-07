export default (content: string): { name: string; description: string } | null => {
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)

	if (!match) return null

	const frontmatter = match[1]
	const name_match = frontmatter.match(/^name:\s*(.+)$/m)
	const desc_match = frontmatter.match(/^description:\s*(.+)$/m)

	if (!name_match) return null

	return {
		name: name_match[1].trim(),
		description: desc_match ? desc_match[1].trim() : ''
	}
}
