import { ripgrep } from 'ripgrep'

export interface GrepOptions {
	/** Maximum number of matches to return (default: 100) */
	max_count?: number
	/** Whether the search is case-sensitive (default: false) */
	case_sensitive?: boolean
	/** Whether the keywords are regular expressions (default: false, treats as literal strings) */
	is_regexp?: boolean
	/** Whether to include the filename in the output (default: false) */
	with_filename?: boolean
	/** Whether to include the line number in the output (default: false) */
	with_line_number?: boolean
}

/**
 * Grep utility using ripgrep
 * @param targets File, files or directory to search
 * @param keywords Keyword or keywords to search for
 * @param options Grep options
 * @returns Array of matching lines
 */
export default async (targets: string | Array<string>, keywords: string | Array<string>, options: GrepOptions = {}) => {
	const {
		max_count = 100,
		case_sensitive = false,
		is_regexp = false,
		with_filename = false,
		with_line_number = false
	} = options

	const args: string[] = []

	if (!case_sensitive) args.push('-i')
	if (!is_regexp) args.push('-F')
	if (max_count) args.push('--max-count', max_count.toString())
	if (!with_filename) args.push('--no-filename')
	else args.push('--with-filename')
	if (!with_line_number) args.push('--no-line-number')
	else args.push('--line-number')

	const k_list = Array.isArray(keywords) ? keywords : [keywords]
	for (const k of k_list) {
		args.push('-e', k)
	}

	const t_list = Array.isArray(targets) ? targets : [targets]
	args.push(...t_list)

	const { stdout } = await ripgrep(args, { buffer: true })
	return stdout.split('\n').filter(Boolean)
}
