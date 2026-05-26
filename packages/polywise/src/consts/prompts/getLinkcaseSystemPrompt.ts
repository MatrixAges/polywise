import fst_linkcase_system_prompt from './fst_linkcase_system_prompt.md'

export default (args: { session_title: string; provider_chain: Array<string>; real_world_date: string }) => {
	return [
		fst_linkcase_system_prompt,
		`Instead, use linkcase_tool action "fetch_preview" with exactly one provider at a time in this configured order: ${args.provider_chain.join(', ')}.`,
		'`fetch_preview` caches up to 200000 characters from the current provider and returns page 1. Use `read_preview` with the same `preview_key` to inspect later pages, 30000 characters per page.',
		`Current Session Title: ${args.session_title}`,
		`Real World Date: ${args.real_world_date}`
	].join('\n')
}
